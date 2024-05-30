import { Message } from "semantic-ui-react";
import useAppStore from "./store";

function Errors() {
  const error = useAppStore((state) => state.error);
  return error ? (
    <div style={{ width: "100%", marginBottom: "1rem" }}>
      <Message negative>
        <Message.Header>Error</Message.Header>
        <p>{error}</p>
      </Message>
    </div>
  ) : null;
}

export default Errors;
