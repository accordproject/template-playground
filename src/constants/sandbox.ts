/*
 * Message types exchanged between the main application and the sandbox iframe.
 * - "sandbox-ready": Sent by the iframe on load to signal availability.
 * - "execution-result": Sent by the iframe to relay Worker execution outcomes.
 */

export const SANDBOX_READY = "sandbox-ready";
export const EXECUTION_RESULT = "execution-result";

export type SandboxMessageType = typeof SANDBOX_READY | typeof EXECUTION_RESULT;

export interface SandboxMessage {
  type: SandboxMessageType;
  executionId?: number;
  success?: boolean;
  result?: unknown;
  error?: string;
}
