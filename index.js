
import express from 'express';
import got from 'got';
import crypto from 'crypto';
import OAuth from 'oauth-1.0a';
import qs from 'querystring';

const app = express();
app.use(express.json());
app.use(express.static('public'));

const consumer_key = process.env.CONSUMER_KEY;
const consumer_secret = process.env.CONSUMER_SECRET;

const requestTokenURL = 'https://api.twitter.com/oauth/request_token?oauth_callback=oob&x_auth_access_type=write';
const authorizeURL = new URL('https://api.twitter.com/oauth/authorize');
const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
const endpointURL = 'https://api.twitter.com/2/tweets';

const oauth = OAuth({
    consumer: { key: consumer_key, secret: consumer_secret },
    signature_method: 'HMAC-SHA1',
    hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
});

let requestTokenStore = {};

async function requestToken() {
    const authHeader = oauth.toHeader(oauth.authorize({
        url: requestTokenURL,
        method: 'POST'
    }));

    const req = await got.post(requestTokenURL, {
        headers: { Authorization: authHeader["Authorization"] },
        throwHttpErrors: false
    });
    if (req.body) {
        return qs.parse(req.body);
    } else {
        throw new Error('Cannot get OAuth request token');
    }
}

async function accessToken(oauth_token, oauth_token_secret, verifier) {
    const authHeader = oauth.toHeader(oauth.authorize({
        url: accessTokenURL,
        method: 'POST'
    }));
    const path = `https://api.twitter.com/oauth/access_token?oauth_verifier=${verifier}&oauth_token=${oauth_token}`;
    const req = await got.post(path, {
        headers: { Authorization: authHeader["Authorization"] },
        throwHttpErrors: false
    });
    if (req.body) {
        return qs.parse(req.body);
    } else {
        throw new Error('Cannot get OAuth access token');
    }
}

async function postTweet(oauth_token, oauth_token_secret, tweetText) {
    const token = {
        key: oauth_token,
        secret: oauth_token_secret
    };

    const authHeader = oauth.toHeader(oauth.authorize({
        url: endpointURL,
        method: 'POST'
    }, token));

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
    return req.body;
}

app.post('/start', async (req, res) => {
    try {
        const oAuthRequestToken = await requestToken();
        requestTokenStore = oAuthRequestToken;
        authorizeURL.searchParams.append('oauth_token', oAuthRequestToken.oauth_token);
        res.json({ authUrl: authorizeURL.href });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/complete', async (req, res) => {
    try {
        const { pin, text } = req.body;
        const oAuthAccessToken = await accessToken(
            requestTokenStore.oauth_token,
            requestTokenStore.oauth_token_secret,
            pin
        );
        const response = await postTweet(
            oAuthAccessToken.oauth_token,
            oAuthAccessToken.oauth_token_secret,
            text
        );
        res.json({ success: true, response });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
});
