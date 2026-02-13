import { useRef, useEffect } from "react";
import { editor as MonacoEditorNS } from "monaco-editor";
import MarkdownEditor from "../MarkdownEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { updateEditorActivity } from "../../ai-assistant/activityTracker";
import { useMarkdownEditorContext } from "../../contexts/MarkdownEditorContext";
import { createMarkdownCommands } from "./markdownCommands";

function TemplateMarkdown() {
  const editorValue = useAppStore((state) => state.editorValue);
  const setEditorValue = useAppStore((state) => state.setEditorValue);
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown);
  const { setCommands } = useMarkdownEditorContext();

  const { value, setValue } = useUndoRedo(
    editorValue,
    setEditorValue
  );

  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    return () => {
      // Clear commands when unmounting
      setCommands(undefined);
    };
  }, [setCommands]);

  const handleChange = (val: string | undefined) => {
    if (val !== undefined) {
      updateEditorActivity("markdown");
      setValue(val); // Update editor state and sync
      setTemplateMarkdown(val);
    }
  };

  const handleEditorReady = (editor: MonacoEditorNS.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    const commands = createMarkdownCommands(editorRef);
    setCommands(commands);
  };

  return (
    <MarkdownEditor
      value={value}
      onChange={handleChange}
      onEditorReady={handleEditorReady}
    />
  );
}

export default TemplateMarkdown;