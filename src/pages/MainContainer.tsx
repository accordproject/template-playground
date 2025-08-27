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
    isEditorsVisible,
    isPreviewVisible,
    isProblemPanelVisible,
  } = useAppStore((state) => ({
    isAIChatOpen: state.isAIChatOpen,
    isEditorsVisible: state.isEditorsVisible,
    isPreviewVisible: state.isPreviewVisible,
    isProblemPanelVisible: state.isProblemPanelVisible,
  }));

  const [, setLoading] = useState(true);

  return (
    <div className="main-container" style={{ backgroundColor }}>
      <PanelGroup direction="horizontal" className="main-container-panel-group"
       style={{position: "fixed", width: "calc(100% - 64px)", height: "calc(100% - 64px)"}}>
        {isEditorsVisible && (
          <>
            <Panel defaultSize={50} minSize={30}>
              <div className="main-container-editors-panel" style={{ backgroundColor }}>
                <PanelGroup direction="vertical" className="main-container-editors-panel-group">
                  <Panel defaultSize={30} minSize={20}>
                    <div className="main-container-editor-section tour-concerto-model">
                      <div className={`main-container-editor-header ${backgroundColor === '#ffffff' ? 'main-container-editor-header-light' : 'main-container-editor-header-dark'}`}>
                        {/* Left side */}
                        <div className="main-container-editor-header-left">
                          <span>Concerto Model</span>
                          <SampleDropdown setLoading={setLoading} />
                        </div>
                      </div>
                      <div className="main-container-editor-content" style={{ backgroundColor }}>
                        <TemplateModel />
                      </div>
                    </div>
                  </Panel>
                  <PanelResizeHandle className="main-container-panel-resize-handle-vertical" />

                  <Panel defaultSize={30} minSize={20}>
                    <div className="main-container-editor-section tour-template-mark">
                      <div className={`main-container-editor-header ${backgroundColor === '#ffffff' ? 'main-container-editor-header-light' : 'main-container-editor-header-dark'}`}>
                        TemplateMark
                      </div>
                      <div className="main-container-editor-content" style={{ backgroundColor }}>
                        <TemplateMarkdown />
                      </div>
                    </div>
                  </Panel>

                  <PanelResizeHandle className="main-container-panel-resize-handle-vertical" />

                  <Panel defaultSize={30} minSize={20}>
                    <div className="main-container-editor-section tour-json-data">
                      <div className={`main-container-editor-header ${backgroundColor === '#ffffff' ? 'main-container-editor-header-light' : 'main-container-editor-header-dark'}`}>
                        JSON Data
                      </div>
                      <div className="main-container-editor-content" style={{ backgroundColor }}>
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
              <div className="main-container-preview-panel tour-preview-panel" style={{ backgroundColor }}>
                <div className={`main-container-preview-header ${backgroundColor === '#ffffff' ? 'main-container-preview-header-light' : 'main-container-preview-header-dark'}`}>
                  <span>Preview</span>
                </div>
                <div className="main-container-preview-content" style={{ backgroundColor }}>
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
            <Panel defaultSize={30} minSize={20}>
              <AIChatPanel />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
};

export default MainContainer;
