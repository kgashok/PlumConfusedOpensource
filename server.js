import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import got from 'got';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';
import qs from 'querystring';
import multer from 'multer';
import FormData from 'form-data';
import fs from 'fs';


const upload = multer({
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session'; // Import express-session

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use('/prompts', express.static('prompts'));

import { marked } from 'marked';
import { readFile } from 'fs/promises';


import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import OpenAI from 'openai';

// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY) {
    throw new Error('The OPENAI_API_KEY environment variable is missing. Please set it in your environment.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// UN Dates API endpoint
app.get('/api/un-dates', async (req, res) => {
    try {
        const dates = [];
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Reset time to midnight

        // Read and parse InternationalDays.csv
        const csvPath = path.join(__dirname, 'InternationalDays.csv');
        const csvData = fs.readFileSync(csvPath, 'utf-8');
        const rows = csvData.split('\n').slice(1); // Skip header row

        rows.forEach(row => {
            const [date, title, reference] = row.split(',');
            const [month, day] = date.split(' ');
            const dateObj = new Date(currentDate.getFullYear(), new Date(`${month} 1`).getMonth(), parseInt(day));

            if (dateObj >= currentDate) {
                dates.push({
                    date: dateObj,
                    title: title.trim(),
                    displayDate: date,
                    reference: reference ? reference.trim() : ''
                });
            }
        });

        // Sort by closest upcoming dates
        dates.sort((a, b) => a.date - b.date);

        // Return the two closest dates
        res.json(dates.slice(0, 2));
    } catch (error) {
        console.error('Error reading InternationalDays.csv:', error);
        res.status(500).json({ error: 'Failed to fetch dates from InternationalDays.csv' });
    }
});


app.get('/docs/about', async (req, res) => {
    try {
        const markdown = await readFile('./docs/about.md', 'utf-8');
        const html = marked(markdown);
        res.send(html);
    } catch (error) {
        console.error('Error reading markdown:', error);
        res.status(500).send('Error loading content');
    }
});

app.get('/docs/section_savesoil_tweets', async (req, res) => {
    try {
        const markdown = await readFile('./docs/section_savesoil_tweets.md', 'utf-8');
        const html = marked(markdown);
        res.send(html);
    } catch (error) {
        console.error('Error reading markdown:', error);
        res.status(500).send('Error loading content');
    }
});

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

async function postTweet(oauth_token, oauth_token_secret, tweetText, imageBuffer) {
    const token = {
        key: oauth_token,
        secret: oauth_token_secret
    };

    // Upload image first if provided
    let mediaId = null;
    if (imageBuffer) {
        const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';
        const form = new FormData();
        form.append('media', imageBuffer);

        const uploadRequestData = {
            url: uploadUrl,
            method: 'POST'
        };

        const uploadAuthHeader = oauth.toHeader(oauth.authorize(uploadRequestData, token));

        const uploadReq = await got.post(uploadUrl, {
            headers: {
                ...uploadAuthHeader,
                ...form.getHeaders()
            },
            body: form,
            throwHttpErrors: false
        });

        if (uploadReq.statusCode !== 200) {
            throw new Error(`Twitter Media Upload error: ${uploadReq.body}`);
        }

        const uploadResponse = JSON.parse(uploadReq.body);
        mediaId = uploadResponse.media_id_string;
    }

    // Post tweet with or without media
    const requestData = {
        url: endpointURL,
        method: 'POST'
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    const tweetData = {
        text: tweetText
    };

    if (mediaId) {
        tweetData.media = { media_ids: [mediaId] };
    }

    const req = await got.post(endpointURL, {
        json: tweetData,
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
            id: oAuthAccessToken.user_id,
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
app.post('/tweet', upload.single('image'), async (req, res) => {  
    try {  
        const text = req.body.text;  
        const imageFile = req.file;
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
            text,
            imageFile ? imageFile.buffer : null
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
                accessTokens.id,
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
        // Check if it's a Twitter API error response
        const errorMessage = e.message.includes('Twitter API error:') 
            ? JSON.parse(e.message.replace('Twitter API error: ', '')).detail
            : e.message;

        res.status(500).json({   
            success: false,   
            error: errorMessage   
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

async function retweetTweet(oauth_token, oauth_token_secret, tweet_id, user_id) {
    const token = {
        key: oauth_token,
        secret: oauth_token_secret
    };

    const requestData = {
        url: `https://api.twitter.com/2/users/${user_id}/retweets`,
        method: 'POST'
    };

    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    const req = await got.post(requestData.url, {
        json: { tweet_id },
        responseType: 'json',
        headers: {
            Authorization: authHeader["Authorization"],
            'user-agent': "v2RetweetJS",
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

//New Retweet Endpoint
app.post('/retweet/:tweetId', async (req, res) => {
    try {
        let { tweetId } = req.params;
        const accessTokens = req.session.user;

        if (!accessTokens) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        // Extract the numeric tweet ID if it's a composite ID
        if (tweetId.includes('-')) {
            tweetId = tweetId.split('-')[0];
        }

        const retweetResponse = await retweetTweet(
            accessTokens.token, 
            accessTokens.token_secret, 
            tweetId,
            accessTokens.id
        ).catch(error => {
            throw new Error(error.message || 'Failed to retweet');
        });

        // Only proceed if retweet was successful
        if (!retweetResponse || retweetResponse.errors) {
            throw new Error(retweetResponse?.errors?.[0]?.message || 'Failed to retweet');
        }

        // Store retweet in database
        await pool.query(
            'INSERT INTO retweets (original_tweet_id, user_id, timestamp) VALUES ($1, $2, $3)',
            [tweetId, accessTokens.id, new Date().toISOString()]
        );

        // Get the original tweet text and author
        const tweetResult = await pool.query(
            'SELECT text, screen_name as original_author FROM searched_tweets WHERE id = $1',
            [tweetId]
        );

        const tweetText = tweetResult.rows[0]?.text || 'Reposted tweet';
        const originalAuthor = tweetResult.rows[0]?.original_author;

        // Get all users who retweeted this tweet
        const retweetsResult = await pool.query(
            'SELECT DISTINCT t.screen_name FROM tweets t WHERE t.original_tweet_id = $1',
            [tweetId]
        );

        const retweeters = retweetsResult.rows.map(row => row.screen_name);

        // Store in tweets table with a composite ID to avoid primary key conflicts
        const compositeId = `${tweetId}-${accessTokens.id}`;
        await pool.query(
            'INSERT INTO tweets (id, text, timestamp, url, user_id, screen_name, deleted, original_tweet_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [
                compositeId,
                tweetText,
                new Date().toISOString(),
                `https://twitter.com/i/web/status/${tweetId}`,
                accessTokens.id,
                accessTokens.screen_name,
                false,
                tweetId
            ]
        );

        res.json({ 
            success: true, 
            retweetResponse,
            userInfo: {
                currentUser: accessTokens.screen_name,
                originalAuthor,
                retweeters: retweeters
            }
        });
    } catch (error) {
        console.error('Error retweeting:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

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

        const query = '#SaveSoil -is:retweet -is:quote';
        const requestData = {
            url: `${searchURL}?query=${encodeURIComponent(query)}&max_results=10&tweet.fields=created_at,author_id&expansions=author_id&user.fields=username`,
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
            console.log('Rate limit hit. Response body:', req.body);
            console.log('Rate limit headers:', req.headers);
            
            const resetTime = req.headers['x-rate-limit-reset'];
            const waitSeconds = resetTime ? Math.ceil((new Date(resetTime * 1000) - new Date()) / 1000) : 900;
            
            // Check if this is likely a monthly quota issue
            // X.com free tier monthly quota typically shows very long reset times or specific error messages
            const isMonthlyQuota = waitSeconds > 86400 || // More than 24 hours
                                 req.body?.title?.includes('Usage cap exceeded') ||
                                 req.body?.detail?.includes('monthly') ||
                                 req.body?.errors?.[0]?.message?.includes('monthly') ||
                                 waitSeconds === 0; // Sometimes monthly quota shows 0 wait time
            
            console.log('Is monthly quota:', isMonthlyQuota, 'Wait seconds:', waitSeconds);
            
            const errorMessage = isMonthlyQuota 
                ? 'Monthly API quota exceeded. You have reached the 100 tweet limit for X.com\'s free API tier this month.'
                : 'Rate limit exceeded';
                
            return { 
                error: errorMessage, 
                waitSeconds,
                statusCode: 429,
                isMonthlyQuota
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
            const user = req.body.includes?.users?.find(u => u.id === tweet.author_id);
            const screen_name = user ? user.username : tweet.author_id;
            await pool.query(
                'INSERT INTO searched_tweets (id, text, created_at, author_id, screen_name, url) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
                [
                    tweet.id,
                    tweet.text,
                    new Date(tweet.created_at),
                    tweet.author_id,
                    screen_name,
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
// New combined search endpoint
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q?.toLowerCase() || '';
        const results = await pool.query(
            `SELECT * FROM (
                SELECT id, text, timestamp, url, user_id, screen_name 
                FROM tweets 
                UNION ALL 
                SELECT id, text, created_at as timestamp, url, author_id as user_id, screen_name 
                FROM searched_tweets
            ) combined 
            WHERE LOWER(text) LIKE $1 
            ORDER BY timestamp DESC`,
            [`%${query}%`]
        );
        res.json(results.rows);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

app.get('/search/tweets', async (req, res) => {
    try {
        // For stored tweets, don't require authentication
        if (req.query.stored === 'true') {
            const result = await pool.query(
                'SELECT * FROM searched_tweets ORDER BY created_at DESC LIMIT 50'
            );
            return res.json({ data: result.rows });
        }

        // Require authentication for live Twitter API calls
        const accessTokens = req.session.user;
        if (!accessTokens) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated'
            });
        }
        if (req.query.stored === 'true') {
            const result = await pool.query(
                'SELECT * FROM searched_tweets ORDER BY created_at DESC LIMIT 50'
            );
            return res.json({ data: result.rows });
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
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({
                success: false,
                error: 'Prompt is required'
            });
        }

        const response = await openai.images.generate({
            model: "dall-e-2",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
        });

        res.json({
            success: true,
            imageUrl: response.data[0].url
        });
    } catch (error) {
        console.error('OpenAI API error:', error);
        if (error.error?.type === 'insufficient_quota') {
            res.status(429).json({
                success: false,
                error: 'API quota exceeded. Please try again later.'
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Error generating image'
            });
        }
    }
});

app.post('/api/chatgpt', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required'
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{"role": "user", "content": prompt}],
    });

    res.json({ 
      success: true, 
      response: completion.choices[0].message.content 
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    if (error.error?.type === 'insufficient_quota') {
      res.status(429).json({
        success: false,
        error: 'API quota exceeded. Please check the API key configuration.'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Error fetching ChatGPT response' 
      });
    }
  }
});