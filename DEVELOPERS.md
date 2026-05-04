# Concerto Development Guide

## ❗ Accord Project Development Guide ❗
We'd love for you to help develop improvements to Concerto technology! Please refer to the [Accord Project Development guidelines][apdev] we'd like you to follow.

## Template Playground Specific Information

### Development Setup

#### Building Template Playground

To build Concerto, you clone the source code repository and use npm to build:

```shell
# Clone your Github repository:
git clone https://github.com/<GITHUB_USERNAME>/template-playground.git

# Go to the template-playground directory:
cd template-playground

# Add the main template-playground repository as an upstream remote to your repository:
git remote add upstream "https://github.com/accordproject/template-playground.git"

# Install node.js dependencies:
npm i

# Run
npm run dev
```

### AI Assistant Proxy

Hosted AI providers are routed through server-side proxy functions by default so provider API keys are never stored in, decrypted by, or sent from the browser. The browser sends provider, model, and prompt data to the proxy, and the proxy reads provider credentials from environment variables.

Set these variables in the hosting environment as needed:

```shell
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_API_KEY=...
MISTRAL_API_KEY=...
OPENROUTER_API_KEY=...
OPENAI_COMPATIBLE_API_KEY=...
OPENAI_COMPATIBLE_BASE_URL=https://your-openai-compatible-endpoint/v1
AI_PROXY_ALLOWED_ORIGIN=https://template-playground.example
```

The frontend calls `/.netlify/functions/ai-chat` and `/.netlify/functions/ai-models` by default. Override the function base path with `VITE_AI_PROXY_BASE_URL`.

Production deployments that use the existing S3 + CloudFront pipeline should not rely on Netlify functions. The publish workflow now deploys an AWS Lambda + API Gateway proxy stack from [aws/ai-proxy-stack.yml](/Users/rishabhjain/Desktop/template-playground/aws/ai-proxy-stack.yml:1), reads the `AiProxyBaseUrl` CloudFormation output, and injects that into the frontend build as `VITE_AI_PROXY_BASE_URL`.

[apdev]: https://github.com/accordproject/techdocs/blob/master/DEVELOPERS.md
