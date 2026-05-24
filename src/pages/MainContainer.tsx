import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import AgreementData from "../editors/editorsContainer/AgreementData";
import TemplateModel from "../editors/editorsContainer/TemplateModel";
import TemplateMarkdown from "../editors/editorsContainer/TemplateMarkdown";
import LogicEditor from "../editors/LogicEditor";
import useAppStore from "../store/store";
import { AIChatPanel } from "../components/AIChatPanel";
import ProblemPanel from "../components/ProblemPanel";
import ConcertoFormatButton from "../components/ConcertoFormatButton";
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
      
      // --- FIX START: Store original styles ---
      const originalBg = element.style.backgroundColor;
      const originalColor = element.style.color;
      
      // Force White Background / Black Text for PDF
      element.style.backgroundColor = '#ffffff';
      element.style.color = '#000000';
      // --- FIX END ---

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
      
      // --- FIX START: Restore original styles ---
      element.style.backgroundColor = originalBg;
      element.style.color = originalColor;
      // --- FIX END ---

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

  const isAIChatOpen = useAppStore((s) => s.isAIChatOpen);
  const isEditorsVisible = useAppStore((s) => s.isEditorsVisible);
  const isPreviewVisible = useAppStore((s) => s.isPreviewVisible);
  const isProblemPanelVisible = useAppStore((s) => s.isProblemPanelVisible);
  const isModelCollapsed = useAppStore((s) => s.isModelCollapsed);
  const isTemplateCollapsed = useAppStore((s) => s.isTemplateCollapsed);
  const isDataCollapsed = useAppStore((s) => s.isDataCollapsed);
  const toggleModelCollapse = useAppStore((s) => s.toggleModelCollapse);
  const toggleTemplateCollapse = useAppStore((s) => s.toggleTemplateCollapse);
  const toggleDataCollapse = useAppStore((s) => s.toggleDataCollapse);

  const isLogicFeatureEnabled = useAppStore((s) => s.isLogicFeatureEnabled);
  
  // Select the boolean directly to prevent MainContainer from re-rendering on every keystroke
  const hasLogicContent = useAppStore((s) => 
    s.editorLogicTs.trim().length > 0 || !!(s.samples.find((sample) => sample.NAME === s.sampleName)?.LOGIC)
  );
  
  // Show Logic Editor only if the feature flag is enabled AND there is logic content
  const hasLogic = isLogicFeatureEnabled && hasLogicContent;

  const [, setLoading] = useState(true);

  // Calculate dynamic panel sizes based on visible editors and collapse states.
  // This keeps initial editor heights equal (4 editors => 25% each, 3 editors => 33.33% each).
  const collapsedSize = 5;
  const totalEditorPanels = hasLogic ? 4 : 3;
  const collapsedCount = [isModelCollapsed, isTemplateCollapsed, isDataCollapsed].filter(Boolean).length;
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


  const panelKey = `${String(isModelCollapsed)}-${String(isTemplateCollapsed)}-${String(isDataCollapsed)}-${String(hasLogic)}`;

  return (
    <div className="main-container" style={{ backgroundColor, height: "calc(100vh - 64px)", overflow: "hidden" }}>
      <PanelGroup direction="horizontal" className="main-container-panel-group"
        style={{ position: "fixed", width: "calc(100% - 64px)", height: "calc(100% - 64px)" }}>
        {isEditorsVisible && (
          <>
            <Panel defaultSize={62.5} minSize={30}>
              <div className="main-container-editors-panel" style={{ backgroundColor }}>
                <PanelGroup key={panelKey} direction="vertical" className="main-container-editors-panel-group">
                  <Panel id="panel-model" order={1} minSize={3} maxSize={isModelCollapsed ? collapsedSize : 100} defaultSize={isModelCollapsed ? collapsedSize : expandedSize}>
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
                            title={isModelCollapsed ? "Expand Data Model panel" : "Collapse Data Model panel"}
                            aria-label={isModelCollapsed ? "Expand Data Model panel" : "Collapse Data Model panel"}
                          >
                            {isModelCollapsed ? <MdChevronRight size={20} /> : <MdExpandMore size={20} />}
                          </button>
                          <span>Data Model <span style={{ fontSize: '0.75em', opacity: 0.6, fontWeight: 400 }}>(Concerto)</span></span>
                          <SampleDropdown setLoading={setLoading} />
                        </div>
                        <ConcertoFormatButton disabled={isModelCollapsed} />
                      </div>
                      {!isModelCollapsed && (
                        <div className="main-container-editor-content" style={{ backgroundColor }}>
                          <TemplateModel />
                        </div>
                      )}
                    </div>
                  </Panel>
                  <PanelResizeHandle className="main-container-panel-resize-handle-vertical" />

                  <Panel id="panel-template" order={2} minSize={3} maxSize={isTemplateCollapsed ? collapsedSize : 100} defaultSize={isTemplateCollapsed ? collapsedSize : expandedSize}>
                    <MarkdownEditorProvider>
                      <div className="main-container-editor-section tour-template-mark">
                        <div className={`main-container-editor-header ${backgroundColor === '#ffffff' ? 'main-container-editor-header-light' : 'main-container-editor-header-dark'}`}>
                          <div className="main-container-editor-header-left">
                            <button
                              className="collapse-button"
                              onClick={toggleTemplateCollapse}
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
                              title={isTemplateCollapsed ? "Expand Template panel" : "Collapse Template panel"}
                              aria-label={isTemplateCollapsed ? "Expand Template panel" : "Collapse Template panel"}
                            >
                              {isTemplateCollapsed ? <MdChevronRight size={20} /> : <MdExpandMore size={20} />}
                            </button>
                            <span>Template <span style={{ fontSize: '0.75em', opacity: 0.6, fontWeight: 400 }}>(TemplateMark)</span></span>
                          </div>
                          {!isTemplateCollapsed && <TemplateMarkdownToolbar />}
                        </div>
                        {!isTemplateCollapsed && (
                          <div className="main-container-editor-content" style={{ backgroundColor }}>
                            <TemplateMarkdown />
                          </div>
                        )}
                      </div>
                    </MarkdownEditorProvider>
                  </Panel>

                  <PanelResizeHandle className="main-container-panel-resize-handle-vertical" />

                  <Panel id="panel-data" order={3} minSize={3} maxSize={isDataCollapsed ? collapsedSize : 100} defaultSize={isDataCollapsed ? collapsedSize : expandedSize}>
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
                            title={isDataCollapsed ? "Expand Data panel" : "Collapse Data panel"}
                            aria-label={isDataCollapsed ? "Expand Data panel" : "Collapse Data panel"}
                          >
                            {isDataCollapsed ? <MdChevronRight size={20} /> : <MdExpandMore size={20} />}
                          </button>
                          <span>Data <span style={{ fontSize: '0.75em', opacity: 0.6, fontWeight: 400 }}>(JSON)</span></span>
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
                      <Panel id="panel-logic" order={4} defaultSize={expandedSize} minSize={10}>
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
                      <Panel id="panel-problem" order={5} defaultSize={25} minSize={15}>
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
