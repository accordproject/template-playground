import { useLayoutEffect, useRef } from "react";
import useAppStore from "../store/store";
import { sandboxResolvers } from "../store/sandboxResolvers";
import "../styles/components/SandboxFrame.css";

import {
  SANDBOX_READY,
  EXECUTION_RESULT,
  SandboxMessage,
} from "../constants/sandbox";

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

  /*
   * A layout effect, not a passive one: it runs in the same task that
   * inserts the iframe, so the listener exists before the iframe can post
   * its one-off ready signal. A passive effect runs after paint, possibly
   * after that message has already been dispatched and lost.
   */
  useLayoutEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleMessage = (event: MessageEvent<SandboxMessage>) => {
      /*
       * Sandboxed iframes (sandbox="allow-scripts" without allow-same-origin)
       * are assigned an opaque origin by the browser, which serializes to the
       * literal string "null". Checking both the origin and event.source ensures
       * the message came specifically from this execution sandbox and not from
       * another sandboxed frame (e.g. RebuildSandboxFrame) or foreign window.
       */
      if (event.origin !== "null") return;
      if (event.source !== iframe.contentWindow) return;

      const msg = event.data;
      if (!msg || typeof msg !== "object" || !msg.type) return;

      switch (msg.type) {
        case SANDBOX_READY:
          setSandboxRef(iframe);
          setSandboxReady(true);
          break;

        case EXECUTION_RESULT: {
          // Resolve the pending execution promise from the module-scoped resolver map
          if (msg.executionId !== undefined) {
            const resolver = sandboxResolvers.get(msg.executionId);
            if (resolver) {
              resolver(msg);
              sandboxResolvers.delete(msg.executionId);
            }
          }
          break;
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      setSandboxRef(null);
      setSandboxReady(false);

      // Reject all pending resolvers on unmount to prevent stale promises
      for (const [id, resolver] of sandboxResolvers) {
        resolver({
          type: EXECUTION_RESULT,
          success: false,
          error: "Sandbox iframe was unmounted",
        });
        sandboxResolvers.delete(id);
      }
    };
  }, [setSandboxRef, setSandboxReady]);

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
