import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import AgreementData from "../editors/editorsContainer/AgreementData";
import TemplateModel from "../editors/editorsContainer/TemplateModel";
import TemplateMarkdown from "../editors/editorsContainer/TemplateMarkdown";
import LogicEditor from "../editors/LogicEditor";
import useAppStore from "../store/store";
import { AIChatPanel } from "../components/AIChatPanel";
import ProblemPanel from "../components/ProblemPanel";
import SampleDropdown from "../components/SampleDropdown";
import { useState, useRef } from "react";
import { TemplateMarkdownToolbar } from "../components/TemplateMarkdownToolbar";
import { MarkdownEditorProvider } from "../contexts/MarkdownEditorContext";
import "../styles/pages/MainContainer.css";
import html2pdf from "html2pdf.js";
import { Button, message } from "antd";
import * as monaco from "monaco-editor";
import { MdFormatAlignLeft, MdChevronRight, MdExpandMore } from "react-icons/md";
import DOMPurify from "dompurify";

const MainContainer = () => {
  const agreementHtml = useAppStore((state) => state.agreementHtml);
  const downloadRef = useRef<HTMLDivElement>(null);
  const jsonEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
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
      void message.error("Failed to generate PDF. Please check the console.");
    } finally {
      setIsDownloading(false);
    }
  }

  const handleJsonFormat = () => {
    if (jsonEditorRef.current) {
      void jsonEditorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const {
    isAIChatOpen,
    isEditorsVisible,
    isPreviewVisible,
    isProblemPanelVisible,
    isModelCollapsed,
    isTemplateCollapsed,
    isDataCollapsed,
    toggleModelCollapse,
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
    toggleDataCollapse: state.toggleDataCollapse,
  }));

  const sampleName = useAppStore((s) => s.sampleName);
  const samples = useAppStore((s) => s.samples);
  const editorLogicTs = useAppStore((s) => s.editorLogicTs);
  // Show Logic Editor and Contract Runner whenever the session has logic content
  const hasLogic = editorLogicTs.trim().length > 0 ||
    !!(samples.find((s) => s.NAME === sampleName)?.LOGIC);

  const [, setLoading] = useState(true);

  // Calculate dynamic panel sizes based on visible editors and collapse states.
  // This keeps initial editor heights equal (4 editors => 25% each, 3 editors => 33.33% each).
  const collapsedSize = 5;
  const totalEditorPanels = hasLogic ? 4 : 3;
  const collapsedCount = [isModelCollapsed, isDataCollapsed].filter(Boolean).length;
  const nonCollapsedCount = totalEditorPanels - collapsedCount;
  const expandedSize = nonCollapsedCount > 0
    ? (100 - (collapsedCount * collapsedSize)) / nonCollapsedCount
    : 100 / totalEditorPanels;

  // Create distinct preview background for better visual separation
  const previewBackgroundColor = backgroundColor === '#ffffff'
    ? '#f0f9ff'  // Cool light blue for preview - modern and distinct
    : '#1a1f2e';  // Distinct darker blue-tinted background for preview in dark mode

  const previewHeaderColor = backgroundColor === '#ffffff'
    ? '#dbeafe'  // Slightly darker blue for header in light mode
    : '#0f172a';  // Even darker shade for header in dark mode

  const panelKey = `${String(isModelCollapsed)}-${String(isTemplateCollapsed)}-${String(isDataCollapsed)}`;

  return (
    <div className="main-container" style={{ backgroundColor, height: "calc(100vh - 64px)", overflow: "hidden" }}>
      <PanelGroup direction="horizontal" className="main-container-panel-group"
        style={{ position: "fixed", width: "calc(100% - 64px)", height: "calc(100% - 64px)" }}>
        {isEditorsVisible && (
          <>
            <Panel defaultSize={62.5} minSize={30}>
              <div className="main-container-editors-panel" style={{ backgroundColor }}>
                <PanelGroup key={panelKey} direction="vertical" className="main-container-editors-panel-group">
                  <Panel minSize={3} maxSize={isModelCollapsed ? collapsedSize : 100} defaultSize={isModelCollapsed ? collapsedSize : expandedSize}>
                    <div className="main-container-editor-section tour-concerto-model">
                      <div className={`main-container-editor-header ${backgroundColor === '#ffffff' ? 'main-container-editor-header-light' : 'main-container-editor-header-dark'}`}>
                        <div className="main-container-editor-header-left">
                          <button
                            className="collapse-button"
                            onClick={toggleModelCollapse}
                            style={{
                              color: textColor,
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '4px',
                              marginRight: '4px'
                            }}
                            title={isModelCollapsed ? "Expand" : "Collapse"}
                          >
                            {isModelCollapsed ? <MdChevronRight size={20} /> : <MdExpandMore size={20} />}
                          </button>
                          <span>Data Model <span style={{fontSize: '0.8em', color: '#6b7280'}}>(Concerto)</span></span>
                          <SampleDropdown setLoading={setLoading} />
                        </div>
                      </div>
                      {!isModelCollapsed && (
                        <div className="main-container-editor-content" style={{ backgroundColor }}>
                          <TemplateModel />
                        </div>
                      )}
                    </div>
                  </Panel>
                  <PanelResizeHandle className="main-container-panel-resize-handle-vertical" />

                  <Panel minSize={10} defaultSize={expandedSize}>
                    <MarkdownEditorProvider>
                      <div className="main-container-editor-section tour-template-mark">
                        <div className={`main-container-editor-header ${backgroundColor === '#ffffff' ? 'main-container-editor-header-light' : 'main-container-editor-header-dark'}`}>
                          <span>Template <span style={{fontSize: '0.8em', color: '#6b7280'}}>(TemplateMark)</span></span>
                          <TemplateMarkdownToolbar />
                        </div>
                        <div className="main-container-editor-content" style={{ backgroundColor }}>
                          <TemplateMarkdown />
                        </div>
                      </div>
                    </MarkdownEditorProvider>
                  </Panel>

                  <PanelResizeHandle className="main-container-panel-resize-handle-vertical" />

                  <Panel minSize={3} maxSize={isDataCollapsed ? collapsedSize : 100} defaultSize={isDataCollapsed ? collapsedSize : expandedSize}>
                    <div className="main-container-editor-section tour-json-data">
                      <div className={`main-container-editor-header ${backgroundColor === '#ffffff' ? 'main-container-editor-header-light' : 'main-container-editor-header-dark'}`}>
                        <div className="main-container-editor-header-left">
                          <button
                            className="collapse-button"
                            onClick={toggleDataCollapse}
                            style={{
                              color: textColor,
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '4px',
                              marginRight: '4px'
                            }}
                            title={isDataCollapsed ? "Expand" : "Collapse"}
                          >
                            {isDataCollapsed ? <MdChevronRight size={20} /> : <MdExpandMore size={20} />}
                          </button>
                          <span>Data <span style={{fontSize: '0.8em', color: '#6b7280'}}>(JSON)</span></span>
                        </div>
                        <button
                          onClick={handleJsonFormat}
                          className="px-1 pt-1 border-gray-300 bg-white hover:bg-gray-200 rounded shadow-md"
                          disabled={!jsonEditorRef.current || isDataCollapsed}
                          title="Format JSON"
                        >
                          <MdFormatAlignLeft size={16} />
                        </button>
                      </div>
                      {!isDataCollapsed && (
                        <div className="main-container-editor-content" style={{ backgroundColor }}>
                          <AgreementData editorRef={jsonEditorRef} />
                        </div>
                      )}
                    </div>
                  </Panel>
                  {hasLogic && (
                    <>
                      <PanelResizeHandle className="main-container-panel-resize-handle-vertical" />
                      <Panel defaultSize={expandedSize} minSize={10}>
                        <div className="main-container-editor-section">
                          <div className={`main-container-editor-header ${backgroundColor === '#ffffff' ? 'main-container-editor-header-light' : 'main-container-editor-header-dark'}`}>
                            <span style={{ color: textColor }}>TypeScript Logic</span>
                          </div>
                          <div className="main-container-editor-content" style={{ backgroundColor }}>
                            <LogicEditor />
                          </div>
                        </div>
                      </Panel>
                    </>
                  )}
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
              <div className="main-container-preview-panel tour-preview-panel" style={{ backgroundColor: previewBackgroundColor, height: "100%" }}>
                <div className={`main-container-preview-header ${backgroundColor === '#ffffff' ? 'main-container-preview-header-light' : 'main-container-preview-header-dark'}`} style={{ backgroundColor: previewHeaderColor }}>
                  <span>Preview</span>
                  <Button
                    onClick={() => void handleDownloadPdf()}
                    loading={isDownloading}
                    style={{ marginLeft: "10px" }}
                  >
                    Download PDF
                  </Button>
                </div>
                <div className="main-container-preview-content" style={{ backgroundColor: previewBackgroundColor, height: "calc(100% - 40px)", overflow: "auto" }}>
                  <div className="main-container-preview-text">
                    <div
                      ref={downloadRef}
                      className="main-container-agreement"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(agreementHtml) }}
                      style={{ color: textColor, backgroundColor: previewBackgroundColor, padding: "20px" }}
                    />
                  </div>
                </div>
              </div>
            </Panel>
            {isAIChatOpen && <PanelResizeHandle className="main-container-panel-resize-handle-horizontal" />}
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