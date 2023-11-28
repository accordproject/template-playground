import * as monaco from '@monaco-editor/react';
import { editor, MarkerSeverity } from 'monaco-editor';
import useAppStore from './store';
import { useEffect, useMemo } from 'react';

const options:editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  wordWrap: "on"
}
const concertoKeywords = ['map','concept','from','optional','default','range','regex','length','abstract','namespace','import', 'enum', 'scalar', 'extends', 'default', 'participant','asset', 'o','identified by','transaction','event'];
const concertoTypes = ['String','Integer','Double','DateTime','Long','Boolean']

export default function ConcertoEditor( {value, onChange} : {value: string, onChange?: (value:string|undefined) => void} ) {

    const monacoEditor = monaco.useMonaco();
    const error = useAppStore((state) => state.error);
    const ctoErr = useMemo(() => {
        if (error && error.startsWith("c:")) {
        return error;
        }
    }, [error]);
    useEffect(() => {
        let model = monacoEditor?.editor.getModels()[0];
        if (ctoErr && monacoEditor) {
        const match = ctoErr.match(/Line (\d+) column (\d+)/);

        const lineNumber = parseInt(match[1]);
        const columnNumber = parseInt(match[2]) - 1;
        monacoEditor?.editor.setModelMarkers(model, "customMarker", [
            {
            startLineNumber: lineNumber,
            startColumn: columnNumber - 1,
            endLineNumber: lineNumber,
            endColumn: columnNumber + 1,
            message: ctoErr,
            severity: MarkerSeverity.Error,
            },
        ]);
        } else {
        monacoEditor?.editor.setModelMarkers(model, "customMarker", []);
        }
    }, [ctoErr,monacoEditor]);
    function handleEditorWillMount(monaco:monaco.Monaco) {
        monaco.languages.register({
            id: 'concerto',
            extensions: ['.cto'],
            aliases: ['Concerto', 'concerto'],
            mimetypes: ['application/concerto'],
        });
      
        monaco.languages.setMonarchTokensProvider('concerto', {
            keywords: concertoKeywords,
            typeKeywords: concertoTypes,
            operators: ['=', '{', '}', '@', '"'],
            symbols: /[=}{@"]+/,
            escapes: /\\(?:[btnfru"'\\]|\\u[0-9A-Fa-f]{4})/,
            tokenizer: {
            root: [
                { include: '@whitespace' },
                [/[a-zA-Z_]\w*/, {
                cases: {
                    '@keywords': 'keyword',
                    '@typeKeywords': 'type',
                    '@default': 'identifier',
                },
                }],
                [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-terminated string
                [/"/, 'string', '@string'],
            ],
            string: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, 'string', '@pop'],
            ],
            whitespace: [
                [/\s+/, 'white'],
                [/(\/\/.*)/, 'comment'],
            ],
            },
        });
        monaco.editor.defineTheme('concertoTheme', {
            base: 'vs',
            inherit: true,
            rules: [
            { token: 'keyword', foreground: 'cd2184' },
            { token: 'type', foreground: '008080' },
            { token: 'identifier', foreground: '000000' },
            { token: 'string', foreground: '008000' },
            { token: 'string.escape', foreground: '800000' },
            { token: 'comment', foreground: '808080' },
            { token: 'white', foreground: 'FFFFFF' },
            ],
            colors: {},
        });
        
        monaco.editor.setTheme('concertoTheme');
    }
  
    return (
    <div className="editorwrapper">
        <monaco.Editor options={ options }
        language='concerto' height="60vh" value={value} onChange={onChange} beforeMount={handleEditorWillMount}/>
    </div>
  );
}