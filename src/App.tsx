import { useEffect, useState } from "react";
import { App as AntdApp, Layout, Row, Col, Collapse, theme, Grid } from "antd";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AgreementData from "./editors/editorsContainer/AgreementData";
import AgreementHtml from "./AgreementHtml";
import Errors from "../utils/helpers/Errors";
import TemplateMarkdown from "./editors/editorsContainer/TemplateMarkdown";
import TemplateModel from "./editors/editorsContainer/TemplateModel";
import useAppStore from "./store/store";
import SampleDropdown from "./components/SampleDropdown";
import FullScreenModal from "./components/FullScreenModal";
import { useSearchParams } from "react-router-dom";
import UseShare from "./components/UseShare";

const { Content } = Layout;
const { useBreakpoint } = Grid;

const App = () => {
  const init = useAppStore((state) => state.init);
  const loadFromLink = useAppStore((state) => state.loadFromLink);
  const [activePanel, setActivePanel] = useState<string | string[]>();
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

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
      const compressedData = searchParams.get("data");
      if (compressedData) {
        await loadFromLink(compressedData);
      }
      setLoading(false);
    };
    initializeApp();
  }, [init, loadFromLink, searchParams]);

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
                  <div
                    style={{
                      marginBottom: "10px",
                    }}
                  >
                    <FullScreenModal />
                  </div>
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
