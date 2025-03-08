import { useCallback, useMemo } from 'react';
import * as monaco from 'monaco-editor';
import Editor from '@monaco-editor/react';
import useAppStore from '../store/store';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);

  const themeName = useMemo(
    () => (backgroundColor ? 'darkTheme' : 'lightTheme'),
    [backgroundColor]
  );

  const handleEditorWillMount = useCallback((monaco: typeof import('monaco-editor')) => {
    const defineTheme = (name: string, base: monaco.editor.BuiltinTheme) => {
      monaco.editor.defineTheme(name, {
        base,
        inherit: true,
        rules: [],
        colors: {
          'editor.background': backgroundColor,
          'editor.foreground': textColor,
          'editor.lineHighlightBorder': '#EDE8DC',
        },
      });
    };

    defineTheme('lightTheme', 'vs');
    defineTheme('darkTheme', 'vs-dark');
  }, [backgroundColor, textColor]);

  const options = useMemo(
    () => ({
      minimap: { enabled: false },
      wordWrap: 'on' as 'on',
      automaticLayout: true,
      scrollBeyondLastLine: false,
    }),
    []
  );

  const handleChange = useCallback(
    (val?: string) => {
      if (val !== undefined && onChange) onChange(val);
    },
    [onChange]
  );

  return (
    <div className="editorwrapper">
      <Editor
        options= {options}
        language="markdown"
        height="60vh"
        value={value}
        onChange={handleChange}
        beforeMount={handleEditorWillMount}
        theme={themeName}
      />
    </div>
  );
}
