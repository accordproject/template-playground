import { useRef, useEffect } from "react";
import { editor as MonacoEditorNS } from "monaco-editor";
import MarkdownEditor from "../MarkdownEditor";
import TiptapTemplateEditor from "../TiptapTemplateEditor";
import useAppStore from "../../store/store";
import { updateEditorActivity } from "../../ai-assistant/activityTracker";
import { useMarkdownEditorContext } from "../../contexts/MarkdownEditorContext";
import { createMarkdownCommands } from "./markdownCommands";

function TemplateMarkdown() {
  const editorValue = useAppStore((state) => state.editorValue);
  const setEditorValue = useAppStore((state) => state.setEditorValue);
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown);
  const useRichEditor = useAppStore((state) => state.useRichEditor);
  const { setCommands } = useMarkdownEditorContext();

  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    return () => {
      // Clear commands when unmounting
      setCommands(undefined);
    };
  }, [setCommands]);

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      updateEditorActivity("markdown");
      setEditorValue(value);
      void setTemplateMarkdown(value);
    }
  };

  const handleEditorReady = (editor: MonacoEditorNS.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    const commands = createMarkdownCommands(editorRef);
    setCommands(commands);
  };

  // When rich editor is enabled, use the TipTap-based editor (beta feature)
  if (useRichEditor) {
    return <TiptapTemplateEditor />;
  }

  // Default: use the Monaco-based markdown editor
  return (
    <MarkdownEditor
      value={editorValue}
      onChange={handleChange}
      onEditorReady={handleEditorReady}
    />
  );
}

export default TemplateMarkdown;
