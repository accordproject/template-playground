import { useEffect, useState } from "react";
import { App as AntdApp, Layout, Tabs} from "antd";
import { Routes, Route, useSearchParams } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import useAppStore from "./store/store";
import tour from "./components/Tour";
import AgreementData from "./editors/editorsContainer/AgreementData";
import LearnNow from "./pages/LearnNow";
import AgreementHtml from "./AgreementHtml";
import Errors from "./utils/helpers/Errors";
import TemplateMarkdown from "./editors/editorsContainer/TemplateMarkdown";
import TemplateModel from "./editors/editorsContainer/TemplateModel";
import SampleDropdown from "./components/SampleDropdown";
import UseShare from "./components/UseShare";
import LearnContent from "./components/Content";
import { CSSProperties } from 'react';
import FloatingFAB from "./components/FabButton";
//import { FolderOpenOutlined, ShareAltOutlined } from '@ant-design/icons';

const { Content } = Layout;


const App = () => {
  const init = useAppStore((state) => state.init);
  const loadFromLink = useAppStore((state) => state.loadFromLink);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  const scrollToFooter = () => {
    const exploreContent = document.getElementById("footer");
    if (exploreContent) {
      exploreContent.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await init();
      const compressedData = searchParams.get("data");
      if (compressedData) {
        await loadFromLink(compressedData);
      }
      setLoading(false);
    };
    initialize();

    const style = document.createElement("style");
    style.innerHTML = `
      .main-content {
        min-height: calc(100vh - 80px);
        display: flex;
        flex-direction: row;
        gap: 24px;
        background-color: ${backgroundColor};
        padding: 0 24px;
      }
      
      .editor-container {
        flex: 1;
        min-width: 45%;
        height: calc(100vh - 80px);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background-color: ${backgroundColor === '#ffffff' ? '#fafafa' : '#1a1a1a'};
        border: 2px solid ${backgroundColor === '#ffffff' ? '#000000' : '#ffffff'};
      }

      .editor-header {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: ${backgroundColor === '#ffffff' ? '#f0f0f0' : '#2d2d2d'};
        border-bottom: 1px solid ${backgroundColor === '#ffffff' ? '#e0e0e0' : '#404040'};
      }

      .editor-title {
        color: ${backgroundColor === '#ffffff' ? '#333333' : '#ffffff'};
        font-size: 14px;
        font-weight: 600;
      }

      .preview-container {
        flex: 1;
        min-width: 45%;
        height: calc(100vh - 80px);
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
        background-color: ${backgroundColor === '#ffffff' ? '#fafafa' : '#1a1a1a'};
        overflow: auto;
        border: 2px solid ${backgroundColor === '#ffffff' ? '#000000' : '#ffffff'};
        scrollbar-width: thin;
        scrollbar-color: ${backgroundColor === '#ffffff' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'} transparent;
      }

      .preview-container::-webkit-scrollbar {
        width: 12px;
      }

      .preview-container::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 8px;
      }

      .preview-container::-webkit-scrollbar-thumb {
        background-color: ${backgroundColor === '#ffffff' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'};
        border: 3px solid transparent;
        background-clip: padding-box;
        border-radius: 8px;
        min-height: 40px;
        transition: all 0.3s ease;
      }

      .preview-container::-webkit-scrollbar-thumb:hover {
        background-color: ${backgroundColor === '#ffffff' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'};
      }

      .preview-container::-webkit-scrollbar-corner {
        background: transparent;
      }

      .ant-tabs {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: ${backgroundColor === '#ffffff' ? '#fafafa' : '#1a1a1a'};
      }

      .ant-tabs-nav {
        margin: 0 !important;
        background: ${backgroundColor === '#ffffff' ? '#f0f0f0' : '#2d2d2d'};
        padding: 8px 8px 0;
        border-bottom: 1px solid ${backgroundColor === '#ffffff' ? '#e0e0e0' : '#404040'};
      }

      .ant-tabs-nav::before {
        border-bottom: none !important;
      }

      .ant-tabs-tab {
        background: transparent !important;
        border: none !important;
        color: ${backgroundColor === '#ffffff' ? '#666666' : '#a0a0a0'} !important;
        transition: all 0.3s ease;
        padding: 8px 16px !important;
        margin: 0 !important;
        border-radius: 6px 6px 0 0 !important;
      }

      .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
        color: ${backgroundColor === '#ffffff' ? '#333333' : '#ffffff'} !important;
      }

      .ant-tabs-tab:hover {
        color: ${backgroundColor === '#ffffff' ? '#333333' : '#ffffff'} !important;
      }

      .ant-tabs-ink-bar {
        background: ${backgroundColor === '#ffffff' ? '#333333' : '#ffffff'} !important;
      }

      .ant-tabs-tab.ant-tabs-tab-active {
        background: ${backgroundColor === '#ffffff' ? '#fafafa' : '#1a1a1a'} !important;
      }

      .ant-tabs-content-holder {
        flex: 1;
        overflow: hidden;
        padding: 12px;
      }

      .ant-tabs-content {
        height: calc(100% - 24px);
        background-color: ${backgroundColor === '#ffffff' ? '#fafafa' : '#1a1a1a'} !important;
      }

      .editorwrapper {
        flex: 1;
        overflow: hidden;
        position: relative;
        background: ${backgroundColor === '#ffffff' ? '#fafafa' : '#1a1a1a'};
        border-radius: 4px;
        padding-bottom: 8px;
      }

      .monaco-editor {
        height: calc(100% - 16px) !important;
        background: ${backgroundColor} !important;
      }

      .monaco-editor .margin,
      .monaco-editor .monaco-editor-background,
      .monaco-editor .margin-view-overlays .line-numbers,
      .monaco-editor .glyph-margin,
      .monaco-editor .monaco-scrollable-element,
      .monaco-editor .view-overlays {
        background: ${backgroundColor} !important;
      }

      .monaco-editor .line-numbers {
        color: ${backgroundColor === '#ffffff' ? '#666666' : '#888888'} !important;
      }

      .monaco-editor .current-line,
      .monaco-editor .view-overlays .current-line {
        border: none !important;
        background: ${backgroundColor === '#ffffff' ? '#f5f5f5' : '#2d2d2d'} !important;
      }

      .monaco-editor .cursor {
        background: ${backgroundColor === '#ffffff' ? '#333333' : '#ffffff'} !important;
        border-color: ${backgroundColor === '#ffffff' ? '#333333' : '#ffffff'} !important;
      }

      .monaco-editor .minimap {
        opacity: 0.6;
        transition: opacity 0.3s ease;
      }

      .monaco-editor .minimap:hover {
        opacity: 1;
      }

      .monaco-editor .scrollbar {
        width: 12px !important;
        background: transparent !important;
      }

      .monaco-editor .scrollbar .slider {
        width: 12px !important;
        background-color: ${backgroundColor === '#ffffff' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'} !important;
        border: 3px solid transparent !important;
        background-clip: padding-box !important;
        border-radius: 8px !important;
        margin: 0 !important;
        transition: all 0.3s ease !important;
      }

      .monaco-editor .scrollbar .slider:hover {
        background-color: ${backgroundColor === '#ffffff' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'} !important;
      }

      .monaco-editor .scrollbar.horizontal {
        display: none !important;
      }

      .editor-container *::-webkit-scrollbar,
      .preview-container::-webkit-scrollbar {
        width: 12px !important;
        height: 12px !important;
        background: transparent;
      }

      .editor-container *::-webkit-scrollbar-track,
      .preview-container::-webkit-scrollbar-track {
        background: transparent;
        margin: 4px;
        border-radius: 8px;
      }

      .editor-container *::-webkit-scrollbar-thumb,
      .preview-container::-webkit-scrollbar-thumb {
        background: ${backgroundColor === '#ffffff' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)'};
        border: 3px solid transparent;
        background-clip: padding-box;
        border-radius: 8px;
        transition: all 0.3s ease;
      }

      .editor-container *::-webkit-scrollbar-thumb:hover,
      .preview-container::-webkit-scrollbar-thumb:hover {
        background: ${backgroundColor === '#ffffff' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)'};
      }

      .editor-container *::-webkit-scrollbar-corner,
      .preview-container::-webkit-scrollbar-corner {
        background: transparent;
      }

      .editor-container *::-webkit-scrollbar:horizontal,
      .preview-container::-webkit-scrollbar:horizontal {
        display: none !important;
      }

      .light-mode-button button, .light-mode-share button {
        background: #ffffff !important;
        border-color: #d9d9d9 !important;
        color: #333333 !important;
        height: 36px !important;
        border-radius: 8px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 4px 16px !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        transition: all 0.3s ease !important;
      }

      .dark-mode-button button, .dark-mode-share button {
        background: ${backgroundColor} !important;
        border-color: #ffffff !important;
        color: #ffffff !important;
        height: 36px !important;
        border-radius: 8px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 4px 16px !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1) !important;
        transition: all 0.3s ease !important;
      }

      .light-mode-button button:hover, .light-mode-share button:hover {
        background: #f5f5f5 !important;
        transform: translateY(-1px) !important;
      }

      .dark-mode-button button:hover, .dark-mode-share button:hover {
        background: #404040 !important;
        transform: translateY(-1px) !important;
      }

      .light-mode-button .anticon, .light-mode-share .anticon {
        color: #333333 !important;
      }

      .dark-mode-button .anticon, .dark-mode-share .anticon {
        color: #ffffff !important;
      }

      .button-container {
        display: flex;
        gap: 16px;
        align-items: center;
        padding: 16px 24px;
      }

      @media (max-width: 768px) {
        .button-container {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .light-mode-button button, .dark-mode-button button,
        .light-mode-share button, .dark-mode-share button {
          width: 100%;
          justify-content: center;
        }

        .main-content {
          flex-direction: column;
          height: auto;
          padding: 16px;
        }
        
        .editor-container, .preview-container {
          min-width: 100%;
          height: calc(50vh - 100px);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [init, loadFromLink, searchParams, textColor, backgroundColor]);

  useEffect(() => {
    const showTour = searchParams.get("showTour") === "true";
    if (showTour || !localStorage.getItem("hasVisited")) {
      tour.start();
      localStorage.setItem("hasVisited", "true");
    }
  }, [searchParams]);

  const items = [
    {
      key: "templateMark",
      label: "TemplateMark",
      children: <TemplateMarkdown />,
    },
    {
      key: "model",
      label: "Concerto Model",
      children: <TemplateModel />,
    },
    {
      key: "data",
      label: "Preview Data",
      children: <AgreementData />,
    },
  ];

  const editorStyle: CSSProperties = {
    height: 'calc(100vh - 80px)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    backgroundColor: backgroundColor === '#ffffff' ? '#fafafa' : '#1a1a1a',
    border: '2px solid',
    borderColor: backgroundColor === '#ffffff' ? '#000000' : '#ffffff',
  };

  const previewStyle: CSSProperties = {
    height: 'calc(100vh - 80px)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: backgroundColor === '#ffffff' ? '#fafafa' : '#1a1a1a',
    border: '2px solid',
    borderColor: backgroundColor === '#ffffff' ? '#000000' : '#ffffff',
  };

  return (
    <AntdApp>
      <Layout 
        style={{ 
          minHeight: "100vh", 
          background: backgroundColor,
          transition: "background-color 0.3s"
        }}
      >
        <Navbar scrollToFooter={scrollToFooter} />
        <Content 
          style={{ 
            background: backgroundColor,
            padding: 0,
            transition: "background-color 0.3s"
          }}
        >
          <Routes>
            <Route
              path="/"
              element={
                <div style={{ padding: "24px", background: backgroundColor }}>
                  <div className="button-container">
                    <div className={backgroundColor === '#ffffff' ? 'light-mode-button' : 'dark-mode-button'}>
                      <SampleDropdown setLoading={setLoading} />
                    </div>
                    <div className={backgroundColor === '#ffffff' ? 'light-mode-share' : 'dark-mode-share'}>
                      <UseShare />
                    </div>
                    <Errors />
                  </div>
                  
                  <div className="main-content">
                    <div className="editor-container" style={editorStyle}>
                      <div className="editorwrapper">
                        <Tabs
                          items={items}
                          type="card"
                        />
                      </div>
                    </div>
                    
                    <div className="preview-container" style={previewStyle}>
                      <AgreementHtml loading={loading} isModal={false} />
                    </div>
                  </div>
                  <FloatingFAB />
                </div>
              }
            />

            <Route path="/learn" element={<LearnNow />}>
              <Route path="intro" element={<LearnContent file="intro.md" />} />
              <Route path="module1" element={<LearnContent file="module1.md" />} />
              <Route path="module2" element={<LearnContent file="module2.md" />} />
              <Route path="module3" element={<LearnContent file="module3.md" />} />
            </Route>
          </Routes>
        </Content>
        <Footer />
       
      </Layout>
    </AntdApp>
  );
};

export default App;






