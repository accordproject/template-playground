import { ChangeEventHandler } from "react";
import ControlledTextArea from "./ControlledTextArea";

export default function MarkdownEditor( {readOnly, value, onChange} : {readOnly?: boolean, value: string, onChange?: ChangeEventHandler<HTMLTextAreaElement>} ) {
  return (
    <div className="textwrapper">
        <ControlledTextArea readOnly={readOnly}
          rows={20}
          value={value}
          onChange={onChange}
        />
    </div>
  );
}