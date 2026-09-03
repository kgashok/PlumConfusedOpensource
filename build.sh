#!/usr/bin/env sh
set -e

elm make public/elm/Search.elm --optimize --output=public/js/search.js

uglifyjs public/js/search.js \
    --compress "pure_funcs=[F2,F3,F4,F5,F6,F7,F8,F9,A2,A3,A4,A5,A6,A7,A8,A9],pure_getters,keep_fargs=false,unsafe_comps,unsafe" \
    --output /tmp/search-compressed.js

uglifyjs /tmp/search-compressed.js \
    --mangle \
    --output public/js/search.js
