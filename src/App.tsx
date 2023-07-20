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
import SampleDropdown from './SampleDropdown';

function App() {
  const init = useAppStore((state) => state.init);

  useEffect( () => {
    void init();
  }, [init])

  return (
    <div>
      <Header/>
      <SampleDropdown/>
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
