import express from 'express';
import got from 'got';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';
import qs from 'querystring';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session'; // Import express-session

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Initialize express-session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Set secure flag in production
}));


const consumer_key = process.env.CONSUMER_KEY;
const consumer_secret = process.env.CONSUMER_SECRET;
const callback_url = process.env.CALLBACK_URL || 'http://localhost:3000/callback';

// Add this near the top of your server.js with other initializations  
const sessions = new Map();
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});  

// Verify environment variables
console.log('Environment check:');
console.log('Consumer key length:', consumer_key?.length);
console.log('Consumer secret length:', consumer_secret?.length);
console.log('Callback URL:', callback_url);

if (!consumer_key || !consumer_secret) {
    throw new Error('Missing required environment variables');
}

const requestTokenURL = 'https://api.twitter.com/oauth/request_token';
const authorizeURL = new URL('https://api.twitter.com/oauth/authorize');
const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
const endpointURL = 'https://api.twitter.com/2/tweets';
const searchURL = 'https://api.twitter.com/2/tweets/search/recent';

const oauth = OAuth({
    consumer: { 
        key: consumer_key, 
        secret: consumer_secret 
    },
    signature_method: 'HMAC-SHA1',
    hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64'),
    parameter_separator: ',',
    nonce_length: 32
});

async function requestToken() {
    try {
        const requestData = {
            url: requestTokenURL,
            method: 'POST',
            data: { oauth_callback: callback_url }
        };

        const authHeader = oauth.toHeader(oauth.authorize(requestData));

        console.log('Request URL:', requestTokenURL);
        console.log('Callback URL:', callback_url);

        const req = await got.post(requestTokenURL, {
            headers: { 
                Authorization: authHeader["Authorization"]
            },
            form: {
                oauth_callback: callback_url
            },
            throwHttpErrors: false
        });

        console.log('Response status:', req.statusCode);
        console.log('Response body:', req.body);

        if (req.statusCode !== 200) {
            console.error('Twitter API error response:', req.body);
            throw new Error(`Twitter API error: ${req.body}`);
        }

        if (req.body) {
            return qs.parse(req.body);
        } else {
            throw new Error('Cannot get OAuth request token');
        }
    } catch (error) {
        console.error('Full error:', error);
        throw error;
    }
}

async function accessToken(oauth_token, oauth_token_secret, oauth_verifier) {
    try {
        const requestData = {
            url: accessTokenURL,
            method: 'POST',
            data: {
                oauth_token,
                oauth_verifier
            }
        };

        const authHeader = oauth.toHeader(oauth.authorize(requestData));

        const req = await got.post(accessTokenURL, {
            headers: { Authorization: authHeader["Authorization"] },
            form: {
                oauth_token,
                oauth_verifier
            },
            throwHttpErrors: false
        });

        console.log('Access token response status:', req.statusCode);
        console.log('Access token response body:', req.body);

        if (req.statusCode !== 200) {
            throw new Error(`Twitter API error: ${req.body}`);
        }

        if (req.body) {
            return qs.parse(req.body);
        } else {
            throw new Error('Cannot get OAuth access token');
        }
    } catch (error) {
        console.error('Access token error:', error);
        throw error;
    }
}

async function postTweet(oauth_token, oauth_token_secret, tweetText) {
    const token = {
        key: oauth_token,
        secret: oauth_token_secret
    };

    const requestData = {
        url: endpointURL,
        method: 'POST'
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    const req = await got.post(endpointURL, {
        json: { text: tweetText },
        responseType: 'json',
        headers: {
            Authorization: authHeader["Authorization"],
            'user-agent': "v2CreateTweetJS",
            'content-type': "application/json",
            'accept': "application/json"
        },
        throwHttpErrors: false
    });

    if (req.statusCode !== 201) {
        throw new Error(`Twitter API error: ${JSON.stringify(req.body)}`);
    }

    return req.body;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/auth/twitter', async (req, res) => {
    try {
        const oAuthRequestToken = await requestToken();

        req.session.oauthRequestToken = oAuthRequestToken; // Store in session

        authorizeURL.searchParams.set('oauth_token', oAuthRequestToken.oauth_token);
        res.redirect(authorizeURL.href);
    } catch (e) {
        console.error('Error during Twitter auth:', e);
        res.redirect('/?error=' + encodeURIComponent(e.message));
    }
});

// Update the auth status endpoint to include user info  
app.get('/auth/status', (req, res) => {  
    res.json({  
        authenticated: !!req.session.user,  // Check session for user
        user: req.session.user,  // Send user data from session
        timestamp: new Date().toISOString()  
    });  
});  

// Update the callback endpoint to store user info  
app.get('/callback', async (req, res) => {  
    try {  
        const { oauth_token, oauth_verifier } = req.query;  
        const oauth_token_secret = req.session.oauthRequestToken.oauth_token_secret;

        if (!oauth_token_secret) {  
            throw new Error('OAuth token not found in session');  
        }  

        const oAuthAccessToken = await accessToken(  
            oauth_token,  
            oauth_token_secret,  
            oauth_verifier  
        );  

        console.log('OAuth response:', {  
            ...oAuthAccessToken,  
            oauth_token: '***hidden***',  
            oauth_token_secret: '***hidden***'  
        });  

        // Store user info in session
        req.session.user = {
            token: oAuthAccessToken.oauth_token,
            token_secret: oAuthAccessToken.oauth_token_secret,
            user_id: oAuthAccessToken.user_id,
            screen_name: oAuthAccessToken.screen_name
        };

        delete req.session.oauthRequestToken; //Clean up request token
        res.redirect('/?success=true');  
    } catch (e) {  
        console.error('Error during callback:', e);  
        res.redirect('/?error=' + encodeURIComponent(e.message));  
    }  
});

// Add logout endpoint
app.post('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error during logout' });
        }
        res.json({ success: true });
    });
});

// Modify your /tweet endpoint in server.js to store history  
app.post('/tweet', async (req, res) => {  
    try {  
        const { text } = req.body;  
        const accessTokens = req.session.user; //Get access tokens from session

        if (!accessTokens) {  
            return res.status(401).json({   
                success: false,   
                error: 'Not authenticated. Please authorize first.'   
            });  
        }  

        const response = await postTweet(  
            accessTokens.token,  
            accessTokens.token_secret,  
            text  
        );  

        const tweetId = response.data.id;  
        const timestamp = new Date().toISOString();  

        // Store in database first
        await pool.query(
            'INSERT INTO tweets (id, text, timestamp, url, user_id, screen_name, deleted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [
                tweetId,
                text,
                timestamp,
                `https://twitter.com/i/web/status/${tweetId}`,
                accessTokens.user_id,
                accessTokens.screen_name,
                false
            ]
        );

        // Then send response
        res.json({   
            success: true,   
            response,  
            tweet: {  
                id: tweetId,  
                text: text,  
                timestamp: timestamp,  
                url: `https://twitter.com/i/web/status/${tweetId}`,  
                user_id: accessTokens.user_id,  
                screen_name: accessTokens.screen_name  
            }  
        });  
    } catch (e) {  
        console.error('Error posting tweet:', e);  
        res.status(500).json({   
            success: false,   
            error: e.message   
        });  
    }  
});  

// Add a debug endpoint to check what's stored in sessions  
app.get('/debug/session', (req, res) => {  
    res.json({  
        hasAccessTokens: !!req.session.user,  // Check session for user
        sessionData: req.session.user ? {  
            ...req.session.user,  
            token: '***hidden***',  
            token_secret: '***hidden***'  
        } : null  
    });  
});  


app.get('/tweet/history', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tweets ORDER BY timestamp DESC'
        );
        res.json(result.rows);
    } catch (e) {
        console.error('Database error:', e);
        res.status(500).json({
            success: false,
            error: 'Database error'
        });
    }
});  

  

app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
    console.log('Visit http://localhost:3000 to start');
});

async function deleteTweet(oauth_token, oauth_token_secret, tweet_id) {
    const token = {
        key: oauth_token,
        secret: oauth_token_secret
    };

    const requestData = {
        url: `${endpointURL}/${tweet_id}`,
        method: 'DELETE'
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    const req = await got.delete(`${endpointURL}/${tweet_id}`, {
        responseType: 'json',
        headers: {
            Authorization: authHeader["Authorization"],
            'user-agent': "v2DeleteTweetJS",
            'content-type': "application/json",
            'accept': "application/json"
        },
        throwHttpErrors: false
    });

    if (req.statusCode !== 200) {
        throw new Error(`Twitter API error: ${JSON.stringify(req.body)}`);
    }

    return req.body;
}

app.delete('/tweet/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const accessTokens = req.session.user; //Get access tokens from session

        if (!accessTokens) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated'
            });
        }

        await deleteTweet(
            accessTokens.token,
            accessTokens.token_secret,
            id
        );

        await pool.query(
            'UPDATE tweets SET deleted = true WHERE id = $1',
            [id]
        );

        res.json({ 
            success: true,
            message: "Tweet deleted successfully" 
        });
    } catch (e) {
        console.error('Error deleting tweet:', e);
        res.status(500).json({
            success: false,
            error: e.message
        });
    }
});

async function searchTweets(oauth_token, oauth_token_secret) {
    try {
        const token = {
            key: oauth_token,
            secret: oauth_token_secret
        };

        const query = '#SaveSoil';
        const requestData = {
            url: `${searchURL}?query=${encodeURIComponent(query)}&max_results=10&tweet.fields=created_at,author_id,text&expansions=author_id&user.fields=username`,
            method: 'GET'
        };

        const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

        const req = await got(requestData.url, {
            responseType: 'json',
            headers: {
                Authorization: authHeader["Authorization"],
                'user-agent': "v2TweetSearchJS",
                'accept': "application/json"
            },
            throwHttpErrors: false // Don't throw on HTTP errors
        });

        // Handle rate limiting
        if (req.statusCode === 429) {
            const resetTime = req.headers['x-rate-limit-reset'];
            const waitSeconds = resetTime ? Math.ceil((new Date(resetTime * 1000) - new Date()) / 1000) : 900;
            return { 
                error: 'Rate limit exceeded', 
                waitSeconds,
                statusCode: 429
            };
        }

        if (req.statusCode !== 200) {
            return { 
                error: `Twitter API error: ${req.statusCode}`,
                statusCode: req.statusCode
            };
        }

        if (!req.body || !req.body.data) {
            return { data: [] };
        }

        // Store tweets in database
        for (const tweet of req.body.data) {
            await pool.query(
                'INSERT INTO searched_tweets (id, text, created_at, author_id, url) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
                [
                    tweet.id,
                    tweet.text,
                    new Date(tweet.created_at),
                    tweet.author_id,
                    `https://twitter.com/i/web/status/${tweet.id}`
                ]
            );
        }

        // Fetch all stored tweets
        const result = await pool.query(
            'SELECT * FROM searched_tweets ORDER BY created_at DESC LIMIT 50'
        );

        return { data: result.rows };
    } catch (error) {
        console.error('Search tweets error:', error);
        return { 
            error: 'Network or server error occurred',
            details: error.message
        };
    }
}

// Add new endpoint to get searched tweets
app.get('/search/tweets', async (req, res) => {
    try {
        const accessTokens = req.session.user; //Get access tokens from session
        if (!accessTokens) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated'
            });
        }

        const tweets = await searchTweets(
            accessTokens.token,
            accessTokens.token_secret
        );

        res.json(tweets);
    } catch (e) {
        console.error('Error searching tweets:', e);
        res.status(500).json({
            success: false,
            error: e.message
        });
    }
});