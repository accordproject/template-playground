import { useEffect, useState } from "react";
import { App as AntdApp, Layout, Row, Col, Collapse, Grid } from "antd";
import { Routes, Route, useSearchParams } from "react-router-dom";
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

const { Content } = Layout;
const { useBreakpoint } = Grid;

const App = () => {
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
      await init();
      const compressedData = searchParams.get("data");
      if (compressedData) {
        await loadFromLink(compressedData);
      }
      setLoading(false);
    };
    initializeApp();

    // DarkMode Styles
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
  }, [init, loadFromLink, searchParams, textColor, backgroundColor]);

  useEffect(() => {
    const showTour = searchParams.get("showTour") === "true";

    if (showTour || !localStorage.getItem("hasVisited")) {
      tour.start();
      localStorage.setItem("hasVisited", "true");
    }
  }, [searchParams]);

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
                        <div
                          style={{
                            marginBottom: "10px",
                          }}
                        >
                        </div>
                        <AgreementHtml loading={loading} isModal={false} />
                      </Col>
                    </Row>
                  </div>
                </div>
              }
            />

            <Route path="/learn" element={<LearnNow />}>
              {/* ❕ learning-module routes */}
              <Route path="intro" element={<LearnContent file="intro.md" />} />
              <Route
                path="module1"
                element={<LearnContent file="module1.md" />}
              />
              <Route
                path="module2"
                element={<LearnContent file="module2.md" />}
              />

              <Route
                path="module3"
                element={<LearnContent file="module3.md" />}
              />
            </Route>
          </Routes>
        </Content>
        <Footer />
        {!screens.md && (
          <div
            style={{
              textAlign: "center",
              padding: "10px 0",
              background: "#1b2540",
              color: "white",
              fontSize: "12px",
            }}
          >
            Best viewed on desktop
          </div>
        )}
      </Layout>
    </AntdApp>
  );
};

export default App;
