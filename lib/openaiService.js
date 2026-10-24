// OpenAI chat/image handlers for the "Ask ChatGPT" and "Create Image" UI actions.
// Models come from env vars so they can be changed without a code change; the
// defaults are models available to ordinary API keys (gpt-image-1, by contrast,
// requires a verified organization and yields "model does not exist" otherwise).
export const DEFAULT_CHAT_MODEL = 'gpt-4o-mini';
export const DEFAULT_IMAGE_MODEL = 'dall-e-3';

// Conservative allow-list for model ids (e.g. gpt-4o-mini, ft:gpt-4o:org:name).
const MODEL_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/;

// Returns the trimmed model name, or the fallback when unset or malformed.
export function resolveModel(value, fallback, envName, logger = console) {
    const trimmed = typeof value === 'string' ? value.trim() : '';
    if (!trimmed) return fallback;
    if (!MODEL_NAME_PATTERN.test(trimmed)) {
        logger.warn(`Invalid ${envName} value; using default "${fallback}"`);
        return fallback;
    }
    return trimmed;
}

// Resolves both models from the environment. `env`/`logger` are injectable for tests.
export function getModels(env = process.env, logger = console) {
    return {
        chat: resolveModel(env.OPENAI_CHAT_MODEL, DEFAULT_CHAT_MODEL, 'OPENAI_CHAT_MODEL', logger),
        image: resolveModel(env.OPENAI_IMAGE_MODEL, DEFAULT_IMAGE_MODEL, 'OPENAI_IMAGE_MODEL', logger),
    };
}

// Maps an OpenAI SDK error to a user-safe, actionable { status, error, type }.
export function classifyOpenAIError(err, { feature, model, modelEnv }) {
    const status = err?.status;
    const code = err?.code || err?.error?.code;
    const upstreamType = err?.error?.type || err?.type;
    const message = err?.message || '';

    if (upstreamType === 'insufficient_quota' || code === 'insufficient_quota') {
        return { status: 429, type: 'quota', error: 'OpenAI quota exceeded. Check your plan and billing details.' };
    }
    if (status === 401) {
        return { status: 401, type: 'auth', error: 'OpenAI rejected the API key. Check OPENAI_API_KEY.' };
    }
    if (status === 429) {
        return { status: 429, type: 'rate_limit', error: 'OpenAI rate limit reached. Please try again shortly.' };
    }
    // Unknown/unavailable model: tell the user which env var to change.
    if (status === 404 || code === 'model_not_found' || /model .*(does not exist|not found)/i.test(message)
        || (status === 403 && /model|access/i.test(message))) {
        return {
            status: 400, type: 'model',
            error: `The ${feature} model "${model}" is not available for this API key. The model may be retired, or your organization may need verification. Set ${modelEnv} to a currently available model.`,
        };
    }
    if (status && status >= 400 && status < 500) {
        return { status: 400, type: 'bad_request', error: `OpenAI rejected the ${feature} request: ${message}` };
    }
    if (!status && /connection|network|timeout|ECONN|ENOTFOUND/i.test(`${err?.name} ${message} ${err?.code}`)) {
        return { status: 502, type: 'network', error: 'Could not reach OpenAI. Check network connectivity and try again.' };
    }
    return { status: 502, type: 'upstream', error: `OpenAI ${feature} request failed${message ? `: ${message}` : ''}` };
}

// Logs full diagnostic context server-side; sends only a user-safe message to the UI.
function fail(res, logger, err, ctx) {
    const result = classifyOpenAIError(err, ctx);
    logger.error(`OpenAI ${ctx.feature} error`, {
        feature: ctx.feature, endpoint: ctx.endpoint, model: ctx.model,
        upstreamStatus: err?.status, errorType: result.type,
        code: err?.code || err?.error?.code, message: err?.message,
    });
    res.status(result.status).json({ success: false, error: result.error, errorType: result.type });
}

// Express handler factory for POST /api/chatgpt. `getClient` is a function so the
// OpenAI client can be swapped for a mock in tests.
export function createChatHandler(getClient, env = process.env, logger = console) {
    return async (req, res) => {
        const prompt = req.body?.prompt;
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ success: false, error: 'Prompt is required' });
        }
        const model = getModels(env, logger).chat;
        const ctx = { feature: 'chat', endpoint: '/api/chatgpt', model, modelEnv: 'OPENAI_CHAT_MODEL' };
        try {
            const completion = await getClient().chat.completions.create({
                model,
                messages: [{ role: 'user', content: prompt }],
            });
            const content = completion.choices?.[0]?.message?.content;
            if (!content) {
                return fail(res, logger, new Error('Empty response from model'), ctx);
            }
            res.json({ success: true, response: content });
        } catch (err) {
            fail(res, logger, err, ctx);
        }
    };
}

// Express handler factory for POST /api/generate-image.
export function createImageHandler(getClient, env = process.env, logger = console) {
    return async (req, res) => {
        const prompt = req.body?.prompt;
        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({ success: false, error: 'Prompt is required' });
        }
        const model = getModels(env, logger).image;
        const ctx = { feature: 'image', endpoint: '/api/generate-image', model, modelEnv: 'OPENAI_IMAGE_MODEL' };
        try {
            const params = { model, prompt, n: 1, size: '1024x1024' };
            // Let the model return its default format. response_format is not
            // supported by all image models; handle both URL and base64 below.
            const response = await getClient().images.generate(params);
            const item = response.data?.[0];
            const imageUrl = item?.url || (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : null);
            if (!imageUrl) {
                return fail(res, logger, new Error('No image returned'), ctx);
            }
            res.json({ success: true, imageUrl });
        } catch (err) {
            fail(res, logger, err, ctx);
        }
    };
}
