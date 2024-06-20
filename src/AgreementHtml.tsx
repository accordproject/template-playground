import useAppStore from "./store";

function AgreementHtml() {
  const agreementHtml = useAppStore((state) => state.agreementHtml);

  return (
    <div
      className="column"
      style={{
        border: "1px solid #d9d9d9",
        borderRadius: "8px",
        padding: "16px 16px 100px 16px",
        height: "calc(100vh - 64px)",
        overflowY: "auto",
      }}
    >
      <h2 style={{ textAlign: "center" }}>Preview Output</h2>
      <p>
        The result of merging the JSON data with the template. This is
        AgreementMark converted to HTML.
      </p>
      <div
        className="agreement"
        dangerouslySetInnerHTML={{ __html: agreementHtml }}
      />
    </div>
  );
}

export default AgreementHtml;
