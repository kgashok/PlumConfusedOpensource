
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
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tweet Creator</title>
        <style>
          body { font-family: Arial; max-width: 800px; margin: 20px auto; padding: 20px; }
          textarea { width: 100%; height: 100px; margin: 10px 0; }
          button { background: #1DA1F2; color: white; border: none; padding: 10px 20px; cursor: pointer; }
          #result { margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Create a Tweet</h1>
        <textarea id="tweetText" placeholder="Enter your tweet text"></textarea>
        <button onclick="postTweet()">Post Tweet</button>
        <div id="result"></div>

        <script>
          async function postTweet() {
            const text = document.getElementById('tweetText').value;
            const result = document.getElementById('result');
            
            try {
              const response = await fetch('/tweet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
              });
              const data = await response.json();
              const tweetUrl = `https://twitter.com/i/web/status/${data.data.id}`;
              result.innerHTML = `Tweet posted successfully! <a href="${tweetUrl}" target="_blank">View tweet</a>`;
            } catch (error) {
              result.innerHTML = 'Error posting tweet: ' + error.message;
            }
          }
        </script>
      </body>
    </html>
  `);
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});
