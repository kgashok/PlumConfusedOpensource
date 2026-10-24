import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const mainScript = readFileSync(new URL('../public/js/main.js', import.meta.url), 'utf8');

function loadBrowser({ fetch = async () => ({ ok: true }) } = {}) {
    const elements = new Map();
    const createElement = () => {
        const classes = new Set();
        return {
            classList: {
                add(...names) {
                    names.forEach(name => classes.add(name));
                },
                remove(...names) {
                    names.forEach(name => classes.delete(name));
                },
                contains(name) {
                    return classes.has(name);
                }
            },
            innerHTML: '',
            disabled: false
        };
    };
    const browser = {
        document: {
            addEventListener() {},
            getElementById(id) {
                if (!elements.has(id)) elements.set(id, createElement());
                return elements.get(id);
            },
            querySelector() {
                return null;
            }
        },
        console: { ...console, error() {} },
        fetch,
        URL,
        URLSearchParams,
        setInterval() {},
        location: {
            href: '',
            search: '',
            replace(url) {
                this.href = url;
            }
        }
    };
    browser.window = browser;
    vm.runInNewContext(mainScript, browser);
    return { browser, elements };
}

test('logout control appears only while authenticated', () => {
    const { browser, elements } = loadBrowser();

    browser.updateUserInfo({ authenticated: true, screen_name: 'tester' });
    assert.match(elements.get('userInfo').innerHTML, /Log Out/);
    assert.equal(elements.get('userInfo').classList.contains('hidden'), false);
    assert.equal(elements.get('authButton').classList.contains('hidden'), true);

    browser.updateUserInfo({ authenticated: false });
    assert.equal(elements.get('userInfo').classList.contains('hidden'), true);
    assert.equal(elements.get('authButton').classList.contains('hidden'), false);
});

test('successful logout returns to the landing page without automatic sign-in', async () => {
    const { browser } = loadBrowser();
    await browser.logout();

    assert.equal(browser.location.href, '/?loggedOut=true');
});

test('failed logout leaves the page in place and shows an actionable error', async () => {
    const { browser, elements } = loadBrowser({
        fetch: async () => ({ ok: false })
    });

    await browser.logout();

    assert.equal(browser.location.href, '');
    assert.match(elements.get('authStatus').innerHTML, /Logout failed\. Please check your connection and try again\./);
});

test('logged-out landing page does not trigger automatic Twitter authentication', async () => {
    const { browser, elements } = loadBrowser({
        fetch: async () => ({ json: async () => ({ authenticated: false }) })
    });
    let redirected = false;
    browser.location.search = '?loggedOut=true';
    browser.location.replace = () => {
        redirected = true;
    };
    browser.self = browser;
    browser.top = browser;

    await browser.checkAuthStatus();

    assert.equal(redirected, false);
    assert.match(elements.get('authStatus').innerHTML, /Logged out successfully/);
});
