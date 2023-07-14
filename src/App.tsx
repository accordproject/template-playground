import { useEffect } from 'react';
import AgreementData from './AgreementData';
import AgreementHtml from './AgreementHtml';
import './App.css';
import Errors from './Errors';
import TemplateMarkdown from './TemplateMarkdown';
import TemplateModel from './TemplateModel';
import useAppStore from './store';
import Header from './Header';
import Footer from './Footer';

function App() {
  const rebuild = useAppStore((state) => state.rebuild);

  useEffect( () => {
    void rebuild();
  }, [rebuild])

  return (
    <div>
      <Header/>
      <Errors/>
      <div className="row">
      <TemplateMarkdown/>
      <TemplateModel/>
      <AgreementData/>
      <AgreementHtml/>
      </div>
      <Footer/>
    </div>
  );
}

export default App;
