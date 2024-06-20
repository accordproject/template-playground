import * as monaco from '@monaco-editor/react';
import { editor } from 'monaco-editor';

const options:editor.IStandaloneEditorConstructionOptions = {
  minimap: { enabled: false },
  wordWrap: "on",
  automaticLayout:true,
  scrollBeyondLastLine: false,
}

export default function MarkdownEditor( {value, onChange} : {value: string, onChange?: (value:string|undefined) => void} ) {
  return (
    <div className="editorwrapper">
        <monaco.Editor options={ options } 
        language='markdown' height="60vh" value={value} onChange={onChange}/>
    </div>
  );
}