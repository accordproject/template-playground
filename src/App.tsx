import { useEffect, useState } from "react";
import { App as AntdApp, Layout, Row, Col, Collapse, Spin, Grid } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { Routes, Route, useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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
import FloatingFAB from "./components/FabButton";

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

  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();

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
      <Layout style={{ minHeight: "100vh" }}>
        <Navbar scrollToFooter={scrollToFooter} />
        <Content>
          {loading ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
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
                    style={{
                      padding: 24,
                      paddingBottom: 150,
                      minHeight: 360,
                      background: backgroundColor,
                    }}
                  >
                    <Row>
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
                      <Row gutter={24}>
                        <Col xs={24} sm={16} style={{ paddingBottom: "20px" }}>
                          <Collapse
                            defaultActiveKey={activePanel}
                            onChange={onChange}
                            items={panels}
                          />
                        </Col>
                        <Col xs={24} sm={8}>
                          <AgreementHtml loading={loading} isModal={false} />
                        </Col>
                      </Row>
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
          )}
        </Content>
        <Footer />
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