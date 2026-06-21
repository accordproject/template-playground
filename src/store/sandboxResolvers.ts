/*
 * Module-scoped resolver map for sandbox execution promises.
 *
 * Each pending execution registers a resolver function keyed by executionId.
 * When SandboxFrame receives a postMessage result from the iframe, it looks up
 * the resolver here and calls it to settle the Promise.
 */

import { SandboxMessage } from "../constants/sandbox";

export const sandboxResolvers = new Map<
  number,
  (msg: SandboxMessage) => void
>();
