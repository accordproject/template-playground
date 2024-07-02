import { useEffect, useState } from "react";
import { App as AntdApp, Layout, Row, Col, Collapse, theme, Grid } from "antd";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import AgreementData from "./AgreementData";
import AgreementHtml from "./AgreementHtml";
import Errors from "./Errors";
import TemplateMarkdown from "./TemplateMarkdown";
import TemplateModel from "./TemplateModel";
import useAppStore from "./store";
import SampleDropdown from "./SampleDropdown";

const { Content } = Layout;
const { useBreakpoint } = Grid;

const App = () => {
  const init = useAppStore((state) => state.init);
  const [activePanel, setActivePanel] = useState<string | string[]>();
  const [loading, setLoading] = useState(true);

  const scrollToExplore = () => {
    const exploreContent = document.getElementById("explore");
    if (exploreContent) {
      exploreContent.scrollIntoView({ behavior: "smooth" });
    }
  };

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const onChange = (key: string | string[]) => {
    setActivePanel(key);
  };

  useEffect(() => {
    const initializeApp = async () => {
      await init();
      setLoading(false);
    };
    initializeApp();
  }, [init]);

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
        <Navbar scrollToExplore={scrollToExplore} />
        <Content>
          <div
            style={{
              padding: 24,
              paddingBottom: 150,
              minHeight: 360,
              background: colorBgContainer,
            }}
          >
            <Row id="explore">
              <Col span={4}>
                <SampleDropdown setLoading={setLoading} />
              </Col>
              <Col span={18}>
                <Errors />
              </Col>
            </Row>
            <div
              style={{
                padding: 24,
                minHeight: 360,
                background: colorBgContainer,
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
                  <AgreementHtml loading={loading} />
                </Col>
              </Row>
            </div>
          </div>
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
