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

const { Content } = Layout;

const App = () => {
  const navigate = useNavigate();
  const init = useAppStore((state) => state.init);
  const loadFromLink = useAppStore((state) => state.loadFromLink);
  // const { isAIChatOpen, setAIChatOpen } = useAppStore((state) => ({  
  //     isAIChatOpen: state.isAIChatOpen,
  //     setAIChatOpen: state.setAIChatOpen
  //   }
  // ));
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
    const initializeApp = async () => {
      try {
        setLoading(true);
        const compressedData = searchParams.get("data");
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



  return (
    <AntdApp>
      <Layout style={{ height: "100vh" }}>
        <Navbar scrollToFooter={scrollToFooter} />
        <Layout className="app-layout">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <PlaygroundSidebar />
                  <Content>
                    {loading ? (
                      <div
                        className="app-content-loading"
                        style={{
                          background: backgroundColor,
                        }}
                      >
                        <Spinner />
                      </div>
                    ) : (
                      <div
                        className="app-main-content"
                        style={{
                          background: backgroundColor,
                        }}
                      >
                        <MainContainer />
                      </div>
                    )}
                  </Content>
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