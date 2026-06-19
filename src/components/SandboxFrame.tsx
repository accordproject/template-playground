import { useEffect, useRef, useCallback } from 'react';
import useAppStore from '../store/store';
import { sandboxResolvers } from '../store/sandboxResolvers';
import '../styles/components/SandboxFrame.css';

/**
 * Message types exchanged between the main application and the sandbox iframe.
 * - "sandbox-ready": Sent by the iframe on load to signal availability.
 * - "execution-result": Sent by the iframe to relay Worker execution outcomes.
 */
type SandboxMessageType = 'sandbox-ready' | 'execution-result';

interface SandboxMessage {
  type: SandboxMessageType;
  executionId?: number;
  success?: boolean;
  result?: unknown;
  error?: string;
}

/**
 * SandboxFrame renders a hidden, sandboxed iframe that serves as the
 * execution environment for user-authored contract logic.
 *
 * The iframe loads `/logic-handler.html` with `sandbox="allow-scripts"`
 * (omitting "allow-same-origin"), which forces the browser to assign it
 * a null origin — isolating it from the parent's DOM, storage, and memory.
 *
 * This component:
 * 1. Mounts the iframe and registers its reference with the Zustand store
 * 2. Listens for postMessage events from the iframe
 * 3. Routes execution results to pending promise resolvers via the module-scoped resolver map
 */
export default function SandboxFrame() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const setSandboxRef = useAppStore((s) => s.setSandboxRef);
  const setSandboxReady = useAppStore((s) => s.setSandboxReady);

  const handleMessage = useCallback((event: MessageEvent<SandboxMessage>) => {
    // Sandboxed iframes (sandbox="allow-scripts" without allow-same-origin)
    // are assigned an opaque origin by the browser, which serializes to the
    // literal string "null". This is intentional and is NOT a bug — it is
    // the standard way browsers represent opaque origins in postMessage events.
    if (event.origin !== 'null') return;

    const msg = event.data;
    if (!msg || typeof msg !== 'object' || !msg.type) return;

    switch (msg.type) {
      case 'sandbox-ready':
        if (iframeRef.current) {
          setSandboxRef(iframeRef.current);
        }
        setSandboxReady(true);
        break;

      case 'execution-result': {
        // Resolve the pending execution promise from the module-scoped resolver map
        const resolver = sandboxResolvers.get(msg.executionId!);
        if (resolver) {
          resolver(msg);
          sandboxResolvers.delete(msg.executionId!);
        }
        break;
      }
    }
  }, [setSandboxRef, setSandboxReady]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      setSandboxRef(null);
      setSandboxReady(false);

      // Reject all pending resolvers on unmount to prevent stale promises
      for (const [id, resolver] of sandboxResolvers) {
        resolver({ type: 'execution-result', success: false, error: 'Sandbox iframe was unmounted' });
        sandboxResolvers.delete(id);
      }
    };
  }, [handleMessage, setSandboxRef, setSandboxReady]);

  return (
    <iframe
      ref={iframeRef}
      src="/logic-handler.html"
      sandbox="allow-scripts"
      className="sandbox-frame-hidden"
      title="Logic Sandbox"
      aria-hidden="true"
    />
  );
}
