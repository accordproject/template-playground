import {
	FaBold,
	FaImage,
	FaItalic,
	FaLink,
	FaListOl,
	FaListUl,
} from 'react-icons/fa';
import {LuHeading1, LuHeading2, LuHeading3} from 'react-icons/lu';
import {useMarkdownEditorContext} from '../contexts/MarkdownEditorContext';

export const TemplateMarkdownToolbar = () => {
	const {commands: markdownEditorCommands} = useMarkdownEditorContext();

	const baseButtonClass =
		'border-none bg-transparent p-1 rounded text-[var(--text-color)] hover:bg-[var(--hover-bg-color)]';

	return (
		<div className="markdown-toolbar">
			<button
				type="button"
				className={baseButtonClass}
				onClick={() => markdownEditorCommands?.toggleHeading1?.()}
				title="Heading 1"
			>
				<LuHeading1 size={15} />
			</button>

			<button
				type="button"
				className={baseButtonClass}
				onClick={() => markdownEditorCommands?.toggleHeading2?.()}
				title="Heading 2"
			>
				<LuHeading2 size={15} />
			</button>

			<button
				type="button"
				className={baseButtonClass}
				onClick={() => markdownEditorCommands?.toggleHeading3?.()}
				title="Heading 3"
			>
				<LuHeading3 size={15} />
			</button>

			<button
				type="button"
				className={baseButtonClass}
				onClick={() => markdownEditorCommands?.toggleBold?.()}
				title="Bold"
			>
				<FaBold />
			</button>

			<button
				type="button"
				className={baseButtonClass}
				onClick={() => markdownEditorCommands?.toggleItalic?.()}
				title="Italic"
			>
				<FaItalic />
			</button>

			<button
				type="button"
				className={baseButtonClass}
				onClick={() => markdownEditorCommands?.toggleUnorderedList?.()}
				title="Unordered list"
			>
				<FaListUl />
			</button>

			<button
				type="button"
				className={baseButtonClass}
				onClick={() => markdownEditorCommands?.toggleOrderedList?.()}
				title="Ordered list"
			>
				<FaListOl />
			</button>

			<button
				type="button"
				className={baseButtonClass}
				onClick={() => markdownEditorCommands?.insertLink?.()}
				title="Insert link"
			>
				<FaLink />
			</button>

			<button
				type="button"
				className={baseButtonClass}
				onClick={() => markdownEditorCommands?.insertImage?.()}
				title="Insert image"
			>
				<FaImage />
			</button>
		</div>
	);
};
