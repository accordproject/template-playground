import { useEffect, useRef, useCallback } from 'react';
import useAppStore from '../store/store';
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
  result?: object;
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
 * 3. Routes execution results to pending promise resolvers in the store
 */
export default function SandboxFrame() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const setSandboxRef = useAppStore((s) => s.setSandboxRef);
  const setSandboxReady = useAppStore((s) => s.setSandboxReady);

  const handleMessage = useCallback((event: MessageEvent<SandboxMessage>) => {
    // Sandboxed iframes post from origin "null" (the string)
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
        // Resolve the pending execution promise stored in the global resolver map
        const resolver = window.__sandboxResolvers?.get(msg.executionId!);
        if (resolver) {
          resolver(msg);
          window.__sandboxResolvers.delete(msg.executionId!);
        }
        break;
      }
    }
  }, [setSandboxRef, setSandboxReady]);

  useEffect(() => {
    // Initialize the global resolver map for execution promises
    if (!window.__sandboxResolvers) {
      window.__sandboxResolvers = new Map();
    }

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      setSandboxRef(null);
      setSandboxReady(false);
    };
  }, [handleMessage, setSandboxRef, setSandboxReady]);

  return (
    <iframe
      ref={iframeRef}
      src="/logic-handler.html"
      sandbox="allow-scripts"
      className="sandbox-frame-hidden"
      title="Logic Sandbox"
    />
  );
}

/**
 * Extend the Window interface to support the sandbox resolver map.
 * Each pending execution stores a resolver keyed by executionId,
 * allowing the SandboxFrame message handler to route results
 * back to the correct Promise in the store.
 */
declare global {
  interface Window {
    __sandboxResolvers: Map<number, (msg: SandboxMessage) => void>;
  }
}
