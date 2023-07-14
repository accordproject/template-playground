import useAppStore from './store';

function AgreementHtml() {
  const agreementHtml = useAppStore((state) => state.agreementHtml)
  return <div className="column">
    <div className="tooltip"><h3>Output</h3>
      <span className="tooltiptext">The result of merging the JSON data with the template. This is AgreementMark converted to HTML.</span>
    </div>
    <div className="agreement" dangerouslySetInnerHTML={{ __html: agreementHtml }}/>
  </div>;
}

export default AgreementHtml;
