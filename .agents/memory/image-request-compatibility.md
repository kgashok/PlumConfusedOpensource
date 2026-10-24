---
name: Image request compatibility
description: Observed response_format incompatibility on the project's OpenAI image-generation path.
---
Avoid sending the optional `response_format` parameter on this project's image-generation path. Accept either URL or base64 output.

**Why:** The deployed API returned HTTP 400 `unknown_parameter` for `response_format` even when the selected model was `dall-e-3`. Model-name prefix assumptions did not predict what the configured service accepted.

**How to apply:** When changing image models, preserve default-format requests and response normalization. Verify supported parameters with the actual service rather than assuming model-family compatibility.
