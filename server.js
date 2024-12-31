import express from 'express';
import got from 'got';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';
import qs from 'querystring';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static('public'));

const consumer_key = process.env.CONSUMER_KEY;
const consumer_secret = process.env.CONSUMER_SECRET;
const callback_url = process.env.CALLBACK_URL || 'http://localhost:3000/callback';

// Add this near the top of your server.js with other initializations  
const sessions = new Map();  
const tweetHistory = new Map();  

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

        sessions.set(oAuthRequestToken.oauth_token, oAuthRequestToken.oauth_token_secret);

        authorizeURL.searchParams.set('oauth_token', oAuthRequestToken.oauth_token);
        res.redirect(authorizeURL.href);
    } catch (e) {
        console.error('Error during Twitter auth:', e);
        res.redirect('/?error=' + encodeURIComponent(e.message));
    }
});

// Update the auth status endpoint to include user info  
app.get('/auth/status', (req, res) => {  
    const accessTokens = sessions.get('access_token');  
    res.json({  
        authenticated: !!accessTokens,  
        user: accessTokens ? {  
            id: accessTokens.user_id,  
            screen_name: accessTokens.screen_name  
        } : null,  
        timestamp: new Date().toISOString()  
    });  
});  

// Update the callback endpoint to store user info  
app.get('/callback', async (req, res) => {  
    try {  
        const { oauth_token, oauth_verifier } = req.query;  
        const oauth_token_secret = sessions.get(oauth_token);  

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

        // Store the access tokens and user info  
        sessions.set('access_token', {  
            token: oAuthAccessToken.oauth_token,  
            token_secret: oAuthAccessToken.oauth_token_secret,  
            user_id: oAuthAccessToken.user_id,  
            screen_name: oAuthAccessToken.screen_name  // Make sure this exists  
        });  

        sessions.delete(oauth_token);  
        res.redirect('/?success=true');  
    } catch (e) {  
        console.error('Error during callback:', e);  
        res.redirect('/?error=' + encodeURIComponent(e.message));  
    }  
});

// Modify your /tweet endpoint in server.js to store history  
app.post('/tweet', async (req, res) => {  
    try {  
        const { text } = req.body;  
        const accessTokens = sessions.get('access_token');  

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

        // Store tweet in history with user info  
        const tweetId = response.data.id;  
        const timestamp = new Date().toISOString();  

        // Make sure we're storing all user information  
        tweetHistory.set(tweetId, {  
            id: tweetId,  
            text: text,  
            timestamp: timestamp,  
            url: `https://twitter.com/i/web/status/${tweetId}`,  
            user_id: accessTokens.user_id,  
            screen_name: accessTokens.screen_name  // Make sure this is being stored  
        });  

        // Send back complete information including user details  
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
    const accessTokens = sessions.get('access_token');  
    res.json({  
        hasAccessTokens: !!accessTokens,  
        sessionData: accessTokens ? {  
            ...accessTokens,  
            token: '***hidden***',  
            token_secret: '***hidden***'  
        } : null  
    });  
});  


// Add new endpoint to get tweet history  
// Update the history endpoint to include more debugging information  
app.get('/tweet/history', (req, res) => {  
    const history = Array.from(tweetHistory.values())  
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));  

    // Log the history for debugging  
    console.log('Tweet history:', history);  

    res.json(history);  
});  

// Update the /tweet endpoint to include user info  
app.post('/tweet', async (req, res) => {  
    try {  
        const { text } = req.body;  
        const accessTokens = sessions.get('access_token');  

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

        // Store tweet in history with user info  
        const tweetId = response.data.id;  
        const timestamp = new Date().toISOString();  
        tweetHistory.set(tweetId, {  
            id: tweetId,  
            text: text,  
            timestamp: timestamp,  
            url: `https://twitter.com/i/web/status/${tweetId}`,  
            user_id: accessTokens.user_id,  
            screen_name: accessTokens.screen_name  
        });  

        res.json({ success: true, response });  
    } catch (e) {  
        console.error('Error posting tweet:', e);  
        res.status(500).json({   
            success: false,   
            error: e.message   
        });  
    }  
});  

app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
    console.log('Visit http://localhost:3000 to start');
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
            }
        });

        if (!req.body || !req.body.data) {
            return { data: [] };
        }

        // Sort tweets by created_at in descending order (most recent first)
        const sortedTweets = req.body.data.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        ).slice(0, 10);

        return { data: sortedTweets };
    } catch (error) {
        console.error('Search tweets error:', error);
        return { data: [], error: error.message };
    }
}

// Add new endpoint to get searched tweets
app.get('/search/tweets', async (req, res) => {
    try {
        const accessTokens = sessions.get('access_token');
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

