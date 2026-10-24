import session from 'express-session';

const DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_SESSION_DAYS = 30;

// Session lifetime in ms, from SESSION_MAX_AGE_DAYS (default 30 days).
export function getSessionMaxAge(env = process.env) {
    const days = Number(env.SESSION_MAX_AGE_DAYS);
    return Number.isFinite(days) && days > 0 ? days * DAY_MS : DEFAULT_SESSION_DAYS * DAY_MS;
}

export function getCookieOptions(env = process.env) {
    return {
        maxAge: getSessionMaxAge(env),
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax' // 'lax' so the cookie survives the redirect back from Twitter
    };
}

// Postgres-backed express-session store so sessions survive server restarts.
export class PgSessionStore extends session.Store {
    constructor(pool, { tableName = 'user_sessions', maxAge = getSessionMaxAge() } = {}) {
        super();
        if (!/^[a-z_][a-z0-9_]*$/i.test(tableName)) {
            throw new Error('Invalid session table name');
        }
        this.pool = pool;
        this.table = tableName;
        this.maxAge = maxAge;
        this.ready = pool.query(
            `CREATE TABLE IF NOT EXISTS ${this.table} (
                sid TEXT PRIMARY KEY,
                sess JSONB NOT NULL,
                expire TIMESTAMPTZ NOT NULL
            )`
        ).then(() => pool.query(
            `DELETE FROM ${this.table} WHERE expire < NOW()`
        )).catch((err) => {
            console.error('Session store init error:', err.message);
        });
    }

    expiry(sess) {
        const expires = sess && sess.cookie && sess.cookie.expires;
        const ms = expires ? new Date(expires).getTime() : Date.now() + this.maxAge;
        return new Date(Number.isFinite(ms) ? ms : Date.now() + this.maxAge);
    }

    get(sid, cb) {
        this.ready
            .then(() => this.pool.query(
                `SELECT sess FROM ${this.table} WHERE sid = $1 AND expire >= NOW()`, [sid]
            ))
            .then((r) => cb(null, r.rows[0] ? r.rows[0].sess : null))
            .catch((err) => cb(err));
    }

    set(sid, sess, cb = () => {}) {
        this.ready
            .then(() => this.pool.query(
                `INSERT INTO ${this.table} (sid, sess, expire) VALUES ($1, $2, $3)
                 ON CONFLICT (sid) DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire`,
                [sid, JSON.stringify(sess), this.expiry(sess)]
            ))
            .then(() => cb(null))
            .catch((err) => cb(err));
    }

    destroy(sid, cb = () => {}) {
        this.ready
            .then(() => this.pool.query(`DELETE FROM ${this.table} WHERE sid = $1`, [sid]))
            .then(() => cb(null))
            .catch((err) => cb(err));
    }

    touch(sid, sess, cb = () => {}) {
        this.ready
            .then(() => this.pool.query(
                `UPDATE ${this.table} SET expire = $2 WHERE sid = $1`, [sid, this.expiry(sess)]
            ))
            .then(() => cb(null))
            .catch((err) => cb(err));
    }
}
