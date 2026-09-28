import { useLayoutEffect, useMemo, useRef } from "react";
import workerUrl from "../sandbox/rebuild.worker?worker&url";
import {
  buildRebuildSandboxDocument,
  createNonce,
} from "../sandbox/rebuildSandboxDocument";
import {
  attachRebuildSandbox,
  detachRebuildSandbox,
  handleRebuildSandboxMessage,
} from "../store/rebuildSandbox";
import "../styles/components/SandboxFrame.css";

/**
 * RebuildSandboxFrame renders the hidden, sandboxed iframe in which the
 * Template Engine renders the agreement preview.
 *
 * Rendering evaluates TemplateMark formulas (`{{% ... %}}`) with
 * `new Function`. A shared link can carry any formula, so that evaluation
 * must not happen in the page: the iframe is loaded from `srcdoc` with
 * `sandbox="allow-scripts"` (no `allow-same-origin`), which gives it a null
 * origin, and its document carries a Content Security Policy that names
 * the playground origin for the worker bundle and allows no other network
 * access. See `rebuildSandboxDocument.ts` for the policy.
 *
 * This component:
 * 1. Builds the sandbox document once, embedding the worker bundle URL
 * 2. Registers the iframe with `store/rebuildSandbox.ts` so `rebuild()` can
 *    post requests to it
 * 3. Forwards messages that provably come from this iframe to the bridge
 */
export default function RebuildSandboxFrame() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const srcDoc = useMemo(() => {
    const absoluteWorkerUrl = new URL(workerUrl, document.baseURI).href;
    return buildRebuildSandboxDocument({
      origin: window.location.origin,
      workerUrl: absoluteWorkerUrl,
      nonce: createNonce(),
    });
  }, []);

  /*
   * A layout effect, not a passive one: it runs in the same task that
   * inserts the iframe, so the listener exists before the iframe can post
   * its one-off ready signal. A passive effect runs after paint, possibly
   * after that message has already been dispatched and lost.
   */
  useLayoutEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    attachRebuildSandbox(iframe);

    const handleMessage = (event: MessageEvent<unknown>) => {
      /*
       * Sandboxed iframes without allow-same-origin have an opaque origin,
       * which postMessage reports as the literal string "null". Checking
       * the source as well makes sure the message came from this frame
       * and not from another sandboxed document.
       */
      if (event.origin !== "null") return;
      if (event.source !== iframe.contentWindow) return;
      handleRebuildSandboxMessage(event.data);
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      detachRebuildSandbox();
    };
  }, []);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      sandbox="allow-scripts"
      className="sandbox-frame-hidden"
      title="Template Rendering Sandbox"
      aria-hidden="true"
    />
  );
}
