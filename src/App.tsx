import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { App as AntdApp, Layout, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { Routes, Route, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import tour from "./components/Tour";
import useAppStore, { SHARED_TEMPLATE_NAME } from "./store/store";
import useDesignV2Store from "./store/designV2Store";
import { STEP_ID } from "./types/designV2.types";
import LearnContent from "./components/Content";
import PlaygroundSidebar from "./components/PlaygroundSidebar";
import RebuildSandboxFrame from "./components/RebuildSandboxFrame";
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
  // Design v2 ships its own header, so the legacy navbar is hidden on the playground route.
  const hideNavbar = isDesignV2Enabled && location.pathname === "/";
  const [loading, setLoading] = useState(true);
  const [linkLoad, setLinkLoad] = useState<{ status: 'loaded' | 'failed'; error?: string } | null>(null);
  const handledLink = useRef<typeof linkLoad>(null);
  const [searchParams] = useSearchParams();
  const compressedData = location.hash.startsWith("#data=")
    ? location.hash.substring(6)
    : searchParams.get("data");
  const redirectLink = compressedData !== null && location.pathname !== "/";

  useEffect(() => {
    if (redirectLink) {
      navigate({ pathname: "/", search: location.search, hash: location.hash }, { replace: true });
    }
  }, [redirectLink, navigate, location.search, location.hash]);

  useEffect(() => {
    if (redirectLink) return;
    const controller = new AbortController();
    const initializeApp = async () => {
      try {
        setLoading(true);
        if (compressedData !== null) {
          const loaded = await loadFromLink(compressedData, controller.signal);
          if (controller.signal.aborted) return;
          setLinkLoad(loaded ? { status: 'loaded' } : { status: 'failed', error: useAppStore.getState().error });
        } else {
          await init();
          if (!controller.signal.aborted) setLinkLoad(null);
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void initializeApp();
    return () => controller.abort();
  }, [init, loadFromLink, compressedData, redirectLink]);

  useEffect(() => {
    if (!isDesignV2Enabled || !linkLoad || handledLink.current === linkLoad) return;
    handledLink.current = linkLoad;
    const flow = useDesignV2Store.getState();
    const loaded = linkLoad.status === 'loaded';
    flow.selectTemplate(loaded ? SHARED_TEMPLATE_NAME : null);
    flow.setView(loaded ? STEP_ID.text : "welcome");
  }, [isDesignV2Enabled, linkLoad]);

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

    // Design v2 has its own onboarding flow; the legacy tour targets elements that don't exist there.
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
      {/* Hosts the agreement rendering; mounted for the whole app because init() renders before any route does. */}
      <RebuildSandboxFrame />
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
                      <DesignV2Layout linkStatus={linkLoad?.status} linkError={linkLoad?.error} />
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
