
# Function Documentation

### [DO NOT EDIT] Prompt used 
Review the contents of @docs/functions.md . Now, update the contents to reflect all the MAJOR changes that have happened since the last update as another "ChangeLog". Please review @docs/functions.md and makes updates to the "Tweet Management Functions" and "Server Routes" section as well. However, do not delete or change the [DO NOT EDIT] section. 

## Changelog

### October 24, 2026 — Changes since June 2026
- Upgraded the Elm compiler to 0.19.2 (`elm@0.19.2-0`); the build compiles with optimization and compresses/mangles the generated search bundle.
- Added automatic Twitter authentication for unauthenticated, standalone browser launches. Embedded Preview keeps the app visible and opens authentication in a new tab when requested, because Twitter blocks iframe embedding.
- Preserved OAuth success/error and explicit logout URLs to avoid automatic sign-in loops. The OAuth start route saves the request-token session before redirecting and creates a fresh authorization URL for each request.
- Replaced restart-sensitive sessions with PostgreSQL-backed sessions: a rolling 30-day lifetime by default, configurable through `SESSION_MAX_AGE_DAYS`, with production-aware cookie settings.
- Added a visible Log Out control for authenticated users, hid the redundant authentication button, cleared the session cookie on logout, and added logout success/failure feedback.
- Reduced `/auth/status` to authentication state, screen name, and timestamp; removed `/debug/session` and required authentication for `/tweet/history`.
- Escaped tweet content and metadata in JavaScript card renderers, and handled unauthenticated or malformed history responses before rendering.
- Replaced raw Twitter repost error payloads with readable messages, including a friendly response for an already-reposted tweet.
- Added per-user `is_reposted` response metadata and disabled already-reposted actions in history and SaveSoil cards, including after a successful repost.
- Restored All Tweets and Original Tweets controls after fetching fresh tweets and when displaying stored results after API restrictions or rate limits, using shared filter/count rendering helpers.
- Configured development Preview as a webview on port 5000; the server honors `PORT` and binds to `0.0.0.0`. Added a post-merge dependency-install script.
- Updated OpenAI image generation to `gpt-image-1` with URL/base64 response handling and xAI generation to `grok-imagine-image-quality` with optional aspect ratio.

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
- Automatically redirects unauthenticated standalone visitors to `/auth/twitter`
- Suppresses automatic redirects for embedded Preview and URLs containing `success`, `error`, or `loggedOut`
- Reports an authentication-status lookup failure without starting a redirect

### `startAuth()` and `logout()`
Manage explicit sign-in and sign-out.
- `startAuth()` navigates to `/auth/twitter` in a standalone browser, or opens it in a new tab from an iframe
- `logout()` calls `POST /auth/logout` and navigates to `/?loggedOut=true` on success, preventing immediate automatic reauthentication
- A failed logout displays a retry message instead of claiming the user has signed out

### `updateUserInfo(data)`
Updates the UI with authenticated user information.
- Parameters: Auth status data object
- Displays the escaped Twitter handle from `data.screen_name`; does not display or require a user ID from the status response
- Shows/hides user info section
- Hides the authentication button while signed in and displays a Log Out button
- Enables Fetch latest and AI image controls for the configured privileged handles; this is UI gating, not a server-route authorization check

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
- Parameters: showAll boolean, default true (true for all tweets, false for original tweets only)
- Fetches tweets from backend storage via `/search/tweets?stored=true`
- Uses `getTweetFilterButtons()` and `getTweetListStatus()` for filter controls, active-state styling, and counts
- Filters out retweets based on the "RT @" text pattern when showing original tweets
- Handles empty stored collections and fetch failures
- Supports the newer stored-tweet view that remains available when live Twitter searches are unavailable
- Renders cards through `getSearchTweetHTML()`, including the signed-in user's repost state

### `fetchSearchedTweets()` and `updateSearchedTweets(data, errorMessage)`
Fetch and render the latest SaveSoil collection.
- `fetchSearchedTweets()` calls `GET /search/tweets`, disables Fetch latest while working, and applies a 30-second request timeout
- On a failed request, attempts `GET /search/tweets?stored=true` and shows a stored-results notice; if no fallback is available, displays a search error
- `updateSearchedTweets()` handles successful results, empty results, and API error payloads
- For payment-required (402) or rate-limit (429) payloads, loads stored tweets and displays the appropriate restriction/quota notice
- Successful fresh and fallback collections include the shared All Tweets / Original Tweets controls and result-count banner, rather than replacing the list with cards alone

### `getTweetFilterButtons(tweets, showAll)` and `getTweetListStatus(tweets, showAll)`
Shared rendering helpers for saved, freshly fetched, and fallback collections.
- Both default `showAll` to true
- `getTweetFilterButtons()` generates both buttons with active styling and counts from the supplied collection; clicking a button reloads saved tweets through `displaySavedTweets()`
- `getTweetListStatus()` generates the visible result-count banner
- Original-tweet detection uses the `RT @` prefix convention

### `refreshHistory()` and `updateTweetHistory(history)`
Load and render authenticated tweet history.
- `refreshHistory()` requests `GET /tweet/history`
- Returns without rendering on an expected 401 response while signed out
- Rejects other unsuccessful HTTP responses and non-array JSON before passing results to the renderer
- `updateTweetHistory()` renders the empty-history view or maps rows through `getTweetHTML()`

### `getTweetHTML(tweet)` and `getSearchTweetHTML(tweet)`
Generate history and SaveSoil tweet cards.
- Escape tweet text, handles, IDs, URLs, and formatted timestamps with `escapeHTML()` before interpolating them into card markup
- Read `tweet.is_reposted` to render an already-reposted action as disabled, with `aria-disabled` and an explanatory title
- Preserve the existing author links, timestamps, tweet URLs, and deletion styling

### `repostTweet(tweetId)`
Handles reposting of tweets with enhanced error handling.
- Checks authentication status before attempting a repost
- Uses `authenticated` and `screen_name` from `/auth/status`, not the former full user object
- Shows inline success or error messages beneath the relevant tweet card
- Displays a sign-in prompt when the session has expired
- Sends the repost request to `/retweet/:tweetId`
- The server stores repost activity and uses composite IDs for history rows
- Includes original author and retweeter attribution in the success feedback
- Disables repost buttons for the matching original/composite tweet IDs after success without requiring a history reload
- Displays readable server error messages instead of raw Twitter JSON; Twitter error code 327 becomes "You have already reposted this tweet."

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

### App Entry and Runtime
- `GET /`: serves `public/index.html`; root and HTML responses use `Cache-Control: no-store`
- Static app assets are served from `public`, and prompt assets from `/prompts`
- The server listens on `0.0.0.0` using `PORT`, defaulting to 5000
- The development Run workflow builds Elm before starting the port-5000 webview

### Documentation Routes
1. Section Info Display:
   - GET `/docs/section_savesoil_tweets`: Returns SaveSoil section documentation
   - GET `/docs/about`: Returns about page content
   - Converts markdown to HTML using marked
   - Handles file read errors gracefully
   - Returns appropriate HTTP status codes

### Authentication Flow
1. On launch, `checkAuthStatus()` calls `GET /auth/status`. Unauthenticated standalone visitors begin authentication automatically, except on OAuth-result or explicit logout URLs.
2. An explicit click calls `startAuth()` → `GET /auth/twitter`. Embedded Preview opens this route in a new tab rather than trying to display Twitter in its iframe.
3. `GET /auth/twitter` obtains a request token, stores it in the session, explicitly saves the session before redirecting, and builds a fresh Twitter authorization URL per request.
4. `GET /callback` validates the request-token session, exchanges the verifier for access credentials, stores the signed-in user in the server-side session, removes the temporary request token, and redirects to `/?success=true`. Failures redirect to `/?error=...`.
5. `GET /auth/status` returns only `authenticated`, `screen_name` (or null), and `timestamp`; it does not return the full session user or OAuth credentials.
6. Sessions use `PgSessionStore` in `sessionConfig.js`, backed by PostgreSQL. The default rolling lifetime is 30 days, configurable with a positive `SESSION_MAX_AGE_DAYS`. Cookies are HttpOnly, SameSite=Lax, and Secure in production; production also enables proxy trust.
7. `POST /auth/logout` destroys the stored session and clears `connect.sid`. On success the frontend navigates to `/?loggedOut=true`; session-destruction failures return HTTP 500.
8. The former `GET /debug/session` route has been removed; historical changelog references describe the old implementation only.

### Tweet Operations Flow
1. Reposting Tweet:
   - Frontend: `repostTweet()` → Backend: POST `/retweet/:tweetId`
   - Validates authentication and handles expired sessions gracefully
   - Stores a database record for the repost and links it back to the original tweet
   - Uses composite IDs such as `tweetId-userId` to avoid duplicate primary key issues
   - Returns author and retweeter details in the response payload
   - Returns HTTP 401 without a session and HTTP 500 with an error message on failure
   - Parses Twitter v1-style error arrays and v2 `detail`/`title` fields rather than returning a raw error payload; code 327 has a friendly already-reposted message
   - Frontend disables the matching repost actions after success

2. Posting Tweet:
   - Frontend: `postTweet()` → Backend: POST `/tweet`
   - Supports multipart/form-data for images and preserves draft content in the browser
   - The server stores the tweet metadata in the database and returns tweet URL information
   - Frontend shows success/error feedback and refreshes history on completion

3. Deleting Tweet:
   - Frontend: `deleteTweet()` → Backend: DELETE `/tweet/:id`
   - Server validates the session and performs a soft delete in the database
   - Frontend shows deletion feedback and refreshes the history view

4. Reading History:
   - Frontend: `refreshHistory()` → Backend: GET `/tweet/history`
   - Requires a signed-in session; otherwise returns HTTP 401
   - Returns stored history ordered by timestamp descending, enriched with the current user's `is_reposted` flag
   - Authentication is required, but the history query is not filtered to the current user's tweets

5. Repost-State Enrichment:
   - Server helper `addRepostStatus(tweets, userId)` checks the visible original tweet IDs against the current user's `retweets` records in one query
   - Composite history IDs resolve through `original_tweet_id`
   - Adds boolean `is_reposted` to history and stored/live SaveSoil results
   - Anonymous stored-tweet requests receive false flags, not another user's repost state

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
   - Shared filter buttons and result-count banners are included after successful fresh fetches and stored-result fallbacks
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
   - Compiler version is 0.19.2; `build.sh` uses `--optimize` followed by UglifyJS compression and mangling

4. Filtering Tweets:
   - Frontend: `displaySavedTweets(showAll)` → Backend: GET `/search/tweets?stored=true`
   - Server returns stored tweets from the database
   - Frontend filters tweets based on the showAll parameter
   - UI shows active filter state and count
   - Original tweets identified by checking for the "RT @" prefix
   - Enhanced side-by-side layout for better visualization

#### `GET /search/tweets`
- `stored=true`: public access to the latest 50 stored SaveSoil tweets, ordered by `created_at` descending
- Without `stored=true`: requires authentication (HTTP 401 otherwise), fetches recent Twitter results, saves new tweets, and returns the latest stored collection
- The current live query is `#SaveSoil -is:retweet -is:quote` with up to 10 results requested from Twitter per call
- Successful collections use `{ data: [...] }` and include per-user `is_reposted` metadata
- Twitter 402/429 restrictions are represented in JSON using `statusCode` and related error fields for frontend fallback handling; these payload fields do not necessarily equal the HTTP response status

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
- `GET /api/un-dates`: reads `InternationalDays.csv` and returns the two nearest upcoming international days in the current year
- `GET /api/credits`: returns the current xAI credit balance from the billing API
- `POST /api/generate-image`: requires a JSON `prompt`, uses OpenAI `gpt-image-1` at 1024×1024, and returns `{ success, imageUrl }`; base64 responses are converted to image data URLs
- `POST /api/imagine`: requires a JSON `prompt`, accepts optional `aspect_ratio`, uses xAI `grok-imagine-image-quality`, and returns `{ success, imageUrl }` from URL or base64 data
- `POST /api/chatgpt`: requires a JSON `prompt` and returns `{ success, response }` using `gpt-3.5-turbo`
- Missing image/chat prompts return HTTP 400; image services also report quota/provider failures
- These AI and utility routes currently have no session guard in their handlers; frontend visibility restrictions are not backend authorization

### Database Enhancements
- Added composite primary key support for multiple retweets
- Added original_tweet_id column to track retweet sources
- Improved error handling for duplicate key constraints
- Enhanced database queries to support filtering operations
- PostgreSQL-backed `user_sessions` stores session data and expiration so authentication survives server restarts
- Repost-state enrichment uses the current user's recorded reposts, rather than inferring state from another user's history

### Error Handling
- Localized error display beneath tweets
- Database transaction management
- Rate limit handling
- Authentication validation
- Success state management
- UI feedback system
- Empty state handling for filtered results
- Enhanced modal and button styling
