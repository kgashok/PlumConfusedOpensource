import test from 'node:test';
import assert from 'node:assert/strict';
import { createChatHandler, createImageHandler, getModels, classifyOpenAIError } from '../lib/openaiService.js';

const quiet = { warn() {}, error() {} };
function mockRes() {
    return { code: 200, body: null, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
}

test('chat success', async () => {
    let used;
    const client = { chat: { completions: { create: async (p) => { used = p; return { choices: [{ message: { content: 'hi' } }] }; } } } };
    const res = mockRes();
    await createChatHandler(() => client, { OPENAI_CHAT_MODEL: 'gpt-4o' }, quiet)({ body: { prompt: 'yo' } }, res);
    assert.equal(res.body.response, 'hi');
    assert.equal(used.model, 'gpt-4o');
});

test('image success with base64 and url', async () => {
    const mk = (data) => ({ images: { generate: async () => ({ data: [data] }) } });
    let res = mockRes();
    await createImageHandler(() => mk({ b64_json: 'AAA' }), { OPENAI_IMAGE_MODEL: 'gpt-image-1' }, quiet)({ body: { prompt: 'x' } }, res);
    assert.equal(res.body.imageUrl, 'data:image/png;base64,AAA');
    res = mockRes();
    await createImageHandler(() => mk({ url: 'http://u' }), {}, quiet)({ body: { prompt: 'x' } }, res);
    assert.equal(res.body.imageUrl, 'http://u');
});

test('image requests omit response_format for default and configured models', async () => {
    for (const model of [undefined, 'dall-e-3', 'dall-e-2', 'gpt-image-1']) {
        for (const item of [{ url: 'https://example.com/image.png' }, { b64_json: 'AAA' }]) {
            let used;
            const client = { images: { generate: async (params) => {
                used = params;
                if ('response_format' in params) {
                    throw Object.assign(new Error("Unknown parameter: 'response_format'."), { status: 400 });
                }
                return { data: [item] };
            } } };
            const res = mockRes();
            await createImageHandler(() => client, { OPENAI_IMAGE_MODEL: model }, quiet)(
                { body: { prompt: 'A tree' } }, res
            );
            assert.deepEqual(used, {
                model: model || 'dall-e-3', prompt: 'A tree', n: 1, size: '1024x1024'
            });
            assert.equal(res.code, 200);
            assert.equal(res.body.success, true);
            assert.equal(res.body.imageUrl, item.url || 'data:image/png;base64,AAA');
        }
    }
});

test('invalid model env falls back to defaults', () => {
    const m = getModels({ OPENAI_CHAT_MODEL: 'bad model!', OPENAI_IMAGE_MODEL: '' }, quiet);
    assert.equal(m.chat, 'gpt-4o-mini');
    assert.equal(m.image, 'dall-e-3');
});

test('model-not-found gives actionable message', async () => {
    const err = Object.assign(new Error("400 The model 'gpt-image-1' does not exist."), { status: 400, code: 'model_not_found' });
    const client = { images: { generate: async () => { throw err; } } };
    const res = mockRes();
    await createImageHandler(() => client, { OPENAI_IMAGE_MODEL: 'gpt-image-1' }, quiet)({ body: { prompt: 'x' } }, res);
    assert.equal(res.code, 400);
    assert.equal(res.body.errorType, 'model');
    assert.match(res.body.error, /OPENAI_IMAGE_MODEL/);
});

test('auth, rate limit and missing prompt', async () => {
    const ctx = { feature: 'chat', model: 'm', modelEnv: 'E' };
    assert.equal(classifyOpenAIError({ status: 401, message: 'x' }, ctx).type, 'auth');
    assert.equal(classifyOpenAIError({ status: 429, message: 'x' }, ctx).type, 'rate_limit');
    const res = mockRes();
    await createChatHandler(() => ({}), {}, quiet)({ body: {} }, res);
    assert.equal(res.code, 400);
});
