// Stub for 'node:fs/promises' / 'node:stream/promises'. Only reached via
// @anthropic-ai/sdk's tools/agent-toolset (agent tool-use scaffolding),
// which Reasoners.js never calls — safe to no-op. vite-plugin-node-stdlib-browser
// doesn't polyfill these /promises subpath specifiers correctly, so we bypass
// it entirely for just these two specifiers.
export default {};
export const pipeline = () => {
  throw new Error("stream/promises pipeline is not available in the browser build");
};