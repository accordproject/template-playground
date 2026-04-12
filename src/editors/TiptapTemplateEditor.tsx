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

/**
 * Wrapper component for the TipTap-based TemplateEditor.
 * Handles conversion between markdown strings (app state) and TemplateMark JSON (editor).
 */
function TiptapTemplateEditor() {
  const editorValue = useAppStore((state) => state.editorValue);
  const setEditorValue = useAppStore((state) => state.setEditorValue);
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const modelManager = useAppStore((state) => state.modelManager);

  // Track whether we're currently syncing from store → editor to avoid loops
  const isSyncingRef = useRef(false);
  // Track the last markdown we sent to the store to detect external changes
  const lastMarkdownRef = useRef(editorValue);

  // Parse markdown into TemplateMarkDocument for the editor
  // Initialize as null - parsing is deferred to useEffect to ensure libraries are ready
  const [doc, setDoc] = useState<TemplateMarkDocument | null>(null);

  // Track parse errors to show warning
  const [parseError, setParseError] = useState<string | null>(null);

  // Determine theme based on background color
  const theme: "light" | "dark" = backgroundColor === "#121212" ? "dark" : "light";

  // Parse initial markdown after mount
  useEffect(() => {
    if (doc === null && !parseError) {
      try {
        const parsed = parseMarkdownTemplate(editorValue, undefined, modelManager);
        if (parsed) {
          setDoc(parsed);
          lastMarkdownRef.current = editorValue;
        } else {
          setParseError("Could not parse template markdown");
        }
      } catch (err) {
        console.error("Error parsing template markdown:", err);
        setParseError("Could not parse template markdown");
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync from store to editor when editorValue changes externally
  // (e.g., loading a sample, loading from shareable link)
  useEffect(() => {
    // Skip if doc hasn't been initialized yet
    if (doc === null) return;

    // Only sync if the change came from outside (not from our own onChange)
    if (editorValue !== lastMarkdownRef.current && !isSyncingRef.current) {
      try {
        const parsed = parseMarkdownTemplate(editorValue, undefined, modelManager);
        if (parsed) {
          setDoc(parsed);
          setParseError(null);
        } else {
          setParseError("Could not parse template markdown");
        }
      } catch (err) {
        console.error("Error parsing template:", err);
        setParseError("Could not parse template markdown");
      }
      lastMarkdownRef.current = editorValue;
    }
  }, [editorValue, doc, modelManager]);

  // Handle changes from the TipTap editor
  const handleChange = useCallback(
    (newDoc: TemplateMarkDocument) => {
      setDoc(newDoc);
      updateEditorActivity("markdown");

      // Serialize back to markdown
      const markdown = serializeToMarkdown(newDoc);
      lastMarkdownRef.current = markdown;

      // Update store (this triggers rebuild)
      isSyncingRef.current = true;
      setEditorValue(markdown);
      void setTemplateMarkdown(markdown);

      // Reset sync flag after microtask
      queueMicrotask(() => {
        isSyncingRef.current = false;
      });
    },
    [setEditorValue, setTemplateMarkdown]
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
      <div
        style={{
          padding: 16,
          color: theme === "dark" ? "#ff6b6b" : "#c0392b",
          backgroundColor: theme === "dark" ? "#2d2d2d" : "#ffeaea",
          borderRadius: 4,
          margin: 8,
        }}
      >
        <strong>Unable to load editor</strong>
        <p style={{ margin: "8px 0 0 0", fontSize: 14 }}>
          {parseError}
        </p>
        <p style={{ margin: "8px 0 0 0", fontSize: 12, opacity: 0.8 }}>
          You can disable this feature in Settings and use the standard markdown editor.
        </p>
      </div>
    );
  }

  // If doc is not ready, show loading
  if (!doc) {
    return (
      <div style={{ padding: 16, color: theme === "dark" ? "#ccc" : "#666" }}>
        Loading editor...
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <TemplateEditor
        value={doc}
        onChange={handleChange}
        onValidation={handleValidation}
        showValidation={true}
        showToolbar={true}
        showMarkdownToggle={true}
        theme={theme}
        placeholder="Start typing your template..."
        className="template-playground-tiptap-editor h-full"
        modelManager={modelManager}
        renderMarkdownEditor={(value, onChange) => (
          <MarkdownEditor value={value} onChange={onChange} />
        )}
      />
    </div>
  );
}

export default TiptapTemplateEditor;
