import { useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import type { ImperativePanelHandle } from "react-resizable-panels";
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
import { MdExpandMore , MdExpandLess  } from "react-icons/md";


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
    isModelCollapsed,
    isTemplateCollapsed,
    isDataCollapsed,
    toggleModelCollapse,
    toggleTemplateCollapse,
    toggleDataCollapse,
  } = useAppStore((state) => ({
    isAIChatOpen: state.isAIChatOpen,
    isEditorsVisible: state.isEditorsVisible,
    isPreviewVisible: state.isPreviewVisible,
    isProblemPanelVisible: state.isProblemPanelVisible,
    isModelCollapsed: state.isModelCollapsed,
    isTemplateCollapsed: state.isTemplateCollapsed,
    isDataCollapsed: state.isDataCollapsed,
    toggleModelCollapse: state.toggleModelCollapse,
    toggleTemplateCollapse: state.toggleTemplateCollapse,
    toggleDataCollapse: state.toggleDataCollapse,
  }));

  const [, setLoading] = useState(true);

  // Calculate dynamic panel sizes based on collapse states
  const collapsedSize = 7;
  const collapsedCount = [isModelCollapsed, isTemplateCollapsed, isDataCollapsed].filter(Boolean).length;
  const expandedCount = 3 - collapsedCount;
  const expandedSize = expandedCount > 0 ? (100 - (collapsedCount * collapsedSize)) / expandedCount : 33;
  
  const modelPanelRef = useRef<ImperativePanelHandle>(null);
  const templatePanelRef = useRef<ImperativePanelHandle>(null);
  const dataPanelRef = useRef<ImperativePanelHandle>(null);

  type PanelKey = "model" | "template" | "data";
  type PanelValues = { ref: React.RefObject<ImperativePanelHandle> , collapsed: boolean}

  const panelMap: Record<PanelKey,PanelValues> = {
  model: {
    ref: modelPanelRef,
    collapsed: isModelCollapsed
  },
  template: {
    ref: templatePanelRef,
    collapsed: isTemplateCollapsed
  },
  data: {
    ref: dataPanelRef,
    collapsed: isDataCollapsed
  }}

  const prevCollapsed = useRef<Record<PanelKey,boolean>>({
    model: isModelCollapsed,
    template: isTemplateCollapsed,
    data: isDataCollapsed,
  }); 

  useEffect(() => {
 
    (Object.entries(panelMap) as [PanelKey, typeof panelMap[PanelKey]][]).forEach(([key, panel]) => {
      if (prevCollapsed.current[key] !== panel.collapsed) {
        panel.ref.current?.resize(panel.collapsed ? collapsedSize : expandedSize);
      }
    });

    // Update previous states
    prevCollapsed.current = {
      model: isModelCollapsed,
      template: isTemplateCollapsed,
      data: isDataCollapsed,
    };
  }, [isModelCollapsed, isTemplateCollapsed, isDataCollapsed]);

  return (
    <div className="main-container" style={{ backgroundColor }}>
      <PanelGroup direction="horizontal" className="main-container-panel-group"
        style={{ position: "fixed", width: "calc(100% - 64px)", height: "calc(100% - 64px)" }}>
        {isEditorsVisible && (
          <>
            <Panel defaultSize={62.5} minSize={30}>
              <div className="main-container-editors-panel" style={{ backgroundColor }}>
                <PanelGroup direction="vertical" className="main-container-editors-panel-group">
                  <Panel ref={modelPanelRef} minSize={collapsedSize} maxSize={70}>
                    <div className="main-container-editor-section tour-concerto-model" >
                      <div className={`main-container-editor-header ${backgroundColor === '#ffffff' ? 'main-container-editor-header-light' : 'main-container-editor-header-dark'}`}
                      
                      >
                        {/* Left side */}
                        <div className="main-container-editor-header-left"
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                        >
                          <div className="">
                            <span
                            style={{
                              marginRight: "20px"
                            }}
                            >Concerto Model</span>
                            <SampleDropdown setLoading={setLoading} />
                          </div>
                          <button
                            className="collapse-button"
                            onClick={toggleModelCollapse}
                            style={{ 
                              color: textColor, 
                              background: 'transparent', 
                              border: 'none', 
                              cursor: 'pointer',
                              fontSize: '25px',
                            }}
                            title={isModelCollapsed ? "Expand" : "Collapse"}
                          >
                            {isModelCollapsed ?  <MdExpandMore /> : <MdExpandLess />}
                          </button>
                        </div>
                      </div>
                      <div className="main-container-editor-content"
                        style={{
                          backgroundColor,
                          opacity: isModelCollapsed ? 0 : 1,
                          transition: "opacity 0.3s ease-in-out"
                        }}
                      >
                        <TemplateModel />
                      </div>
                    </div>
                  </Panel>

                  <PanelResizeHandle className="main-container-panel-resize-handle-vertical" />

                  <Panel ref={templatePanelRef} minSize={collapsedSize} maxSize={70}>
                    <div className="main-container-editor-section tour-template-mark">
                      <div className={`main-container-editor-header ${backgroundColor === '#ffffff' ? 'main-container-editor-header-light' : 'main-container-editor-header-dark'}`}>
                        <div 
                        className="main-container-editor-header-left"
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                        >                    
                          <span>TemplateMark</span>
                          <button
                            className="collapse-button"
                            onClick={toggleTemplateCollapse}
                            style={{ 
                              color: textColor, 
                              background: 'transparent', 
                              border: 'none', 
                              cursor: 'pointer',
                              fontSize: '25px',
                              
                            }}
                            title={isTemplateCollapsed ? "Expand" : "Collapse"}
                          >
                            {isTemplateCollapsed ?  <MdExpandMore /> : <MdExpandLess />}
                          </button>
                        </div>
                      </div>
                        <div className="main-container-editor-content"
                        style={{
                          backgroundColor,
                          opacity: isTemplateCollapsed ? 0 : 1 ,
                          transition: "opacity 0.3s ease-in-out"
                        }}
                        >
                          <TemplateMarkdown />
                      </div>
                    </div>
                  </Panel>

                  <PanelResizeHandle className="main-container-panel-resize-handle-vertical" />

                  <Panel ref={dataPanelRef} minSize={collapsedSize} maxSize={70}>
                    <div className="main-container-editor-section tour-json-data">
                      <div className={`main-container-editor-header ${backgroundColor === '#ffffff' ? 'main-container-editor-header-light' : 'main-container-editor-header-dark'}`}>
                        <div 
                        className="main-container-editor-header-left"
                        style={{
                          width: "100%",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                        >
                          <span>JSON Data</span>
                          <button
                            className="collapse-button"
                            onClick={toggleDataCollapse}
                            style={{ 
                              color: textColor, 
                              background: 'transparent', 
                              border: 'none', 
                              cursor: 'pointer',
                              fontSize: '25px',
                              
                            }}
                            title={isDataCollapsed ? "Expand" : "Collapse"}
                          >
                            {isDataCollapsed ?  <MdExpandMore /> : <MdExpandLess />}
                          </button>
                        </div>
                      </div>
                        <div className="main-container-editor-content" 
                        style={{
                          backgroundColor,
                          opacity: isDataCollapsed ? 0 : 1,
                          transition: "opacity 0.3s ease-in-out"
                        }}
                        >
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
