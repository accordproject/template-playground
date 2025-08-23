import useAppStore from "../../store/store";
import { Alert, Space } from "antd";
import { sendMessage } from "../../ai-assistant/chatRelay";
import { useState } from "react";

function Errors() {
  const error = useAppStore((state) => state.error);
  const editorsContent = useAppStore((state) => ({
    editorTemplateMark: state.editorValue,
    editorModelCto: state.editorModelCto,
    editorAgreementData: state.editorAgreementData,
  }));
  const [isSending, setIsSending] = useState(false);

  const handleFixError = async () => {
    if (!error || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(`Fix this error: ${error}`, null, editorsContent);
      useAppStore.getState().setAIChatOpen(true);
    } finally {
      setIsSending(false);
    }
  };

  return error ? (
    <Space direction="vertical" style={{ width: "100%", margin: "24px 0 0 24px" }}>
      <div className="relative">
        <Alert message={error} type="error" />
        <button
          onClick={handleFixError}
          disabled={isSending}
          className="absolute top-0 right-0 bg-blue-400 hover:bg-blue-600 text-white rounded-md text-md flex items-center"
          title="Ask AI to fix this error"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 45 20"
            fill="none"
            className="size-8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              stroke="currentColor"
              d="M12 13.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 0.444 3 5c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 14c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
              transform="translate(0, 3)"
            />
            <defs>
              <linearGradient id="ai-fix-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#bdff68ff" />
                <stop offset="50%" stopColor="#e6fc6dff" />
                <stop offset="100%" stopColor="#ebb6b6ff" />
              </linearGradient>
            </defs>
            <text
              x="32"
              y="6"
              fontSize="16"
              fontWeight="bold"
              fill="url(#ai-fix-gradient)"
              textAnchor="middle"
            >
              AI
            </text>
          </svg>
          <span>Fix</span>
        </button>
      </div>
    </Space>
  ) : (
    <></>
  );
}

export default Errors;
