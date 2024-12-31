
# Function Documentation

## Time and Display Functions

### `updateCurrentTime()`
Updates the current time display in the UI.
- Called on page load and every second
- Updates element with ID "currentTime"
- Displays time in locale-specific format

### `initCharCounter()`
Initializes tweet character counter.
- Attached to "tweetText" input element
- Updates character count on input
- Changes color to red when under 20 characters
- Maximum 280 characters allowed

### `formatDate(dateString)`
Formats dates consistently throughout the application.
- Parameters: ISO date string
- Returns: Localized date string with time
- Used by tweet history and error displays

## Authentication Functions

### `checkAuthStatus()`
Checks user's authentication status with Twitter.
- Calls `/auth/status` endpoint
- Updates UI based on authentication state
- Triggers user info display update
- Called on page load

### `updateUserInfo(data)`
Updates the UI with authenticated user information.
- Parameters: Auth status data object
- Displays Twitter handle and user ID
- Shows/hides user info section

### `showAuthStatus(isAuthenticated, message)`
Manages authentication status display.
- Parameters: 
  - isAuthenticated: boolean
  - message: status message
- Maintains error history (up to 5 messages)
- Changes UI colors based on status

## Tweet Management Functions

### `refreshHistory()`
Fetches and displays tweet history.
- Calls `/tweet/history` endpoint
- Updates tweet history display
- Called after posting/deleting tweets

### `updateTweetHistory(history)`
Updates the tweet history UI.
- Parameters: Array of tweet objects
- Renders empty state if no tweets
- Displays tweets in chronological order

### `deleteTweet(tweetId)`
Handles tweet deletion.
- Parameters: Tweet ID
- Calls `/tweet/:id` DELETE endpoint
- Refreshes history on success

### `postTweet()`
Handles new tweet creation.
- Gets text from "tweetText" input
- Calls `/tweet` POST endpoint
- Clears input and refreshes history on success

## Search Functions

### `fetchSearchedTweets()`
Fetches tweets with #SaveSoil hashtag.
- Calls `/search/tweets` endpoint
- Updates search results display

### `updateSearchedTweets(data)`
Updates the search results UI.
- Parameters: Search response data
- Handles rate limiting and errors
- Displays tweets or error messages

## Workflow with Server Routes

### Authentication Flow
1. User clicks "Authenticate with Twitter"
2. Frontend: `startAuth()` → Backend: `/auth/twitter`
3. Twitter OAuth flow through `/callback`
4. Status check: `checkAuthStatus()` → `/auth/status`

### Tweet Operations Flow
1. Posting Tweet:
   - Frontend: `postTweet()` → Backend: POST `/tweet`
   - Server stores tweet in history
   - Frontend refreshes display

2. Deleting Tweet:
   - Frontend: `deleteTweet()` → Backend: DELETE `/tweet/:id`
   - Server removes from history
   - Frontend updates display

### Search Flow
1. User clicks refresh
2. Frontend: `fetchSearchedTweets()` → Backend: GET `/search/tweets`
3. Server queries Twitter API
4. Frontend displays results or error

### Error Handling
- Frontend maintains error history
- Server sends detailed error responses
- Rate limiting handled on both ends
