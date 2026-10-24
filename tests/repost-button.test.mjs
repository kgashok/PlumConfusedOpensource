import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const mainScript = readFileSync(new URL('../public/js/main.js', import.meta.url), 'utf8');

function renderTweetCards(tweet) {
    // Evaluate the browser script with only the globals needed by its renderers.
    const browser = {
        document: {
            addEventListener() {},
            querySelector() { return null; }
        },
        console,
        URL,
        URLSearchParams,
        setInterval() {}
    };
    browser.window = browser;
    vm.runInNewContext(mainScript, browser);
    const html = [
        browser.getTweetHTML(tweet),
        browser.getSearchTweetHTML({
            ...tweet,
            created_at: tweet.timestamp
        })
    ];
    return html;
}

test('repost buttons are disabled when the current user already reposted a tweet', () => {
    const [historyCard, searchCard] = renderTweetCards({
        id: '123',
        text: 'A saved tweet',
        screen_name: 'author',
        timestamp: '2025-01-01T00:00:00Z',
        url: 'https://example.com/123',
        is_reposted: true
    });

    for (const card of [historyCard, searchCard]) {
        assert.match(card, /class="repost-button[^"]*opacity-50[^"]*" disabled aria-disabled="true" title="Already reposted"/);
    }
});

test('repost buttons remain enabled when the current user has not reposted a tweet', () => {
    const [historyCard, searchCard] = renderTweetCards({
        id: '123',
        text: 'A saved tweet',
        screen_name: 'author',
        timestamp: '2025-01-01T00:00:00Z',
        url: 'https://example.com/123',
        is_reposted: false
    });

    for (const card of [historyCard, searchCard]) {
        assert.match(card, /class="repost-button[^"]*hover:text-green-600/);
        assert.doesNotMatch(card, /repost-button[^>]*\sdisabled/);
    }
});
