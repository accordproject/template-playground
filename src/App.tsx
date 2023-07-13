import { useEffect } from 'react';
import AgreementData from './AgreementData';
import AgreementHtml from './AgreementHtml';
import './App.css';
import Errors from './Errors';
import TemplateMarkdown from './TemplateMarkdown';
import TemplateModel from './TemplateModel';
import useAppStore from './store';

function App() {
  const rebuild = useAppStore((state) => state.rebuild);

  useEffect( () => {
    void rebuild();
  }, [rebuild])

  return (
    <div>
      <header className="App-header">
        <img src='APLogo.png' height={50}/>
        <h1>Template Playground</h1>
      </header>
      <Errors/>
      <div className="row">
      <TemplateMarkdown/>
      <TemplateModel/>
      <AgreementData/>
      <AgreementHtml/>
      </div>
    </div>
  );
}

export default App;
