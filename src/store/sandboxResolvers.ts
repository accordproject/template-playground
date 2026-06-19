/**
 * Module-scoped resolver map for sandbox execution promises.
 *
 * Each pending execution registers a resolver function keyed by executionId.
 * When SandboxFrame receives a postMessage result from the iframe, it looks up
 * the resolver here and calls it to settle the Promise.
 *
 * This replaces the previous `window.__sandboxResolvers` global, keeping the
 * resolver map private to the module boundary and avoiding window pollution.
 */

export interface SandboxResultMessage {
  type: string;
  success?: boolean;
  result?: unknown;
  error?: string;
}

export const sandboxResolvers = new Map<number, (msg: SandboxResultMessage) => void>();
