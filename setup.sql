CREATE TABLE IF NOT EXISTS retweets (
    id SERIAL PRIMARY KEY,
    original_tweet_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    UNIQUE(original_tweet_id, user_id)
);
