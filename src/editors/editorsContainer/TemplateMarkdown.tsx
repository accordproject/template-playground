import { useRef, useEffect } from "react";
import { editor as MonacoEditorNS, IRange, Selection } from "monaco-editor";
import MarkdownEditor from "../MarkdownEditor";
import useAppStore from "../../store/store";
import useUndoRedo from "../../components/useUndoRedo";
import { updateEditorActivity } from "../../ai-assistant/activityTracker";
import { useMarkdownEditorContext } from "../../contexts/MarkdownEditorContext";

function TemplateMarkdown() {
  const editorValue = useAppStore((state) => state.editorValue);
  const setEditorValue = useAppStore((state) => state.setEditorValue);
  const setTemplateMarkdown = useAppStore((state) => state.setTemplateMarkdown);
  const { setCommands } = useMarkdownEditorContext();

  const { value, setValue } = useUndoRedo(
    editorValue,
    setEditorValue,
    setTemplateMarkdown // Sync to main state and rebuild
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

  const applyLinePrefixToggle = (prefix: string, alternatives: string[] = []) => {
    const editorInstance = editorRef.current;
    if (!editorInstance) return;

    const model = editorInstance.getModel();
    const selection = editorInstance.getSelection();
    if (!model || !selection) return;

    const startLine = selection.startLineNumber;
    const endLine = selection.endLineNumber;

    const lines: string[] = [];
    for (let line = startLine; line <= endLine; line += 1) {
      lines.push(model.getLineContent(line));
    }

    const allPrefixes = [prefix, ...alternatives].map((p) => p.trim());

    const detectPrefix = (content: string): { matched?: string; stripped: string } => {
      const trimmed = content.trimStart();
      const leadingSpaces = content.length - trimmed.length;

      for (const p of allPrefixes) {
        const withSpace = `${p} `;
        if (trimmed.startsWith(withSpace)) {
          return {
            matched: p,
            stripped: trimmed.slice(withSpace.length),
          };
        }
        if (trimmed === p) {
          return { matched: p, stripped: "" };
        }
      }
      return { matched: undefined, stripped: content.slice(leadingSpaces) };
    };

    const allHaveCurrentPrefix = lines.every((lineText) => {
      const leadingWhitespaceMatch = lineText.match(/^(\s*)/);
      const leadingWhitespace = leadingWhitespaceMatch ? leadingWhitespaceMatch[1] : "";
      const content = lineText.slice(leadingWhitespace.length);
      const detected = detectPrefix(content);
      return detected.matched === prefix.trim();
    });

    const edits: MonacoEditorNS.IIdentifiedSingleEditOperation[] = [];

    for (let i = 0; i < lines.length; i += 1) {
      const lineNumber = startLine + i;
      const lineText = lines[i];

      const leadingWhitespaceMatch = lineText.match(/^(\s*)/);
      const leadingWhitespace = leadingWhitespaceMatch ? leadingWhitespaceMatch[1] : "";
      const content = lineText.slice(leadingWhitespace.length);
      const detected = detectPrefix(content);

      if (allHaveCurrentPrefix && detected.matched === prefix.trim()) {
        // All lines already have this prefix → remove it (toggle off)
        const newContent = detected.stripped.replace(/^(\s+)/, " ");
        edits.push({
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: lineText.length + 1,
          },
          text: `${leadingWhitespace}${newContent}`,
          forceMoveMarkers: true,
        });
      } else {
        // Apply current prefix, but strip any existing alternative prefix first
        const baseContent =
          detected.matched !== undefined ? detected.stripped : content;
        edits.push({
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: lineText.length + 1,
          },
          text: `${leadingWhitespace}${prefix} ${baseContent}`,
          forceMoveMarkers: true,
        });
      }
    }

    if (edits.length > 0) {
      editorInstance.executeEdits("markdown-toolbar-prefix", edits);
      editorInstance.focus();
    }
  };

  const applyOrderedListToggle = (alternatives: string[] = []) => {
    const editorInstance = editorRef.current;
    if (!editorInstance) return;

    const model = editorInstance.getModel();
    const selection = editorInstance.getSelection();
    if (!model || !selection) return;

    const startLine = selection.startLineNumber;
    const endLine = selection.endLineNumber;

    const lines: string[] = [];
    for (let line = startLine; line <= endLine; line += 1) {
      lines.push(model.getLineContent(line));
    }

    const orderedRegex = /^(\s*)(\d+)\.\s+(.*)$/;
    const alternativeRegexes = alternatives.map((alt) => {
      const escaped = alt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`^(\\s*)${escaped}\\s+(.*)$`);
    });

    const allAreOrdered = lines.every((lineText) => orderedRegex.test(lineText));

    const edits: MonacoEditorNS.IIdentifiedSingleEditOperation[] = [];

    for (let i = 0; i < lines.length; i += 1) {
      const lineNumber = startLine + i;
      const lineText = lines[i];

      let indent = "";
      let content = lineText;

      const orderedMatch = lineText.match(orderedRegex);
      if (orderedMatch) {
        indent = orderedMatch[1];
        content = orderedMatch[3];
      } else {
        let altMatched = false;
        for (const regex of alternativeRegexes) {
          const m = lineText.match(regex);
          if (m) {
            indent = m[1];
            content = m[2];
            altMatched = true;
            break;
          }
        }
        if (!altMatched) {
          const leadingWhitespaceMatch = lineText.match(/^(\s*)/);
          indent = leadingWhitespaceMatch ? leadingWhitespaceMatch[1] : "";
          content = lineText.slice(indent.length);
        }
      }

      if (allAreOrdered && orderedMatch) {
        // Toggle off ordered list: remove numbering
        edits.push({
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: lineText.length + 1,
          },
          text: `${indent}${content}`,
          forceMoveMarkers: true,
        });
      } else {
        // Apply/update ordered list numbering starting from 1
        const number = i + 1;
        edits.push({
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: lineText.length + 1,
          },
          text: `${indent}${number}. ${content}`,
          forceMoveMarkers: true,
        });
      }
    }

    if (edits.length > 0) {
      editorInstance.executeEdits("markdown-toolbar-ordered-list", edits);
      editorInstance.focus();
    }
  };

  const applyWrappedEdit = (
    before: string,
    after?: string,
    options?: { allowInnerToggle?: boolean }
  ) => {
    const editorInstance = editorRef.current;
    if (!editorInstance) return;

    const model = editorInstance.getModel();
    const selection = editorInstance.getSelection();
    if (!model || !selection) return;

    const selectedText = model.getValueInRange(selection);
    const suffix = after ?? before;
    const allowInnerToggle = options?.allowInnerToggle ?? true;

    // If there is selected text, support toggle behavior otherwise, wrap it.
    let textToInsert: string;
    let targetRange: IRange = selection;

    if (selectedText) {
      const directlyWrapped =
        selectedText.startsWith(before) &&
        selectedText.endsWith(suffix) &&
        selectedText.length > before.length + suffix.length;

      if (directlyWrapped) {
        // Selection already includes the markers, so just strip them.
        textToInsert = selectedText.slice(
          before.length,
          selectedText.length - suffix.length
        );
      } else if (allowInnerToggle && selection.startLineNumber === selection.endLineNumber) {
        // Check if selection is inside markers on the same line, like: **selection**
        const lineText = model.getLineContent(selection.startLineNumber);
        const startIndex0 = selection.startColumn - 1;
        const endIndex0 = selection.endColumn - 1;

        const hasPrefix =
          startIndex0 - before.length >= 0 &&
          lineText.slice(startIndex0 - before.length, startIndex0) === before;
        const hasSuffix =
          endIndex0 + suffix.length <= lineText.length &&
          lineText.slice(endIndex0, endIndex0 + suffix.length) === suffix;

        if (hasPrefix && hasSuffix) {
          // Expand range to include markers and replace with inner text (un-bold / un-italic)
          targetRange = {
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn - before.length,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn + suffix.length,
          };
          textToInsert = selectedText;
        } else {
          // Normal wrap
          textToInsert = `${before}${selectedText}${suffix}`;
        }
      } else {
        // Multi-line selection or inner toggle disabled: just wrap
        textToInsert = `${before}${selectedText}${suffix}`;
      }
    } else {
      // No selection: just insert empty wrapped markers and place cursor between them
      textToInsert = `${before}${suffix}`;
    }

    editorInstance.executeEdits("markdown-toolbar", [
      {
        range: targetRange,
        text: textToInsert,
        forceMoveMarkers: true,
      },
    ]);

    editorInstance.focus();
  };

  const handleEditorReady = (editor: MonacoEditorNS.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    setCommands({
      toggleBold: () => {
        applyWrappedEdit("**");
      },
      toggleItalic: () => {
        // Allow italic to toggle on/off, including when only inner text is selected.
        // Combined bold+italic (***text***) will correctly drop just the italic layer.
        applyWrappedEdit("*");
      },
      insertLink: () => {
        const editorInstance = editorRef.current;
        if (!editorInstance) return;

        const model = editorInstance.getModel();
        const selection = editorInstance.getSelection();
        if (!model || !selection) return;

        const selectedText = model.getValueInRange(selection);
        const placeholderUrl = "";
        const linkText = selectedText || "link text";
        const textToInsert = `[${linkText}](${placeholderUrl})`;

        editorInstance.executeEdits("markdown-toolbar-link", [
          {
            range: selection,
            text: textToInsert,
            forceMoveMarkers: true,
          },
        ]);

        // Place cursor inside the URL parentheses
        const openParenIndex = textToInsert.indexOf("(");
        if (openParenIndex !== -1) {
          const cursorColumn =
            selection.startColumn + openParenIndex + 1; // position after '('
          editorInstance.setSelection(
            new Selection(
              selection.startLineNumber,
              cursorColumn,
              selection.startLineNumber,
              cursorColumn
            )
          );
        }

        editorInstance.focus();
      },
      toggleHeading1: () => {
        applyLinePrefixToggle("#", ["##", "###"]);
      },
      toggleHeading2: () => {
        applyLinePrefixToggle("##", ["#", "###"]);
      },
      toggleHeading3: () => {
        applyLinePrefixToggle("###", ["#", "##"]);
      },
      toggleUnorderedList: () => {
        applyLinePrefixToggle("-", ["1."]);
      },
      toggleOrderedList: () => {
        applyOrderedListToggle(["-"]);
      },
      insertImage: () => {
        const editorInstance = editorRef.current;
        if (!editorInstance) return;

        const model = editorInstance.getModel();
        const selection = editorInstance.getSelection();
        if (!model || !selection) return;

        const selectedText = model.getValueInRange(selection);
        const altText = selectedText || "alt text";
        const placeholderUrl = "";
        const textToInsert = `![${altText}](${placeholderUrl})`;

        editorInstance.executeEdits("markdown-toolbar-image", [
          {
            range: selection,
            text: textToInsert,
            forceMoveMarkers: true,
          },
        ]);

        // Place cursor inside the URL parentheses
        const openParenIndex = textToInsert.indexOf("(");
        if (openParenIndex !== -1) {
          const cursorColumn =
            selection.startColumn + openParenIndex + 1; // position after '('
          editorInstance.setSelection(
            new Selection(
              selection.startLineNumber,
              cursorColumn,
              selection.startLineNumber,
              cursorColumn
            )
          );
        }

        editorInstance.focus();
      },
    });
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