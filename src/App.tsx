import { useEffect, useState } from "react";
import { App as AntdApp, Layout, Row, Col, Collapse, theme } from "antd";
import Navbar from "./Navbar";
import AgreementData from "./AgreementData";
import AgreementHtml from "./AgreementHtml";
import Errors from "./Errors";
import TemplateMarkdown from "./TemplateMarkdown";
import TemplateModel from "./TemplateModel";
import useAppStore from "./store";
import SampleDropdown from "./SampleDropdown";

const { Content } = Layout;

const App = () => {
  const init = useAppStore((state) => state.init);
  const [activePanel, setActivePanel] = useState<string | string[]>();

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
    void init();
  }, [init]);

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
      <Layout>
        <Layout>
          <Navbar scrollToExplore={scrollToExplore} />
          <Content>
            <div
              style={{
                padding: 24,
                minHeight: 360,
                background: colorBgContainer,
              }}
            >
              <Row id="explore">
                <Col span={4}>
                  <SampleDropdown />
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
                  <Col span={16}>
                    <Collapse
                      defaultActiveKey={activePanel}
                      onChange={onChange}
                      items={panels}
                    />
                  </Col>
                  <Col span={8}>
                    <AgreementHtml />
                  </Col>
                </Row>
              </div>
            </div>
          </Content>
        </Layout>
      </Layout>
    </AntdApp>
  );
};

export default App;
