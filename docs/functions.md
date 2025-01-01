
# Function Documentation

## Changelog

### February 2024
- Added session management with express-session
- Implemented user authentication persistence
- Added debug endpoint for session inspection
- Enhanced error handling in auth flow
- Added user ID display in UI
- Improved tweet history database integration
- Added searched tweets database storage
- Implemented rate limiting handling for search
- Added delete tweet functionality

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
- Now includes session validation

### `updateUserInfo(data)`
Updates the UI with authenticated user information.
- Parameters: Auth status data object
- Displays Twitter handle and user ID
- Shows/hides user info section
- Includes persistent session data

### `showAuthStatus(isAuthenticated, message)`
Manages authentication status display.
- Parameters: 
  - isAuthenticated: boolean
  - message: status message
- Maintains error history (up to 5 messages)
- Changes UI colors based on status
- Enhanced error tracking

## Tweet Management Functions

### `refreshHistory()`
Fetches and displays tweet history.
- Calls `/tweet/history` endpoint
- Updates tweet history display
- Called after posting/deleting tweets
- Now includes database persistence

### `updateTweetHistory(history)`
Updates the tweet history UI.
- Parameters: Array of tweet objects
- Renders empty state if no tweets
- Displays tweets in chronological order
- Includes delete functionality

### `deleteTweet(tweetId)`
Handles tweet deletion.
- Parameters: Tweet ID
- Calls `/tweet/:id` DELETE endpoint
- Updates database status
- Refreshes history on success
- Includes visual feedback

### `postTweet()`
Handles new tweet creation.
- Gets text from "tweetText" input
- Calls `/tweet` POST endpoint
- Stores in database
- Clears input and refreshes history on success

## Search Functions

### `fetchSearchedTweets()`
Fetches tweets with #SaveSoil hashtag.
- Calls `/search/tweets` endpoint
- Updates search results display
- Includes rate limit handling
- Stores results in database

### `updateSearchedTweets(data)`
Updates the search results UI.
- Parameters: Search response data
- Handles rate limiting and errors
- Displays tweets or error messages
- Enhanced error visualization

## Server Routes

### Authentication Flow
1. User clicks "Authenticate with Twitter"
2. Frontend: `startAuth()` → Backend: `/auth/twitter`
3. Twitter OAuth flow through `/callback`
4. Session creation and storage
5. Status check: `checkAuthStatus()` → `/auth/status`

### Tweet Operations Flow
1. Posting Tweet:
   - Frontend: `postTweet()` → Backend: POST `/tweet`
   - Server stores tweet in database
   - Frontend refreshes display

2. Deleting Tweet:
   - Frontend: `deleteTweet()` → Backend: DELETE `/tweet/:id`
   - Server updates database
   - Frontend updates display

### Search Flow
1. User clicks refresh
2. Frontend: `fetchSearchedTweets()` → Backend: GET `/search/tweets`
3. Server queries Twitter API with rate limiting
4. Results stored in database
5. Frontend displays results or error

### Error Handling
- Frontend maintains error history
- Server sends detailed error responses
- Rate limiting handled on both ends
- Enhanced session validation
- Database error handling
