import { useEffect, useState, lazy, Suspense } from "react";
import { App as AntdApp, ConfigProvider, Layout, Spin, theme } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { Routes, Route, useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import tour from "./components/Tour";
import useAppStore from "./store/store";
import LearnContent from "./components/Content";
import PlaygroundSidebar from "./components/PlaygroundSidebar";
import "./styles/App.css";
import { colors } from './utils/theme';

const LearnNow = lazy(() => import("./pages/LearnNow"));
const MainContainer = lazy(() => import("./pages/MainContainer"));

const { Content } = Layout;

const App = () => {
  const navigate = useNavigate();
  const init = useAppStore((state) => state.init);
  const loadFromLink = useAppStore((state) => state.loadFromLink);
  const isDarkMode = useAppStore((state) => state.isDarkMode);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();


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
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: colors.primary,
          fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
      }}
    >
      <AntdApp>
        <Layout style={{ height: "100vh" }}>
          <Navbar />
          <Layout
            className="app-layout"
            style={{
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
                  <Content style={{ marginLeft: "64px" }}>
                    {loading ? (
                      <div className="app-content-loading">
                        <Spinner />
                      </div>
                    ) : (
                      <div className="app-main-content">
                        <Suspense fallback={<div className="app-content-loading"><Spinner /></div>}>
                          <MainContainer />
                        </Suspense>
                      </div>
                    )}
                  </Content>
                </>
              }
            />
            <Route
              path="/learn"
              element={
                <Suspense fallback={<div className="app-content-loading"><Spinner /></div>}>
                  <LearnNow />
                </Suspense>
              }
            >
              <Route path="intro" element={<LearnContent file="intro.md" />} />
              <Route path="module1" element={<LearnContent file="module1.md" />} />
              <Route path="module2" element={<LearnContent file="module2.md" />} />
              <Route path="module3" element={<LearnContent file="module3.md" />} />
            </Route>
          </Routes>
        </Layout>
      </Layout>
    </AntdApp>
  </ConfigProvider>
  );
};

const Spinner = () => (
  <div className="app-spinner-container">
    <Spin
      indicator={<LoadingOutlined style={{ fontSize: 42, color: colors.primary }} spin />}
    />
  </div>
);

export default App;