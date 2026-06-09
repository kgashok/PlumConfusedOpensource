# Threat Model

## Project Overview

This project is a publicly deployed Node.js/Express web application for SaveSoil social-media operations. It serves a browser UI from `public/`, uses Twitter OAuth 1.0a plus `express-session` for user sessions, stores tweet/search history in PostgreSQL, and calls OpenAI and xAI APIs with server-side secrets to generate content and check billing usage.

## Assets

- **Twitter OAuth sessions and access tokens** — active user sessions can post, retweet, and delete content on the authenticated user’s X account.
- **Server-held API secrets** — `OPENAI_API_KEY`, `XAI_API_KEY`, `XAI_MANAGEMENT_KEY`, Twitter consumer credentials, session secret, and database credentials enable paid API usage and control over external services.
- **Stored tweet/search history** — cached tweets, retweet metadata, usernames, timestamps, and app activity history can be used to target users or inject content into the UI.
- **Billing and usage data** — xAI billing previews and credit balances reveal account spending and remaining balance.

## Trust Boundaries

- **Browser to Express server** — all client input is untrusted, including tweet text, uploaded files, search input, prompt text, and query parameters.
- **Express server to PostgreSQL** — the server reads and writes tweet history and cached search results; stored attacker-controlled content can later flow back into the UI.
- **Express server to external APIs** — the server calls Twitter/X, OpenAI, and xAI with privileged secrets; public callers must not be able to spend those credentials arbitrarily.
- **Public to authenticated boundary** — some routes are informational, while tweet actions and any server-side use of paid or privileged integrations must be protected server-side rather than by hidden buttons.
- **Production to dev/debug boundary** — debug or diagnostic routes should not expose useful state in the public deployment.

## Scan Anchors

- Production entry point: `server.js`.
- Highest-risk areas: Express routes in `server.js` that call OpenAI/xAI/Twitter or expose session/debug data; frontend rendering in `public/js/main.js`.
- Public surfaces: `/`, `/docs/*`, `/api/un-dates`, and any route lacking a session check.
- Authenticated surfaces: `/tweet`, `/retweet/:tweetId`, `/tweet/:id`, `/search/tweets` live mode.
- Shared stored-content surface: PostgreSQL-backed tweet/search history rendered into `innerHTML` in `public/js/main.js`.
- Dev-only areas: none clearly identified; scan the whole deployed app.

## Threat Categories

### Spoofing

Twitter OAuth is the application’s user identity boundary. Protected actions MUST require a valid server-side session on every request, and the application MUST NOT rely on hidden buttons or other client-side checks to decide who may trigger privileged server behavior.

### Tampering

Tweet text, search results, prompts, uploaded files, and route parameters all cross from untrusted callers into server and browser logic. The system MUST validate and constrain this input before using it in API calls, database writes, or HTML rendering.

### Information Disclosure

The app handles OAuth-linked user state, billing information, and historical activity data. Public endpoints MUST NOT expose billing/account metadata, debug state, or stored records whose disclosure meaningfully expands attacker knowledge beyond what is intentionally public.

### Denial of Service

The app exposes server-side calls to paid third-party APIs and file uploads. Public callers MUST NOT be able to drive unbounded cost or quota exhaustion against OpenAI, xAI, or Twitter-backed operations.

### Elevation of Privilege

Any route that uses server-owned secrets or performs actions on behalf of a user account is privileged. The server MUST enforce authorization for those routes directly, and browser rendering MUST NOT allow stored or reflected scripts to run with the privileges of an authenticated user session.
