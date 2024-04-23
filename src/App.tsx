import { useEffect, useState } from "react";
import { App as AntdApp, Typography, Col, Collapse, Row } from "antd";
import { Layout, theme } from "antd";
import Navbar from "./Navbar";
const { Header, Content } = Layout;
import {
  Container,
  Divider,
  Dropdown,
  Grid,
  Image,
  List,
  Menu,
  Segment,
} from "semantic-ui-react";

import AgreementData from "./AgreementData";
import AgreementHtml from "./AgreementHtml";
import "./App.css";
import Errors from "./Errors";
import TemplateMarkdown from "./TemplateMarkdown";
import TemplateModel from "./TemplateModel";
import useAppStore from "./store";
import SampleDropdown from "./SampleDropdown";
import Links from "./Links";

function App() {
  const init = useAppStore((state) => state.init);
  const [activePanel, setActivePanel] = useState<string | string[]>();

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
          <Navbar />
          <Content>
            <div
              style={{
                marginTop: 60,
                padding: 24,
                minHeight: 360,
                background: colorBgContainer,
              }}
            >
              <Row>
                <Col span={4}>
                  <SampleDropdown />
                </Col>
                <Col span={14}>
                  <Errors />
                </Col>
                <Col span={6}>
                  <Links />
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
}

export default App;
