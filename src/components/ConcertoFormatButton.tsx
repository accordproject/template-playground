import { message } from "antd";
import { MdFormatAlignLeft } from "react-icons/md";
import useAppStore from "../store/store";
import { formatConcertoModel } from "../utils/formatConcertoModel";

interface ConcertoFormatButtonProps {
  disabled?: boolean;
}

const ConcertoFormatButton = ({ disabled = false }: ConcertoFormatButtonProps) => {
  const { editorModelCto, setEditorModelCto, setModelCto } = useAppStore((state) => ({
    editorModelCto: state.editorModelCto,
    setEditorModelCto: state.setEditorModelCto,
    setModelCto: state.setModelCto,
  }));

  const handleFormat = async () => {
    try {
      const formatted = formatConcertoModel(editorModelCto);
      setEditorModelCto(formatted);
      await setModelCto(formatted);
    } catch {
      void message.error("Fix Concerto syntax errors before formatting.");
    }
  };

  return (
    <button
      onClick={() => void handleFormat()}
      className="px-1 pt-1 border-gray-300 bg-white hover:bg-gray-200 rounded shadow-md"
      disabled={disabled || !editorModelCto.trim()}
      title="Format Concerto"
      aria-label="Format Concerto"
      type="button"
    >
      <MdFormatAlignLeft size={16} />
    </button>
  );
};

export default ConcertoFormatButton;
