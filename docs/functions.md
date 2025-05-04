
# Function Documentation

### [DO NOT EDIT] Prompt used 
Review the contents of @docs/functions.md . Now, update the contents to reflect all the MAJOR changes that have happened since the last update as another "ChangeLog". Please review @docs/functions.md and makes updates to the "Tweet Management Functions" and "Server Routes" section as well. However, do not delete or change the [DO NOT EDIT] section. 

## Changelog

### May 2025
- Added Clear button functionality for search results
- Enhanced UI layout with side-by-side view
- Improved search results display and filtering
- Fixed styling issues with modals and buttons
- Enhanced UI/UX for better user interaction
- Added documentation for Elm compilation requirement

### April 2025
- Fixed issue with section info modal causing scrolling to freeze
- Enhanced modal close handling to properly restore scrolling
- Added event propagation control for section info buttons
- Improved UI responsiveness with proper scroll state management
- Updated section info display to prevent accidental section toggling

### March 2025
- Implemented tweet filtering functionality for "All Tweets" and "Original Tweets"
- Added filter buttons with active state indicators in the UI
- Enhanced database queries to support composite primary keys for retweets for Issue #14
- Improved filtering logic to exclude retweets based on text pattern
- Added counter to show the number of tweets in each filter category
- Fixed UI issues with duplicate variable declarations
- Added more robust error handling for empty tweet collections

### Feb 2025
- Enhanced repost error handling to display beneath tweets
- Added success message with clickable tweet URL for reposts
- Improved error message cleanup before new repost attempts
- Added database tracking for repost operations
- Enhanced UI feedback for repost success/failure states

### Jan 25 2025
- Added retweet functionality with database persistence
- Implemented tweet URL display after successful repost
- Enhanced error handling for database operations
- Added retweets table for tracking repost history
- Improved success message display with clickable tweet links
- Updated tweet history to include reposted content

### Jan 15 2025
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

### `displaySavedTweets(showAll)`
Displays saved tweets with enhanced filtering and layout.
- Parameters: showAll boolean (true for all tweets, false for original tweets only)
- Fetches tweets from backend storage
- Implements side-by-side layout for better visualization
- Filters out retweets based on "RT @" text pattern when showing original tweets
- Provides filter buttons with active state indicators
- Shows tweet counts for each filter category
- Handles empty state and error scenarios
- Now includes Clear button functionality
- Maintains consistent UI with search results

### `repostTweet(tweetId)`
Handles reposting of tweets with enhanced error handling.
- Shows error messages beneath the specific tweet
- Implements loading state during repost
- Displays success message with clickable link
- Cleans up previous error messages
- Updates database with repost status using composite ID
- Refreshes tweet history after success
- Handles authentication expiration gracefully

### `postTweet()`
Handles new tweet creation with improved feedback.
- Gets text from "tweetText" input
- Validates input content
- Supports image attachments
- Handles draft persistence
- Shows character count
- Implements error feedback
- Manages authentication state
- Auto-refreshes on success
- Enhanced error display

### `deleteTweet(tweetId)`
Handles tweet deletion with visual feedback.
- Parameters: Tweet ID
- Calls `/tweet/:id` DELETE endpoint
- Updates database status
- Shows deletion animation
- Adds deletion indicator in UI
- Auto-refreshes history after delay
- Includes error handling

## Server Routes

### Documentation Routes
1. Section Info Display:
   - GET `/docs/section_savesoil_tweets`: Returns SaveSoil section documentation
   - GET `/docs/about`: Returns about page content
   - Converts markdown to HTML using marked
   - Handles file read errors gracefully
   - Returns appropriate HTTP status codes

### Authentication Flow
1. User clicks "Authenticate with Twitter"
2. Frontend: `startAuth()` → Backend: `/auth/twitter`
3. Twitter OAuth flow through `/callback`
4. Session creation with user info storage
5. Status check: `checkAuthStatus()` → `/auth/status`

### Tweet Operations Flow
1. Reposting Tweet:
   - Frontend: `repostTweet()` → Backend: POST `/retweet/:tweetId`
   - Validates authentication
   - Shows error beneath tweet
   - Updates database with composite ID (tweetId-userId)
   - Stores original tweet ID reference
   - Returns success with URL
   - Handles rate limits
   - Manages error states

2. Posting Tweet:
   - Frontend: `postTweet()` → Backend: POST `/tweet`
   - Supports multipart/form-data for images
   - Server stores tweet and media in database
   - Returns tweet URL and metadata
   - Frontend shows success/error feedback

3. Deleting Tweet:
   - Frontend: `deleteTweet()` → Backend: DELETE `/tweet/:id`
   - Server validates ownership
   - Updates database with soft delete
   - Frontend shows deletion animation

### Search and Filter Flow
1. Fetching Latest Tweets:
   - User clicks "Fetch latest" with busy cursor
   - Frontend: `fetchSearchedTweets()` → Backend: GET `/search/tweets`
   - Server queries Twitter API with rate limiting
   - Results cached in database with screen_name
   - Fallback to stored tweets during rate limits
   - New Clear button functionality to reset results

2. Elm Search Implementation:
   - Implemented in `Search.elm` using The Elm Architecture (TEA)
   - Model tracks query string, tweet list, and error state
   - Uses JSON decoders for tweet data (id, text, timestamp, url, userId, screenName)
   - Supports real-time query updates with `UpdateQuery` message
   - HTTP requests handled through `elm/http` package
   - Clear functionality resets search state with `Clear` message
   - Responsive UI with Tailwind CSS classes
   - Custom tweet card view with formatted timestamps

2. Filtering Tweets:
   - Frontend: `displaySavedTweets(showAll)` → Backend: GET `/search/tweets?stored=true`
   - Server returns all stored tweets
   - Frontend filters tweets based on showAll parameter
   - UI shows active filter state and count
   - Original tweets identified by checking for "RT @" prefix
   - Enhanced side-by-side layout for better visualization

### Database Enhancements
- Added composite primary key support for multiple retweets
- Added original_tweet_id column to track retweet sources
- Improved error handling for duplicate key constraints
- Enhanced database queries to support filtering operations

### Error Handling
- Localized error display beneath tweets
- Database transaction management
- Rate limit handling
- Authentication validation
- Success state management
- UI feedback system
- Empty state handling for filtered results
- Enhanced modal and button styling
