import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import AgreementData from "../editors/editorsContainer/AgreementData";
import TemplateModel from "../editors/editorsContainer/TemplateModel";
import TemplateMarkdown from "../editors/editorsContainer/TemplateMarkdown";
import useAppStore from "../store/store";
import { AIChatPanel } from "../components/AIChatPanel";
import ProblemPanel from "../components/ProblemPanel";
import SampleDropdown from "../components/SampleDropdown";
import { useState, useRef } from "react";
import "../styles/pages/MainContainer.css";
import html2pdf from "html2pdf.js";
import { Button } from "antd";

const MainContainer = () => {
  const agreementHtml = useAppStore((state) => state.agreementHtml);
  const downloadRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);

  const handleDownloadPdf = async () => {
    const element = downloadRef.current;
    if (!element) return;

    try {
      setIsDownloading(true);
      const options = {
        margin: 10,
        filename: 'agreement.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: true,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      } as const;

      await html2pdf().set(options).from(element).save();
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please check the console.");
    } finally {
      setIsDownloading(false);
    }
  }

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
        style={{ position: "fixed", width: "calc(100% - 64px)", height: "calc(100% - 64px)" }}>
        {isEditorsVisible && (
          <>
            <Panel defaultSize={62.5} minSize={30}>
              <div className="main-container-editors-panel" style={{ backgroundColor }}>
                <PanelGroup direction="vertical" className="main-container-editors-panel-group">
                  <Panel minSize={20}>
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

                  <Panel minSize={20}>
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

                  <Panel minSize={20}>
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
            <Panel defaultSize={37.5} minSize={20}>
              <div className="main-container-preview-panel tour-preview-panel" style={{ backgroundColor }}>
                <div className={`main-container-preview-header ${backgroundColor === '#ffffff' ? 'main-container-preview-header-light' : 'main-container-preview-header-dark'}`}>
                  <span>Preview</span>
                  <Button 
                    onClick={handleDownloadPdf}
                    loading={isDownloading} 
                    style={{ marginLeft: "10px" }}
                  >
                   Download PDF
                  </Button>
                </div>
                <div className="main-container-preview-content" style={{ backgroundColor }}>
                  <div className="main-container-preview-text">
                    <div
                      ref={downloadRef}
                      className="main-container-agreement"
                      dangerouslySetInnerHTML={{ __html: agreementHtml }}
                      style={{
                        color: textColor,
                        backgroundColor: backgroundColor,
                        padding: "20px"
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
