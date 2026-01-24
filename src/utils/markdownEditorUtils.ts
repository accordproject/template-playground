import { editor as MonacoEditorNS, IRange, Selection } from "monaco-editor";

/**
 * Gets the editor instance, model, and selection, returning null if any are unavailable
 */
export function getEditorState(
  editorInstance: MonacoEditorNS.IStandaloneCodeEditor | null,
): {
  editor: MonacoEditorNS.IStandaloneCodeEditor;
  model: MonacoEditorNS.ITextModel;
  selection: Selection;
} | null {
  if (!editorInstance) return null;

  const model = editorInstance.getModel();
  const selection = editorInstance.getSelection();
  if (!model || !selection) return null;

  return { editor: editorInstance, model, selection };
}

/**
 * Creates a full-line edit range for a given line number
 */
export function createLineEditRange(
  lineNumber: number,
  lineLength: number,
): IRange {
  return {
    startLineNumber: lineNumber,
    startColumn: 1,
    endLineNumber: lineNumber,
    endColumn: lineLength + 1,
  };
}

/**
 * Parses a line to extract leading whitespace and content
 */
export function parseLine(lineText: string): {
  leadingWhitespace: string;
  content: string;
} {
  const match = lineText.match(/^(\s*)/);
  const leadingWhitespace = match ? match[1] : "";
  const content = lineText.slice(leadingWhitespace.length);
  return { leadingWhitespace, content };
}

/**
 * Detects if content starts with any of the given prefixes and returns the matched prefix and stripped content
 */
export function detectPrefix(
  content: string,
  prefixes: string[],
): { matched?: string; stripped: string } {
  const trimmed = content.trimStart();
  const leadingSpaces = content.length - trimmed.length;

  for (const prefix of prefixes) {
    const withSpace = `${prefix} `;
    if (trimmed.startsWith(withSpace)) {
      return {
        matched: prefix,
        stripped: trimmed.slice(withSpace.length),
      };
    }
    if (trimmed === prefix) {
      return { matched: prefix, stripped: "" };
    }
  }
  return { matched: undefined, stripped: content.slice(leadingSpaces) };
}

/**
 * Checks if all lines have the specified prefix
 */
export function allLinesHavePrefix(
  lines: string[],
  prefix: string,
  allPrefixes: string[],
): boolean {
  return lines.every(lineText => {
    const { content } = parseLine(lineText);
    const detected = detectPrefix(content, allPrefixes);
    return detected.matched === prefix.trim();
  });
}

/**
 * Creates an edit operation for a line
 */
export function createLineEdit(
  lineNumber: number,
  lineText: string,
  newText: string,
): MonacoEditorNS.IIdentifiedSingleEditOperation {
  return {
    range: createLineEditRange(lineNumber, lineText.length),
    text: newText,
    forceMoveMarkers: true,
  };
}

/**
 * Applies line prefix toggle logic - adds or removes a prefix from selected lines
 */
export function applyLinePrefixToggle(
  editorInstance: MonacoEditorNS.IStandaloneCodeEditor,
  prefix: string,
  alternatives: string[] = [],
): void {
  const state = getEditorState(editorInstance);
  if (!state) return;

  const { model, selection } = state;
  const startLine = selection.startLineNumber;
  const endLine = selection.endLineNumber;

  // Collect all lines in selection
  const lines: string[] = [];
  for (let line = startLine; line <= endLine; line += 1) {
    lines.push(model.getLineContent(line));
  }

  const allPrefixes = [prefix, ...alternatives].map(p => p.trim());
  const shouldToggleOff = allLinesHavePrefix(lines, prefix, allPrefixes);

  const edits: MonacoEditorNS.IIdentifiedSingleEditOperation[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const lineNumber = startLine + i;
    const lineText = lines[i];
    const { leadingWhitespace, content } = parseLine(lineText);
    const detected = detectPrefix(content, allPrefixes);

    let newText: string;

    const isUnorderedListToggle = prefix === "-";

    if (shouldToggleOff && detected.matched === prefix.trim()) {
      // Remove prefix (toggle off)
      const newContent = detected.stripped.replace(/^(\s+)/, " ");
      newText = `${leadingWhitespace}${newContent}`;
    } else {
      // Apply prefix, stripping any existing alternative prefix first
      const baseContent = isUnorderedListToggle
        ? content.replace(/^\d+\.\s+/, "")
        : detected.matched !== undefined
          ? detected.stripped
          : content;
      newText = `${leadingWhitespace}${prefix} ${baseContent}`;
    }

    edits.push(createLineEdit(lineNumber, lineText, newText));
  }

  if (edits.length > 0) {
    editorInstance.executeEdits("markdown-toolbar-prefix", edits);
    editorInstance.focus();
  }
}

/**
 * Applies ordered list toggle with sequential numbering
 */
export function applyOrderedListToggle(
  editorInstance: MonacoEditorNS.IStandaloneCodeEditor,
  alternatives: string[] = [],
): void {
  const state = getEditorState(editorInstance);
  if (!state) return;

  const { model, selection } = state;
  const startLine = selection.startLineNumber;
  const endLine = selection.endLineNumber;

  const lines: string[] = [];
  for (let line = startLine; line <= endLine; line += 1) {
    lines.push(model.getLineContent(line));
  }

  const orderedRegex = /^(\s*)(\d+)\.\s+(.*)$/;
  const alternativeRegexes = alternatives.map(alt => {
    const escaped = alt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`^(\\s*)${escaped}\\s+(.*)$`);
  });

  const allAreOrdered = lines.every(lineText => orderedRegex.test(lineText));
  const edits: MonacoEditorNS.IIdentifiedSingleEditOperation[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const lineNumber = startLine + i;
    const lineText = lines[i];
    const { leadingWhitespace } = parseLine(lineText);

    let content = lineText;
    let indent = leadingWhitespace;

    const orderedMatch = lineText.match(orderedRegex);
    if (orderedMatch) {
      indent = orderedMatch[1];
      content = orderedMatch[3];
    } else {
      // Try to match alternative prefixes
      let altMatched = false;
      for (const regex of alternativeRegexes) {
        const match = lineText.match(regex);
        if (match) {
          indent = match[1];
          content = match[2];
          altMatched = true;
          break;
        }
      }
      if (!altMatched) {
        content = lineText.slice(indent.length);
      }
    }

    let newText: string;
    if (allAreOrdered && orderedMatch) {
      // Toggle off: remove numbering
      newText = `${indent}${content}`;
    } else {
      // Apply sequential numbering
      const number = i + 1;
      newText = `${indent}${number}. ${content}`;
    }

    edits.push(createLineEdit(lineNumber, lineText, newText));
  }

  if (edits.length > 0) {
    editorInstance.executeEdits("markdown-toolbar-ordered-list", edits);
    editorInstance.focus();
  }
}

/**
 * Applies wrapped edit (for bold, italic, etc.) with toggle support
 */
export function applyWrappedEdit(
  editorInstance: MonacoEditorNS.IStandaloneCodeEditor,
  before: string,
  after?: string,
  options?: { allowInnerToggle?: boolean },
): void {
  const state = getEditorState(editorInstance);
  if (!state) return;

  const { model, selection } = state;
  const selectedText = model.getValueInRange(selection);
  const suffix = after ?? before;
  const allowInnerToggle = options?.allowInnerToggle ?? true;

  let textToInsert: string;
  let targetRange: IRange = selection;

  if (selectedText) {
    const directlyWrapped =
      selectedText.startsWith(before) &&
      selectedText.endsWith(suffix) &&
      selectedText.length > before.length + suffix.length;

    if (directlyWrapped) {
      // Strip markers
      textToInsert = selectedText.slice(
        before.length,
        selectedText.length - suffix.length,
      );
    } else if (
      allowInnerToggle &&
      selection.startLineNumber === selection.endLineNumber
    ) {
      // Check if selection is inside markers on the same line
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
        // Expand range to include markers and replace with inner text
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
    // No selection: insert empty wrapped markers
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
}

/**
 * Inserts a markdown link or image and positions cursor inside URL parentheses
 */
export function insertMarkdownLinkOrImage(
  editorInstance: MonacoEditorNS.IStandaloneCodeEditor,
  selectedText: string,
  isImage: boolean,
): void {
  const state = getEditorState(editorInstance);
  if (!state) return;

  const { selection } = state;
  const displayText = selectedText || (isImage ? "alt text" : "link text");
  const placeholderUrl = "";
  const textToInsert = isImage
    ? `![${displayText}](${placeholderUrl})`
    : `[${displayText}](${placeholderUrl})`;

  editorInstance.executeEdits(
    isImage ? "markdown-toolbar-image" : "markdown-toolbar-link",
    [
      {
        range: selection,
        text: textToInsert,
        forceMoveMarkers: true,
      },
    ],
  );

  // Place cursor inside the URL parentheses
  const openParenIndex = textToInsert.indexOf("(");
  if (openParenIndex !== -1) {
    const cursorColumn = selection.startColumn + openParenIndex + 1;
    editorInstance.setSelection(
      new Selection(
        selection.startLineNumber,
        cursorColumn,
        selection.startLineNumber,
        cursorColumn,
      ),
    );
  }

  editorInstance.focus();
}
