import test from 'node:test';
import assert from 'node:assert/strict';
import { getSessionMaxAge, getCookieOptions, PgSessionStore } from '../sessionConfig.js';

const DAY = 86400000;

function fakePool() {
    const rows = new Map();
    return {
        async query(sql, params) {
            if (/^\s*INSERT/.test(sql)) rows.set(params[0], { sess: JSON.parse(params[1]), expire: params[2] });
            else if (/^\s*DELETE FROM \w+ WHERE sid/.test(sql)) rows.delete(params[0]);
            else if (/^\s*SELECT/.test(sql)) {
                const r = rows.get(params[0]);
                return { rows: r && r.expire > new Date() ? [{ sess: r.sess }] : [] };
            }
            return { rows: [] };
        }
    };
}

const call = (fn, ...args) => new Promise((res, rej) => fn(...args, (e, v) => (e ? rej(e) : res(v))));

test('default lifetime is 30 days; env override and invalid values handled', () => {
    assert.equal(getSessionMaxAge({}), 30 * DAY);
    assert.equal(getSessionMaxAge({ SESSION_MAX_AGE_DAYS: '7' }), 7 * DAY);
    assert.equal(getSessionMaxAge({ SESSION_MAX_AGE_DAYS: 'abc' }), 30 * DAY);
});

test('cookie options are httpOnly, secure in production', () => {
    assert.equal(getCookieOptions({ NODE_ENV: 'production' }).secure, true);
    assert.equal(getCookieOptions({}).secure, false);
    assert.equal(getCookieOptions({}).httpOnly, true);
});

test('session restore, expiry and logout', async () => {
    const store = new PgSessionStore(fakePool());
    await call(store.set.bind(store), 'a', { user: { id: 1 }, cookie: { expires: new Date(Date.now() + DAY) } });
    assert.deepEqual((await call(store.get.bind(store), 'a')).user, { id: 1 });
    await call(store.set.bind(store), 'b', { cookie: { expires: new Date(Date.now() - 1000) } });
    assert.equal(await call(store.get.bind(store), 'b'), null);
    await call(store.destroy.bind(store), 'a');
    assert.equal(await call(store.get.bind(store), 'a'), null);
});
