import { LuHeading1, LuHeading2, LuHeading3 } from "react-icons/lu";
import { FaBold, FaItalic, FaLink, FaImage, FaListUl, FaListOl } from "react-icons/fa";
import { useMarkdownEditorContext } from "../contexts/MarkdownEditorContext";
import useAppStore from "../store/store";

export const TemplateMarkdownToolbar = () => {
  const { commands: markdownEditorCommands } = useMarkdownEditorContext();
  const { backgroundColor } = useAppStore((state) => ({
    backgroundColor: state.backgroundColor,
  }));

  const isDarkMode = backgroundColor !== "#ffffff";
  const markdownToolbarButtonClasses = isDarkMode
    ? "markdown-toolbar-button border-none bg-transparent text-white hover:bg-white hover:text-black"
    : "markdown-toolbar-button border-none bg-transparent text-black hover:bg-slate-200";

  return (
    <div className="markdown-toolbar">
      <button
        type="button"
        className={markdownToolbarButtonClasses}
        onClick={() => markdownEditorCommands?.toggleHeading1?.()}
        title="Heading 1"
        aria-label="Heading 1"
      >
        <LuHeading1 size={15} />
      </button>
      <button
        type="button"
        className={markdownToolbarButtonClasses}
        onClick={() => markdownEditorCommands?.toggleHeading2?.()}
        title="Heading 2"
        aria-label="Heading 2"
      >
        <LuHeading2 size={15} />
      </button>
      <button
        type="button"
        className={markdownToolbarButtonClasses}
        onClick={() => markdownEditorCommands?.toggleHeading3?.()}
        title="Heading 3"
        aria-label="Heading 3"
      >
        <LuHeading3 size={15} />
      </button>
      <button
        type="button"
        className={markdownToolbarButtonClasses}
        onClick={() => markdownEditorCommands?.toggleBold?.()}
        title="Bold"
        aria-label="Bold"
      >
        <FaBold />
      </button>
      <button
        type="button"
        className={markdownToolbarButtonClasses}
        onClick={() => markdownEditorCommands?.toggleItalic?.()}
        title="Italic"
        aria-label="Italic"
      >
        <FaItalic />
      </button>
      <button
        type="button"
        className={markdownToolbarButtonClasses}
        onClick={() => markdownEditorCommands?.toggleUnorderedList?.()}
        title="Unordered list"
        aria-label="Unordered list"
      >
        <FaListUl />
      </button>
      <button
        type="button"
        className={markdownToolbarButtonClasses}
        onClick={() => markdownEditorCommands?.toggleOrderedList?.()}
        title="Ordered list"
        aria-label="Ordered list"
      >
        <FaListOl />
      </button>
      <button
        type="button"
        className={markdownToolbarButtonClasses}
        onClick={() => markdownEditorCommands?.insertLink?.()}
        title="Insert link"
        aria-label="Insert link"
      >
        <FaLink />
      </button>
      <button
        type="button"
        className={markdownToolbarButtonClasses}
        onClick={() => markdownEditorCommands?.insertImage?.()}
        title="Insert image"
        aria-label="Insert image"
      >
        <FaImage />
      </button>
    </div>
  );
};


