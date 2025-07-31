import { useEffect, useState } from "react";
import { App as AntdApp, Layout, Row, Col, Collapse, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { Routes, Route, useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import tour from "./components/Tour";
import AgreementData from "./editors/editorsContainer/AgreementData";
import LearnNow from "./pages/LearnNow";
import AgreementHtml from "./AgreementHtml";
import Errors from "./utils/helpers/Errors";
import TemplateMarkdown from "./editors/editorsContainer/TemplateMarkdown";
import TemplateModel from "./editors/editorsContainer/TemplateModel";
import useAppStore from "./store/store";
import SampleDropdown from "./components/SampleDropdown";
import UseShare from "./components/UseShare";
import LearnContent from "./components/Content";
import ResizableContainer from "./components/ResizableContainer";
import MainContainer from "./pages/MainContainer";

const { Content } = Layout;

const App = () => {
  const navigate = useNavigate();
  const init = useAppStore((state) => state.init);
  const loadFromLink = useAppStore((state) => state.loadFromLink);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);
  const [activePanel, setActivePanel] = useState<string | string[]>();
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const scrollToFooter = () => {
    const exploreContent = document.getElementById("footer");
    if (exploreContent) {
      exploreContent.scrollIntoView({ behavior: "smooth" });
    }
  };

  const onChange = (key: string | string[]) => {
    setActivePanel(key);
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
    initializeApp();
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
      startTour();
    }
  }, [searchParams]);

  const panels = [
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

  return (
    <AntdApp>
      <Layout style={{ height: "100vh" }}>
        <Navbar scrollToFooter={scrollToFooter} />
        <Content>
          {loading ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                background: backgroundColor,
                alignItems: "center",
                minHeight: "calc(100vh - 64px - 70px)", // Adjust for Navbar and Footer height
              }}
            >
              <Spinner />
            </div>
          ) : (
            <Routes>
              <Route
                path="/"
                element={
                  <div
                  className="h-full"
                    style={{
                      background: backgroundColor,
                    }}
                  >
                    <MainContainer />
                    {/* <Row>
                      <Col xs={24} sm={8}>
                        <Row
                          style={{
                            marginLeft: "25px",
                            display: "flex",
                            flexDirection: "row",
                            gap: "10px",
                          }}
                        >
                          <SampleDropdown setLoading={setLoading} />
                          <UseShare />
                          <button id="ai-assistant" onClick={() => setAIChatOpen(!isAIChatOpen)} className="flex cursor-pointer items-center justify-center px-4 py-1.5 h-8 text-sm bg-white border border-solid border-gray-300 rounded-md transition-all duration-400 ease-in-out hover:border-[#4096ff] hover:text-[#4096ff]">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 45 20"
                              fill="none"
                              className="size-8"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                d="M12 13.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 0.444 3 5c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 14c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                                transform="translate(0, 3)"
                              />
                              <defs>
                                <linearGradient id="ai-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#a78bfa" />
                                  <stop offset="50%" stopColor="#ec4899" />
                                  <stop offset="100%" stopColor="#ef4444" />
                                </linearGradient>
                              </defs>
                              <text
                                x="32"
                                y="6"
                                fontSize="16"
                                fontWeight="bold"
                                fill="url(#ai-gradient)"
                                textAnchor="middle"
                              >
                                AI
                              </text>
                            </svg>
                            <span>Assistant</span>
                          </button>
                        </Row>
                      </Col>
                      <Col span={18}>
                        <Errors />
                      </Col>
                    </Row>
                    <div
                      style={{
                        padding: 24,
                        minHeight: 360,
                        background: backgroundColor,
                      }}
                    >
                      <ResizableContainer
                        leftPane={
                          <Collapse
                            defaultActiveKey={activePanel}
                            onChange={onChange}
                            items={panels}
                            style={{ marginBottom: "24px" }}
                          />
                        }
                        rightPane={
                          <AgreementHtml loading={loading} isModal={false} />
                        }
                        initialLeftWidth={66}
                        minLeftWidth={30}
                        minRightWidth={30}
                      />
                    </div>
                    <FloatingFAB /> */}
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
          )}
        </Content>
      </Layout>
    </AntdApp>
  );
};

const Spinner = () => (
  <div
    style={{
      flex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Spin
      indicator={<LoadingOutlined style={{ fontSize: 42, color: "#19c6c7" }} spin />}
    />
  </div>
);

export default App;