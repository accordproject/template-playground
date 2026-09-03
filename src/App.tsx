import { useEffect, useState, lazy, Suspense } from "react";
import { App as AntdApp, Layout, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { Routes, Route, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import tour from "./components/Tour";
import useAppStore from "./store/store";
import LearnContent from "./components/Content";
import PlaygroundSidebar from "./components/PlaygroundSidebar";
import "./styles/App.css";
import { colors } from './utils/theme';

const LearnNow = lazy(() => import("./pages/LearnNow"));
const MainContainer = lazy(() => import("./pages/MainContainer"));
const DesignV2Layout = lazy(() => import("./components/designV2/DesignV2Layout"));

const { Content } = Layout;

const App = () => {
  const navigate = useNavigate();
  const init = useAppStore((state) => state.init);
  const loadFromLink = useAppStore((state) => state.loadFromLink);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);
  const isDesignV2Enabled = useAppStore((state) => state.isDesignV2Enabled);
  const location = useLocation();
  // The new design ships its own header, so the legacy navbar is hidden on the playground route.
  const hideNavbar = isDesignV2Enabled && location.pathname === "/";
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

    // The new design has its own onboarding flow; the legacy tour targets elements that don't exist there.
    if (isDesignV2Enabled) return;

    const showTour = searchParams.get("showTour") === "true";
    if (showTour || !localStorage.getItem("hasVisited")) {
      void startTour();
    }
  }, [searchParams, isDesignV2Enabled]);

  // Set data-theme attribute on initial load and when theme changes
  useEffect(() => {
    const theme = backgroundColor === "#121212" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, [backgroundColor]);

  return (
    <AntdApp>
      <Layout style={{ height: "100vh" }}>
        {!hideNavbar && <Navbar />}
        <Layout
          className="app-layout"
          style={{
            backgroundColor,
            height: hideNavbar ? "100vh" : "calc(100vh - 64px)",
            marginTop: hideNavbar ? 0 : "64px",
            overflow: "hidden",
          }}
        >
          <Routes>
            <Route
              path="/"
              element={
                isDesignV2Enabled ? (
                  loading ? (
                    <div className="app-content-loading">
                      <Spinner />
                    </div>
                  ) : (
                    <Suspense fallback={<div className="app-content-loading"><Spinner /></div>}>
                      <DesignV2Layout />
                    </Suspense>
                  )
                ) : (
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
                )
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