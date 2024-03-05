import useAppStore from '../store/store';

function AgreementHtml() {
  const agreementHtml = useAppStore((state) => state.agreementHtml)
  return <div className="column">
    <h2>Preview Ouput</h2>
    <p>The result of merging the JSON data with the template. This is AgreementMark converted to HTML.</p>
    <div className="agreement" dangerouslySetInnerHTML={{ __html: agreementHtml }} />
  </div>;
}

export default AgreementHtml;
