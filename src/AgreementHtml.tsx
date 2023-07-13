import useAppStore from './store';

function AgreementHtml() {
  const agreementHtml = useAppStore((state) => state.agreementHtml)
  return <div className="column">
    <h2>Agreement</h2>
    <div className="agreement" dangerouslySetInnerHTML={{ __html: agreementHtml }}/>
  </div>;
}

export default AgreementHtml;
