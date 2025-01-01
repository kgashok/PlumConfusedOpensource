
CREATE TABLE IF NOT EXISTS tweets (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    url TEXT NOT NULL,
    user_id TEXT NOT NULL,
    screen_name TEXT NOT NULL,
    deleted BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS searched_tweets (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    author_id TEXT NOT NULL,
    url TEXT NOT NULL
);
