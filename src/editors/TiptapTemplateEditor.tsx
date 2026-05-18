import { useCallback, useEffect, useRef, useState } from "react";
import {
  TemplateEditor,
  parseMarkdownTemplate,
  serializeToMarkdown,
} from "../tiptap-editor";
import type {
  TemplateMarkDocument,
  ValidationError,
} from "../tiptap-editor";
import useAppStore from "../store/store";
import { updateEditorActivity } from "../ai-assistant/activityTracker";
import MarkdownEditor from "./MarkdownEditor";
import { getThemeName } from "../constants/theme";
import "./TiptapTemplateEditor.css";

/**
 * Wrapper component for the TipTap-based TemplateEditor.
 * Handles conversion between markdown strings (app state) and TemplateMark JSON (editor).
 */
function TiptapTemplateEditor() {
  const editorValue = useAppStore((state) => state.editorValue);
  const setEditorValue = useAppStore((state) => state.setEditorValue);
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown);
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const modelManager = useAppStore((state) => state.modelManager);

  // Track whether we're currently syncing from store → editor to avoid loops
  const isSyncingRef = useRef(false);
  // Track the last markdown we sent to the store to detect external changes
  const lastMarkdownRef = useRef(editorValue);
  // External template loads can be parsed before rebuild provides the matching model.
  const pendingModelRetryRef = useRef<string | null>(editorValue);
  const lastModelManagerRef = useRef(modelManager);

  // Parse markdown into TemplateMarkDocument for the editor
  // Initialize as null - parsing is deferred to useEffect to ensure libraries are ready
  const [doc, setDoc] = useState<TemplateMarkDocument | null>(null);

  // Track parse errors to show warning
  const [parseError, setParseError] = useState<string | null>(null);

  // Determine theme based on isDarkMode
  const theme = getThemeName(isDarkMode);

  // Sync from store to editor when editorValue changes externally
  // (e.g., loading a sample, loading from shareable link)
  useEffect(() => {
    if (isSyncingRef.current) return;

    const needsInitialParse = doc === null;
    const markdownChanged = editorValue !== lastMarkdownRef.current;
    const modelChanged = modelManager !== lastModelManagerRef.current;
    const shouldRetryWithModel =
      modelChanged && pendingModelRetryRef.current === editorValue;

    if (!needsInitialParse && !markdownChanged && !shouldRetryWithModel) {
      if (modelChanged) {
        lastModelManagerRef.current = modelManager;
      }
      return;
    }

    const parsed = parseMarkdownTemplate(editorValue, undefined, modelManager);
    if (parsed) {
      setDoc(parsed);
      setParseError(null);
    } else {
      setParseError("Could not parse template markdown");
    }

    if (markdownChanged || needsInitialParse) {
      pendingModelRetryRef.current = editorValue;
    }
    if (shouldRetryWithModel) {
      pendingModelRetryRef.current = null;
    }

    lastMarkdownRef.current = editorValue;
    lastModelManagerRef.current = modelManager;
  }, [editorValue, doc, modelManager]);

  // Handle changes from the TipTap editor
  const handleChange = useCallback(
    (newDoc: TemplateMarkDocument) => {
      setDoc(newDoc);
      updateEditorActivity("markdown");

      // Serialize back to markdown
      const markdown = serializeToMarkdown(newDoc);
      lastMarkdownRef.current = markdown;
      pendingModelRetryRef.current = null;
      lastModelManagerRef.current = modelManager;

      // Update store (this triggers rebuild)
      isSyncingRef.current = true;
      setEditorValue(markdown);
      void setTemplateMarkdown(markdown);

      // The queueMicrotask ensures the sync flag is reset AFTER the current
      // React render cycle completes. This prevents an infinite loop:
      // 1. Editor change → handleChange → setEditorValue (store update)
      // 2. Store update → triggers useEffect that syncs store → editor
      // 3. Without the flag, step 2 would trigger another handleChange
      // By resetting in a microtask, we allow the store update to propagate
      // before accepting new editor changes.
      queueMicrotask(() => {
        isSyncingRef.current = false;
      });
    },
    [modelManager, setEditorValue, setTemplateMarkdown]
  );

  // Handle validation errors from the TipTap editor
  const handleValidation = useCallback((errors: ValidationError[]) => {
    // The TipTap editor shows its own validation panel,
    // but we could also integrate with the app's error state if needed
    if (errors.length > 0) {
      console.debug("TipTap validation errors:", errors);
    }
  }, []);

  // If we couldn't parse the initial markdown, show an error state
  if (parseError) {
    return (
      <div className="tiptap-wrapper__error" data-theme={theme}>
        <p className="tiptap-wrapper__error-title">Unable to load editor</p>
        <p className="tiptap-wrapper__error-message">{parseError}</p>
        <p className="tiptap-wrapper__error-hint">
          You can disable this feature in Settings and use the standard markdown editor.
        </p>
      </div>
    );
  }

  // If doc is not ready, show loading
  if (!doc) {
    return (
      <div className="tiptap-wrapper__loading" data-theme={theme}>
        Loading editor...
      </div>
    );
  }

  return (
    <div className="tiptap-wrapper">
      <TemplateEditor
        value={doc}
        onChange={handleChange}
        onValidation={handleValidation}
        showValidation={true}
        showToolbar={true}
        showMarkdownToggle={true}
        theme={theme}
        placeholder="Start typing your template..."
        className="template-playground-tiptap-editor"
        modelManager={modelManager}
        renderMarkdownEditor={(value, onChange) => (
          <MarkdownEditor value={value} onChange={onChange} />
        )}
      />
    </div>
  );
}

export default TiptapTemplateEditor;
