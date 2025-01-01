const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const { default: axios } = require('axios');

// If you're using the Twitter v1.1 OAuth, you'll need a library like 'oauth' or similar
// If you're using Twitter v2 with OAuth 2.0, you'll integrate the necessary library accordingly
// For this example, I'm using placeholders. Replace them with your actual Twitter OAuth logic.

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 1) Setup session middleware (adjust secret for production)
app.use(
  session({
    secret: 'some_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set 'true' if you are using HTTPS
  })
);

// 2) Start OAuth flow, store request tokens in the session
app.get('/auth', async (req, res) => {
  try {
    // Obtain requestToken and requestSecret from Twitter
    // e.g. with oauth:
    // const { requestToken, requestTokenSecret } = await getTwitterRequestToken();
    const requestToken = 'REQUEST_TOKEN_PLACEHOLDER';
    const requestTokenSecret = 'REQUEST_SECRET_PLACEHOLDER';

    // Store in session
    req.session.requestToken = requestToken;
    req.session.requestTokenSecret = requestTokenSecret;

    // Redirect user to Twitter for approval
    // e.g. `https://api.twitter.com/oauth/authorize?oauth_token=${requestToken}`
    res.redirect(`https://api.twitter.com/oauth/authorize?oauth_token=${requestToken}`);
  } catch (error) {
    console.error('Error starting auth flow:', error);
    res.status(500).send('Error starting auth flow');
  }
});

// 3) Twitter callback that receives OAuth tokens
app.get('/callback', async (req, res) => {
  try {
    // Retrieve request tokens from session
    const { requestToken, requestTokenSecret } = req.session;

    // Exchange requestToken + requestTokenSecret + oauth_verifier for final access tokens
    // e.g.:
    // const { accessToken, accessSecret } = await getTwitterAccessToken(
    //   requestToken,
    //   requestTokenSecret,
    //   req.query.oauth_verifier
    // );
    const accessToken = 'FINAL_ACCESS_TOKEN_PLACEHOLDER';
    const accessSecret = 'FINAL_ACCESS_SECRET_PLACEHOLDER';

    // Store final tokens in the session
    req.session.oauth = {
      accessToken,
      accessSecret
    };

    // Clear temporary request tokens
    delete req.session.requestToken;
    delete req.session.requestTokenSecret;

    res.redirect('/'); // or wherever you want your user to land
  } catch (error) {
    console.error('Error in callback:', error);
    res.status(500).send('Error completing OAuth callback');
  }
});

// 4) Use session-based tokens for posting tweets
app.post('/postTweet', async (req, res) => {
  try {
    const { oauth } = req.session;
    if (!oauth || !oauth.accessToken) {
      return res.status(401).send('Not authenticated with Twitter');
    }
    // Make the request to Twitter's API with the user-specific tokens
    // Example code:
    // await postTweet(oauth.accessToken, oauth.accessSecret, req.body.tweetText);

    res.send('Tweet posted!');
  } catch (error) {
    console.error('Error posting tweet:', error);
    res.status(500).send('Error posting tweet');
  }
});

// 5) Use session-based tokens for reading tweets
app.get('/getTweets', async (req, res) => {
  try {
    const { oauth } = req.session;
    if (!oauth || !oauth.accessToken) {
      return res.status(401).send('Not authenticated with Twitter');
    }
    // Example code:
    // const tweets = await getTweets(oauth.accessToken, oauth.accessSecret);
    // res.json(tweets);
    res.json({ message: 'Fetched tweets (placeholder)' });
  } catch (error) {
    console.error('Error fetching tweets:', error);
    res.status(500).send('Error fetching tweets');
  }
});

// 6) Use session-based tokens for deleting tweets
app.delete('/deleteTweet/:id', async (req, res) => {
  try {
    const { oauth } = req.session;
    if (!oauth || !oauth.accessToken) {
      return res.status(401).send('Not authenticated with Twitter');
    }
    // Example code:
    // await deleteTweet(oauth.accessToken, oauth.accessSecret, req.params.id);

    res.send('Tweet deleted!');
  } catch (error) {
    console.error('Error deleting tweet:', error);
    res.status(500).send('Error deleting tweet');
  }
});

// 7) Optional logout route to clear session
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));