
# Function Documentation

### [DO NOT EDIT] Prompt used
Review the contents of @docs/functions.md. Now, update the contents to reflect all the MAJOR changes that have happened since the last update as another "ChangeLog". Please review @docs/functions.md and makes updates to the "Tweet Management Functions" and "Server Routes" section as well. However, do not delete or change the [DO NOT EDIT] section. 

## Changelog

### March 2025
- Added retweet functionality with database persistence
- Implemented tweet URL display after successful repost
- Enhanced error handling for database operations
- Added retweets table for tracking repost history
- Improved success message display with clickable tweet links
- Updated tweet history to include reposted content

### February 2025
- Added busy cursor state for fetch operations
- Enhanced error handling for tweet operations
- Improved screen_name display and linking 
- Added persistent database storage for searched tweets
- Modified tweet UI to show proper author information
- Updated search functionality to handle rate limiting gracefully

### Jan 2025
- Added UN International Days integration
- Implemented funny prompt feature
- Enhanced modal system for displaying prompts
- Added clipboard functionality for prompts
- Enhanced ChatGPT response handling
- Improved error message display
- Added visual feedback for tweet deletion
- Implemented draft tweet persistence
- Added mobile-responsive design improvements

## Previous Changes

### December 2024
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
- Called after posting/deleting/retweeting
- Implements database persistence
- Includes error handling for failed fetches
- Shows reposted tweets in history

### `updateTweetHistory(history)`
Updates the tweet history UI.
- Parameters: Array of tweet objects
- Renders empty state if no tweets
- Displays tweets in chronological order
- Shows clickable Twitter handles
- Handles tweet deletion with visual feedback
- Supports profile page linking
- Displays repost status and links

### `deleteTweet(tweetId)`
Handles tweet deletion.
- Parameters: Tweet ID
- Calls `/tweet/:id` DELETE endpoint
- Updates database status
- Shows deletion animation
- Adds deletion indicator in UI
- Auto-refreshes history after delay
- Includes error handling

### `postTweet()`
Handles new tweet creation.
- Gets text from "tweetText" input
- Validates input content
- Supports image attachments
- Handles draft persistence
- Shows character count
- Implements error feedback
- Manages authentication state
- Auto-refreshes on success

### `repostTweet(tweetId)`
Handles retweeting functionality.
- Parameters: Tweet ID
- Calls `/retweet/:tweetId` endpoint
- Shows success message with tweet URL
- Updates tweet history
- Handles API rate limits
- Manages database persistence
- Includes error handling

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
4. Session creation with user info storage
5. Status check: `checkAuthStatus()` → `/auth/status`

### Tweet Operations Flow
1. Posting Tweet:
   - Frontend: `postTweet()` → Backend: POST `/tweet`
   - Supports multipart/form-data for images
   - Server stores tweet and media in database
   - Returns tweet URL and metadata
   - Frontend shows success/error feedback

2. Deleting Tweet:
   - Frontend: `deleteTweet()` → Backend: DELETE `/tweet/:id`
   - Server validates ownership
   - Updates database with soft delete
   - Frontend shows deletion animation

3. Retweeting:
   - Frontend: `repostTweet()` → Backend: POST `/retweet/:tweetId`
   - Server validates authentication
   - Stores retweet in retweets table
   - Updates tweet history
   - Shows success message with URL
   - Handles rate limiting and errors

### Search Flow
1. User clicks "Fetch latest" with busy cursor
2. Frontend: `fetchSearchedTweets()` → Backend: GET `/search/tweets`
3. Server queries Twitter API with rate limiting
4. Results cached in database with screen_name
5. Fallback to stored tweets during rate limits
6. Frontend displays results with error handling

### Error Handling
- Frontend maintains error history queue
- Server implements comprehensive error types
- Rate limiting with countdown display
- Enhanced session validation
- Database transaction management
- Graceful degradation strategies
