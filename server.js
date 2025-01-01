
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';
import pkg from 'pg';
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static('public'));

// Setup session middleware
app.use(
  session({
    secret: 'some_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  })
);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Twitter OAuth routes
app.get('/auth', async (req, res) => {
  try {
    const requestToken = 'REQUEST_TOKEN_PLACEHOLDER';
    const requestTokenSecret = 'REQUEST_SECRET_PLACEHOLDER';

    req.session.requestToken = requestToken;
    req.session.requestTokenSecret = requestTokenSecret;

    res.redirect(`https://api.twitter.com/oauth/authorize?oauth_token=${requestToken}`);
  } catch (error) {
    console.error('Error starting auth flow:', error);
    res.status(500).send('Error starting auth flow');
  }
});

app.get('/callback', async (req, res) => {
  try {
    const { requestToken, requestTokenSecret } = req.session;
    const accessToken = 'FINAL_ACCESS_TOKEN_PLACEHOLDER';
    const accessSecret = 'FINAL_ACCESS_SECRET_PLACEHOLDER';

    req.session.oauth = {
      accessToken,
      accessSecret
    };

    delete req.session.requestToken;
    delete req.session.requestTokenSecret;

    res.redirect('/');
  } catch (error) {
    console.error('Error in callback:', error);
    res.status(500).send('Error completing OAuth callback');
  }
});

app.post('/postTweet', async (req, res) => {
  try {
    const { oauth } = req.session;
    if (!oauth || !oauth.accessToken) {
      return res.status(401).send('Not authenticated with Twitter');
    }
    res.send('Tweet posted!');
  } catch (error) {
    console.error('Error posting tweet:', error);
    res.status(500).send('Error posting tweet');
  }
});

app.get('/getTweets', async (req, res) => {
  try {
    const { oauth } = req.session;
    if (!oauth || !oauth.accessToken) {
      return res.status(401).send('Not authenticated with Twitter');
    }
    res.json({ message: 'Fetched tweets (placeholder)' });
  } catch (error) {
    console.error('Error fetching tweets:', error);
    res.status(500).send('Error fetching tweets');
  }
});

app.delete('/deleteTweet/:id', async (req, res) => {
  try {
    const { oauth } = req.session;
    if (!oauth || !oauth.accessToken) {
      return res.status(401).send('Not authenticated with Twitter');
    }
    res.send('Tweet deleted!');
  } catch (error) {
    console.error('Error deleting tweet:', error);
    res.status(500).send('Error deleting tweet');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
