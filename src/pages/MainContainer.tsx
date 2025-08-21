import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import AgreementData from "../editors/editorsContainer/AgreementData";
import TemplateModel from "../editors/editorsContainer/TemplateModel";
import TemplateMarkdown from "../editors/editorsContainer/TemplateMarkdown";
import useAppStore from "../store/store";
import { AIChatPanel } from "../components/AIChatPanel";
import ProblemPanel from "../components/ProblemPanel";
import SampleDropdown from "../components/SampleDropdown";
import { useState } from "react";
import "../styles/pages/MainContainer.css";

const MainContainer = () => {
  const agreementHtml = useAppStore((state) => state.agreementHtml);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);
  const {
    isAIChatOpen,
    setAIChatOpen,
    isEditorsVisible,
    isPreviewVisible,
    isProblemPanelVisible,
  } = useAppStore((state) => ({
    isAIChatOpen: state.isAIChatOpen,
    setAIChatOpen: state.setAIChatOpen,
    isEditorsVisible: state.isEditorsVisible,
    isPreviewVisible: state.isPreviewVisible,
    isProblemPanelVisible: state.isProblemPanelVisible,
  }));

  const [, setLoading] = useState(true);

  return (
    <div className="main-container">
      <PanelGroup direction="horizontal" className="main-container-panel-group">
        {isEditorsVisible && (
          <>
            <Panel defaultSize={50} minSize={30}>
              <div className="main-container-editors-panel">
                <PanelGroup direction="vertical" className="main-container-editors-panel-group">
                  <Panel defaultSize={30} minSize={20}>
                    <div className="main-container-editor-section tour-concerto-model">
                      <div className="main-container-editor-header">
                        {/* Left side */}
                        <div className="main-container-editor-header-left">
                          <span>Concerto Model</span>
                          <SampleDropdown setLoading={setLoading} />
                        </div>
                        <button
                          id="ai-assistant"
                          onClick={() => setAIChatOpen(!isAIChatOpen)}
                          className="main-container-ai-assistant-button tour-ai-assistant"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 45 20"
                            fill="none"
                            className="main-container-ai-assistant-icon"
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
                              <linearGradient
                                id="ai-gradient"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                              >
                                <stop offset="0%" stopColor="#a78bfa" />
                                <stop offset="50%" stopColor="#ec4899" />
                                <stop offset="100%" stopColor="#ef4444" />
                              </linearGradient>
                            </defs>
                            <text
                              x="32"
                              y="6"
                              fontSize="16"
                              fontWeight="bold"
                              fill="url(#ai-gradient)"
                              textAnchor="middle"
                            >
                              AI
                            </text>
                          </svg>
                          <span>Assistant</span>
                        </button>
                      </div>
                      <div className="main-container-editor-content">
                        <TemplateModel />
                      </div>
                    </div>
                  </Panel>
                  <PanelResizeHandle className="main-container-panel-resize-handle-vertical" />

                  <Panel defaultSize={30} minSize={20}>
                    <div className="main-container-editor-section tour-template-mark">
                      <div className="main-container-editor-header">
                        TemplateMark
                      </div>
                      <div className="main-container-editor-content">
                        <TemplateMarkdown />
                      </div>
                    </div>
                  </Panel>

                  <PanelResizeHandle className="main-container-panel-resize-handle-vertical" />

                  <Panel defaultSize={30} minSize={20}>
                    <div className="main-container-editor-section tour-json-data">
                      <div className="main-container-editor-header">
                        JSON Data
                      </div>
                      <div className="main-container-editor-content">
                        <AgreementData />
                      </div>
                    </div>
                  </Panel>
                  {isProblemPanelVisible && (
                    <>
                      <PanelResizeHandle className="main-container-panel-resize-handle-vertical" />
                      <Panel defaultSize={25} minSize={15}>
                        <ProblemPanel />
                      </Panel>
                    </>
                  )}
                </PanelGroup>
              </div>
            </Panel>
            <PanelResizeHandle className="main-container-panel-resize-handle-horizontal" />
          </>
        )}
        {isPreviewVisible && (
          <>
            <Panel defaultSize={30} minSize={20}>
              <div className="main-container-preview-panel tour-preview-panel">
                <div className="main-container-preview-header">
                  <span>Preview</span>
                </div>
                <div className="main-container-preview-content">
                  <div className="main-container-preview-text">
                    <div
                      className="main-container-agreement"
                      dangerouslySetInnerHTML={{ __html: agreementHtml }}
                      style={{
                        color: textColor,
                        backgroundColor: backgroundColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Panel>
            <PanelResizeHandle className="main-container-panel-resize-handle-horizontal" />
          </>
        )}
        {isAIChatOpen && (
          <>
            <Panel defaultSize={25} minSize={20}>
              <AIChatPanel />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
};

export default MainContainer;
