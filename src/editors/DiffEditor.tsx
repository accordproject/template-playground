import { lazy, Suspense } from "react";
import { DiffEditorProps as MonacoDiffEditorProps } from "@monaco-editor/react";

const DiffEditor = lazy(() =>
    import("@monaco-editor/react").then((mod) => ({ default: mod.DiffEditor }))
);

interface DiffEditorProps extends MonacoDiffEditorProps {
    original: string;
    modified: string;
    language: string;
    theme: string;
}

export default function DiffViewer({
    original,
    modified,
    language,
    theme,
    ...props
}: DiffEditorProps) {

    const options = {
        renderSideBySide: true,
        minimap: { enabled: false },
        wordWrap: "on" as const,
        scrollBeyondLastLine: false,
        readOnly: true,
        ...props.options,
    };

    return (
        <div className="editorwrapper h-full w-full">
            <Suspense fallback={<div>Loading Diff Editor...</div>}>
                <DiffEditor
                    original={original}
                    modified={modified}
                    language={language}
                    theme={theme}
                    options={options}
                    height="100%"
                />
            </Suspense>
        </div>
    );
}
