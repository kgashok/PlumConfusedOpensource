#!/usr/bin/env sh
#
# build.sh
# --------
# Production build script for the Elm search bundle.
#
# Purpose:
# - Compile Elm source into JavaScript.
# - Minify and optimize the generated JS for smaller payloads and faster load times.
#
# Why this script exists:
# - Elm produces readable JS by default, but production deployments benefit from
#   aggressive compression/mangling.
# - Keeping these steps in one script makes local and CI builds consistent.
#
# Usage:
#   ./build.sh
#
# Requirements:
# - elm (Elm compiler)
# - uglifyjs (UglifyJS CLI)
#
# Notes:
# - The script exits immediately on error (`set -e`) so broken builds fail fast.
# - It writes an intermediate minified file to /tmp before final mangling.
#
set -e

# Step 1: Compile Elm to optimized JS.
# `--optimize` asks Elm to emit code suited for production builds.
# Output is written to the JS bundle consumed by the site.
elm make public/elm/Search.elm --optimize --output=public/js/search.js

# Step 2: First-pass compression with UglifyJS.
# Why these options:
# - pure_funcs=[...]: marks Elm runtime helper calls as side-effect free so they
#   can be safely removed when unused.
# - pure_getters: assumes property access has no side effects, enabling extra DCE.
# - keep_fargs=false: drops unused function args to reduce size.
# - unsafe_comps / unsafe: enables more aggressive (but generally safe here)
#   optimizations for tighter output.
# Writes to a temp file so we can do a second pass cleanly.
uglifyjs public/js/search.js \
    --compress "pure_funcs=[F2,F3,F4,F5,F6,F7,F8,F9,A2,A3,A4,A5,A6,A7,A8,A9],pure_getters,keep_fargs=false,unsafe_comps,unsafe" \
    --output /tmp/search-compressed.js

# Step 3: Mangle symbols to further reduce final bundle size.
# This shortens variable/function names and writes the final production bundle.
uglifyjs /tmp/search-compressed.js \
    --mangle \
    --output public/js/search.js
