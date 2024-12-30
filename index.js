
import express from 'express';
import { TwitterApi } from 'twitter-api-v2';

const app = express();
app.use(express.json());

// Initialize Twitter client
const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

app.post('/tweet', async (req, res) => {
  try {
    const { text } = req.body;
    const tweet = await client.v2.tweet(text);
    res.json(tweet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Twitter API Service');
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});
