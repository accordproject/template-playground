import Editor from '@monaco-editor/react';

const options = {
  minimap: { enabled: false }
}

export default function MarkdownEditor( {value, onChange} : {value: string, onChange?: (value:string|undefined) => void} ) {
  return (
    <div className="editorwrapper">
        <Editor options={ options } height="60vh" defaultValue={value} onChange={onChange}/>
    </div>
  );
}