import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import AgreementData from "../editors/editorsContainer/AgreementData";
import TemplateModel from "../editors/editorsContainer/TemplateModel";
import TemplateMarkdown from "../editors/editorsContainer/TemplateMarkdown";
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

  const [, setLoading] = useState(true);
  
  // tabbed editor state (default: TemplateMark active)
  const [activeEditorTab, setActiveEditorTab] = useState<'model'|'template'|'data'>('template');
  
  // Create distinct preview background for better visual separation
  const previewBackgroundColor = backgroundColor === '#ffffff' 
    ? '#f0f9ff'  // Cool light blue for preview - modern and distinct
    : '#1a1f2e';  // Distinct darker blue-tinted background for preview in dark mode
  
  const previewHeaderColor = backgroundColor === '#ffffff'
    ? '#dbeafe'  // Slightly darker blue for header in light mode
    : '#0f172a';  // Even darker shade for header in dark mode

  return (
    <div className="main-container" style={{ backgroundColor }}>
      <PanelGroup direction="horizontal" className="main-container-panel-group"
        style={{ position: "fixed", width: "calc(100% - 64px)", height: "calc(100% - 64px)" }}>
        {isEditorsVisible && (
          <>
            <Panel defaultSize={65} minSize={30}>
              <div className="main-container-editors-panel" style={{ backgroundColor }}>
                {/* Tab bar for editor group */}
                <div
                  className={`main-container-editor-tabs ${
                    backgroundColor === '#ffffff'
                    ? 'main-container-editor-tabs-light'
                    : 'main-container-editor-tabs-dark'
                  }`}
                >
                  <button
                    className={`main-container-editor-tab ${
                      backgroundColor === '#ffffff'
                        ? 'main-container-editor-tab-light'
                        : 'main-container-editor-tab-dark'
                    } ${
                      activeEditorTab === "model"
                        ? backgroundColor === '#ffffff'
                          ? 'main-container-editor-tab-active-light'
                          : 'main-container-editor-tab-active-dark'
                        : ''
                    }`}
                    onClick={() => setActiveEditorTab("model")}
                    title="Concerto Model"
                  >
                    Concerto Model
                  </button>

                  <button
                    className={`main-container-editor-tab ${
                      backgroundColor === '#ffffff'
                        ? 'main-container-editor-tab-light'
                        : 'main-container-editor-tab-dark'
                    } ${
                      activeEditorTab === "template"
                        ? backgroundColor === '#ffffff'
                          ? 'main-container-editor-tab-active-light'
                          : 'main-container-editor-tab-active-dark'
                        : ''
                    }`}                  
                    onClick={() => setActiveEditorTab("template")}
                    title="TemplateMark"
                  >
                    TemplateMark
                  </button>

                  <button
                    className={`main-container-editor-tab ${
                      backgroundColor === '#ffffff'
                        ? 'main-container-editor-tab-light'
                        : 'main-container-editor-tab-dark'
                    } ${
                      activeEditorTab === "data"
                        ? backgroundColor === '#ffffff'
                          ? 'main-container-editor-tab-active-light'
                          : 'main-container-editor-tab-active-dark'
                        : ''
                    }`}
                    onClick={() => setActiveEditorTab("data")}
                    title="JSON Data"
                  >
                    JSON Data
                  </button>

                  <div className="flex-shrink-0 ml-auto">
                    <SampleDropdown setLoading={setLoading} />
                  </div>
                </div>
                <div className="main-container-editors-panel-group">
                  {activeEditorTab === "model" && (
                  <div className="main-container-editor-section tour-concerto-model">
                    <div className={`main-container-editor-header ${backgroundColor==='#ffffff' ? 'main-container-editor-header-light'
                      : 'main-container-editor-header-dark' }`}>
                      <div className="main-container-editor-header-left">
                        <button className="collapse-button" onClick={toggleModelCollapse} style={{ color: textColor,
                          background: 'transparent' , border: 'none' , cursor: 'pointer' , display: 'flex' , alignItems: 'center' ,
                          padding: '4px' , marginRight: '4px' }}>
                          {isModelCollapsed ?
                          <MdChevronRight size={20} /> :
                          <MdExpandMore size={20} />}
                        </button>
                      </div>
                    </div>

                    {!isModelCollapsed && (
                    <div className="main-container-editor-content" style={{ backgroundColor }}>
                      <TemplateModel />
                    </div>
                    )}
                  </div>
                  )}

                  {activeEditorTab === "template" && (
                  <MarkdownEditorProvider>
                    <div className="main-container-editor-section tour-template-mark">
                      <div className={`main-container-editor-header ${backgroundColor==='#ffffff' ? 'main-container-editor-header-light'
                        : 'main-container-editor-header-dark' }`}>
                        <TemplateMarkdownToolbar />
                      </div>

                      <div className="main-container-editor-content" style={{ backgroundColor }}>
                        <TemplateMarkdown />
                      </div>
                    </div>
                  </MarkdownEditorProvider>
                  )}

                  {activeEditorTab === "data" && (
                  <div className="main-container-editor-section tour-json-data">
                    <div className={`main-container-editor-header ${backgroundColor==='#ffffff' ? 'main-container-editor-header-light'
                      : 'main-container-editor-header-dark' }`}>
                      <div className="main-container-editor-header-left">
                        <button className="collapse-button" onClick={toggleDataCollapse} style={{ color: textColor,
                          background: 'transparent' , border: 'none' , cursor: 'pointer' , display: 'flex' , alignItems: 'center' ,
                          padding: '4px' , marginRight: '4px' }}>
                          {isDataCollapsed ?
                          <MdChevronRight size={20} /> :
                          <MdExpandMore size={20} />}
                        </button>
                      </div>

                      <button onClick={handleJsonFormat} className={`px-1 pt-1 rounded ${ backgroundColor==='#ffffff'
                        ? 'bg-white border border-gray-300 hover:bg-gray-200'
                        : 'bg-gray-600 border border-gray-500 hover:bg-gray-500 text-white' }`} disabled={!jsonEditorRef.current ||
                        isDataCollapsed}>
                        <MdFormatAlignLeft size={16} />
                      </button>
                    </div>

                    {!isDataCollapsed && (
                    <div className="main-container-editor-content" style={{ backgroundColor }}>
                      <AgreementData editorRef={jsonEditorRef} />
                    </div>
                    )}
                  </div>
                  )}

                  {isProblemPanelVisible &&
                  <ProblemPanel />}
                </div>                
              </div>
            </Panel>
            <PanelResizeHandle className="main-container-panel-resize-handle-horizontal" />
          </>
        )}
        {isPreviewVisible && (
          <>
            <Panel defaultSize={35} minSize={20}>
              <div className="main-container-preview-panel tour-preview-panel" style={{ backgroundColor: previewBackgroundColor }}>
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
                <div className="main-container-preview-content" style={{ backgroundColor: previewBackgroundColor }}>
                  <div className="main-container-preview-text">
                    <div
                      ref={downloadRef}
                      className="main-container-agreement"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(agreementHtml) }}
                      style={{
                        color: textColor,
                        backgroundColor: previewBackgroundColor,
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
