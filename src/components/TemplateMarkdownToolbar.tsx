import { LuHeading1, LuHeading2, LuHeading3 } from "react-icons/lu";
import { FaBold, FaItalic, FaLink, FaImage, FaListUl, FaListOl } from "react-icons/fa";
import { useMarkdownEditorContext } from "../contexts/MarkdownEditorContext";

export const TemplateMarkdownToolbar = () => {
  const { commands: markdownEditorCommands, hasSelection } = useMarkdownEditorContext();

  return (
    <div className="markdown-toolbar">
      <button
        type="button"
        className="markdown-toolbar-button border-none bg-transparent hover:bg-slate-200"
        onClick={() => markdownEditorCommands?.toggleHeading1?.()}
        title="Heading 1"
      >
        <LuHeading1 size={15} />
      </button>
      <button
        type="button"
        className="markdown-toolbar-button border-none bg-transparent hover:bg-slate-200"
        onClick={() => markdownEditorCommands?.toggleHeading2?.()}
        title="Heading 2"
      >
        <LuHeading2 size={15} />
      </button>
      <button
        type="button"
        className="markdown-toolbar-button border-none bg-transparent hover:bg-slate-200"
        onClick={() => markdownEditorCommands?.toggleHeading3?.()}
        title="Heading 3"
      >
        <LuHeading3 size={15} />
      </button>
      <button
        type="button"
        className="markdown-toolbar-button border-none bg-transparent hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={() => markdownEditorCommands?.toggleBold?.()}
        title="Bold"
        disabled={!hasSelection}
      >
        <FaBold />
      </button>
      <button
        type="button"
        className="border-none bg-transparent hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
        onClick={() => markdownEditorCommands?.toggleItalic?.()}
        title="Italic"
        disabled={!hasSelection}
      >
        <FaItalic />
      </button>
      <button
        type="button"
        className="border-none bg-transparent hover:bg-slate-200"
        onClick={() => markdownEditorCommands?.toggleUnorderedList?.()}
        title="Unordered list"
      >
        <FaListUl />
      </button>
      <button
        type="button"
        className="border-none bg-transparent hover:bg-slate-200"
        onClick={() => markdownEditorCommands?.toggleOrderedList?.()}
        title="Ordered list"
      >
        <FaListOl />
      </button>
      <button
        type="button"
        className="border-none bg-transparent hover:bg-slate-200"
        onClick={() => markdownEditorCommands?.insertLink?.()}
        title="Insert link"
      >
        <FaLink />
      </button>
      <button
        type="button"
        className="border-none bg-transparent hover:bg-slate-200"
        onClick={() => markdownEditorCommands?.insertImage?.()}
        title="Insert image"
      >
        <FaImage />
      </button>
    </div>
  );
};


