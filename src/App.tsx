import { useEffect, useState } from "react";
import { App as AntdApp, Layout, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { Routes, Route, useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import tour from "./components/Tour";
import LearnNow from "./pages/LearnNow";
import useAppStore from "./store/store";
import LearnContent from "./components/Content";
import MainContainer from "./pages/MainContainer";
import PlaygroundSidebar from "./components/PlaygroundSidebar";
import "./styles/App.css";
import AIConfigPopup from "./components/AIConfigPopup";
import { loadConfigFromLocalStorage } from "./ai-assistant/chatRelay";

const { Content } = Layout;

const App = () => {
  const navigate = useNavigate();
  const init = useAppStore((state) => state.init);
  const loadFromLink = useAppStore((state) => state.loadFromLink);
  const { isAIConfigOpen, setAIConfigOpen, isSidebarExpanded } =
    useAppStore((state) => ({
      isAIConfigOpen: state.isAIConfigOpen,
      setAIConfigOpen: state.setAIConfigOpen,
      isSidebarExpanded: state.isSidebarExpanded,
    }));
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();


  const handleConfigSave = () => {
    loadConfigFromLocalStorage();
    setAIConfigOpen(false);
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        // Prioritize hash for new links, fallback to searchParams for old links
        let compressedData: string | null = null;
        if (window.location.hash.startsWith("#data=")) {
          compressedData = window.location.hash.substring(6);
        } else {
          compressedData = searchParams.get("data");
        }
        if (compressedData) {
          await loadFromLink(compressedData);
          if (window.location.pathname !== "/") {
            navigate("/", { replace: true });
          }
        } else {
          await init();
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };
    void initializeApp();
  }, [init, loadFromLink, searchParams, navigate]);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      .ant-collapse-header {
        color: ${textColor} !important;
      }
      .ant-collapse-content {
        background-color: ${backgroundColor} !important;
      }
      .ant-collapse-content-active {
        background-color: ${backgroundColor} !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [backgroundColor, textColor]);

  useEffect(() => {
    const startTour = async () => {
      try {
        await tour.start();
        localStorage.setItem("hasVisited", "true");
      } catch (error) {
        console.error("Tour failed to start:", error);
      }
    };

    const showTour = searchParams.get("showTour") === "true";
    if (showTour || !localStorage.getItem("hasVisited")) {
      void startTour();
    }
  }, [searchParams]);

  // Set data-theme attribute on initial load and when theme changes
  useEffect(() => {
    const theme = backgroundColor === "#121212" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, [backgroundColor]);

  return (
    <AntdApp>
      <Layout style={{ height: "100vh" }}>
        <Navbar />
        <Layout
          className="app-layout"
          style={{
            backgroundColor,
            height: "calc(100vh - 64px)",
            marginTop: "64px",
            overflow: "hidden",
          }}
        >
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <PlaygroundSidebar />
                  <Content style={{ marginLeft: isSidebarExpanded ? "192px" : "64px", transition: "margin-left 0.3s ease-in-out" }}>
                    {loading ? (
                      <div className="app-content-loading">
                        <Spinner />
                      </div>
                    ) : (
                      <div className="app-main-content">
                        <MainContainer />
                      </div>
                    )}
                  </Content>
                  <AIConfigPopup
                    isOpen={isAIConfigOpen}
                    onClose={() => setAIConfigOpen(false)}
                    onSave={handleConfigSave}
                  />
                </>
              }
            />
            <Route path="/learn" element={<LearnNow />}>
              <Route path="intro" element={<LearnContent file="intro.md" />} />
              <Route path="module1" element={<LearnContent file="module1.md" />} />
              <Route path="module2" element={<LearnContent file="module2.md" />} />
              <Route path="module3" element={<LearnContent file="module3.md" />} />
            </Route>
          </Routes>
        </Layout>
      </Layout>
    </AntdApp>
  );
};

const Spinner = () => (
  <div className="app-spinner-container">
    <Spin
      indicator={<LoadingOutlined style={{ fontSize: 42, color: "#19c6c7" }} spin />}
    />
  </div>
);

export default App;