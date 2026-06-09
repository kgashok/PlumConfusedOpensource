
# Function Documentation

### [DO NOT EDIT] Prompt used 
Review the contents of @docs/functions.md . Now, update the contents to reflect all the MAJOR changes that have happened since the last update as another "ChangeLog". Please review @docs/functions.md and makes updates to the "Tweet Management Functions" and "Server Routes" section as well. However, do not delete or change the [DO NOT EDIT] section. 

## Changelog

### June 2026
- Added AI-assisted content generation endpoints for image generation, prompt drafting, and xAI image creation.
- Added an xAI credit balance endpoint so the app can surface remaining plan credits in the UI.
- Extended tweet posting to support image uploads, draft persistence, and local preview state.
- Improved retweet handling with authentication expiration checks, composite tweet IDs, and retweeter attribution.
- Added session and history utility routes for logout, session inspection, and tweet history retrieval.
- Expanded search fallback behavior to use stored tweets when live Twitter searches are rate limited or unavailable.

### August 2025
- Implemented live search functionality with 300ms debounce for SaveSoil tweets
- Added Elm-based search module using The Elm Architecture (TEA)
- Enhanced search to include screen_name matching for Twitter handles
- Improved search endpoint to support both tweet text and author handle searches
- Added real-time search results updating without requiring Enter or Search button clicks
- Fixed search inconsistencies - now properly finds partial matches like "sad" and "savesoilkg"
- Added comprehensive search across both tweets and searched_tweets database tables
- Enhanced search performance with result limiting and proper type casting
- Implemented unified search API endpoint `/api/search` for live search functionality


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
- Fetches tweets from backend storage via `/search/tweets?stored=true`
- Implements filter buttons with active-state styling and per-category counts
- Filters out retweets based on the "RT @" text pattern when showing original tweets
- Handles empty state, API error, and rate-limit fallback scenarios
- Supports the newer stored-tweet view that remains available when live Twitter searches are unavailable
- Maintains consistent UI with the search results experience

### `repostTweet(tweetId)`
Handles reposting of tweets with enhanced error handling.
- Checks authentication status before attempting a repost
- Shows inline success or error messages beneath the relevant tweet card
- Displays a sign-in prompt when the session has expired
- Sends the repost request to `/retweet/:tweetId`
- Stores repost activity in the database using composite IDs to avoid conflicts
- Includes original author and retweeter attribution in the success feedback
- Refreshes the visible tweet state after a successful repost

### `postTweet()`
Handles new tweet creation with improved feedback.
- Reads text from the "tweetText" input and validates it before submit
- Supports image attachments via `FormData` and multipart upload
- Persists drafts and uploaded image preview state in local storage for recovery
- Shows character-count feedback and clears the composer on success
- Sends the request to `POST /tweet`
- Handles authentication redirects, server errors, and post-success refreshes
- Keeps the tweet history UI synchronized with the latest post

### `deleteTweet(tweetId)`
Handles tweet deletion with visual feedback.
- Parameters: Tweet ID
- Calls `DELETE /tweet/:id`
- Updates the database to mark the tweet as deleted rather than removing it immediately
- Shows deletion feedback within the tweet card and highlights the item visually
- Auto-refreshes history after a short delay
- Includes error handling for failed delete requests

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
6. Logout: `POST /auth/logout` destroys the session and clears auth state
7. Session inspection: `GET /debug/session` exposes the current session state for debugging

### Tweet Operations Flow
1. Reposting Tweet:
   - Frontend: `repostTweet()` → Backend: POST `/retweet/:tweetId`
   - Validates authentication and handles expired sessions gracefully
   - Stores a database record for the repost and links it back to the original tweet
   - Uses composite IDs such as `tweetId-userId` to avoid duplicate primary key issues
   - Returns author and retweeter details in the response payload
   - Manages rate-limit and API error states

2. Posting Tweet:
   - Frontend: `postTweet()` → Backend: POST `/tweet`
   - Supports multipart/form-data for images and preserves draft content in the browser
   - The server stores the tweet metadata in the database and returns tweet URL information
   - Frontend shows success/error feedback and refreshes history on completion

3. Deleting Tweet:
   - Frontend: `deleteTweet()` → Backend: DELETE `/tweet/:id`
   - Server validates the session and performs a soft delete in the database
   - Frontend shows deletion feedback and refreshes the history view

### Search and Filter Flow
1. **Live Search Implementation:**
   - Real-time search as user types with 300ms debounce
   - Frontend: Elm module → Backend: GET `/api/search?q=query`
   - Searches both tweet text and screen_name fields
   - Returns empty array for empty queries
   - Limits results to 50 for performance
   - Supports partial matching (e.g., "sad", "savesoilkg")
   - Unified search across tweets and searched_tweets tables

2. **Fetching Latest Tweets:**
   - User clicks "Fetch latest" with busy cursor
   - Frontend: `fetchSearchedTweets()` → Backend: GET `/search/tweets`
   - Server queries Twitter API with rate limiting and quota handling
   - Results are cached in the database with screen_name and URL metadata
   - Fallback to stored tweets during rate limits, monthly quota exhaustion, or paid-tier restrictions
   - Clear button functionality resets search state in the Elm view

3. Elm Search Implementation:
   - Implemented in `Search.elm` using The Elm Architecture (TEA)
   - Model tracks query string, tweet list, and error state
   - Uses JSON decoders for tweet data (id, text, timestamp, url, userId, screenName)
   - Supports real-time query updates with `UpdateQuery` message
   - HTTP requests handled through `elm/http`
   - Clear functionality resets search state with `Clear`
   - Responsive UI with Tailwind CSS classes
   - Custom tweet card view with formatted timestamps

4. Filtering Tweets:
   - Frontend: `displaySavedTweets(showAll)` → Backend: GET `/search/tweets?stored=true`
   - Server returns stored tweets from the database
   - Frontend filters tweets based on the showAll parameter
   - UI shows active filter state and count
   - Original tweets identified by checking for the "RT @" prefix
   - Enhanced side-by-side layout for better visualization

### New Search Endpoints

#### `/api/search`
Unified search endpoint for live search functionality.
- **Method**: GET
- **Parameters**: `q` (query string)
- **Returns**: JSON array of matching tweets
- **Features**:
  - Searches both tweet text and screen_name fields
  - Combines data from tweets and searched_tweets tables
  - Excludes deleted tweets
  - Limits results to 50 entries
  - Supports partial matching with LIKE queries
  - Returns empty array for empty queries
  - Proper type casting for consistent data structure

### Additional AI and Utility Routes
- `GET /tweet/history`: returns the stored tweet history from the database
- `GET /api/credits`: returns the current xAI credit balance from the billing API
- `POST /api/generate-image`: creates an image using the OpenAI image generation endpoint
- `POST /api/imagine`: creates an image using the xAI image generation endpoint
- `POST /api/chatgpt`: returns a ChatGPT completion for the submitted prompt

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
