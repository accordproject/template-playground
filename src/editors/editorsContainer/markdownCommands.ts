import { editor as MonacoEditorNS } from "monaco-editor";
import {
  applyLinePrefixToggle,
  applyOrderedListToggle,
  applyWrappedEdit,
  insertMarkdownLinkOrImage,
} from "../../utils/markdownEditorUtils";
import { MarkdownEditorCommands } from "../../contexts/MarkdownEditorContext";

/**
 * Creates markdown editor commands bound to a specific editor instance
 */
export function createMarkdownCommands(
  editorRef: React.RefObject<MonacoEditorNS.IStandaloneCodeEditor | null>,
): MarkdownEditorCommands {
  return {
    toggleBold: () => {
      if (editorRef.current) {
        applyWrappedEdit(editorRef.current, "**");
      }
    },
    toggleItalic: () => {
      if (editorRef.current) {
        // Allow italic to toggle on/off, including when only inner text is selected.
        // Combined bold+italic (***text***) will correctly drop just the italic layer.
        applyWrappedEdit(editorRef.current, "*");
      }
    },
    insertLink: () => {
      const editor = editorRef.current;
      if (!editor) return;

      const model = editor.getModel();
      const selection = editor.getSelection();
      if (!model || !selection) return;

      const selectedText = model.getValueInRange(selection);
      insertMarkdownLinkOrImage(editor, selectedText, false);
    },
    toggleHeading1: () => {
      if (editorRef.current) {
        applyLinePrefixToggle(editorRef.current, "#", ["##", "###"]);
      }
    },
    toggleHeading2: () => {
      if (editorRef.current) {
        applyLinePrefixToggle(editorRef.current, "##", ["#", "###"]);
      }
    },
    toggleHeading3: () => {
      if (editorRef.current) {
        applyLinePrefixToggle(editorRef.current, "###", ["#", "##"]);
      }
    },
    toggleUnorderedList: () => {
      if (editorRef.current) {
        applyLinePrefixToggle(editorRef.current, "-", ["1."]);
      }
    },
    toggleOrderedList: () => {
      if (editorRef.current) {
        applyOrderedListToggle(editorRef.current, ["-"]);
      }
    },
    insertImage: () => {
      const editor = editorRef.current;
      if (!editor) return;

      const model = editor.getModel();
      const selection = editor.getSelection();
      if (!model || !selection) return;

      const selectedText = model.getValueInRange(selection);
      insertMarkdownLinkOrImage(editor, selectedText, true);
    },
  };
}
