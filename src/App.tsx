import { useEffect, useState } from 'react';
import { App as AntdApp, Typography, Col, Collapse, Row } from 'antd';
import { Layout, theme } from 'antd';
const { Header, Content } = Layout;

import AgreementData from './components/AgreementData';
import AgreementHtml from './components/AgreementHtml';
import './styles/App.css';
import Errors from './components/Errors';
import TemplateMarkdown from './components/TemplateMarkdown';
import TemplateModel from './components/TemplateModel';
import useAppStore from './store/store';
import SampleDropdown from './components/SampleDropdown';
import Links from './components/Links';

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
  }, [init])

  const panels = [
    {
      key: "templateMark",
      label: 'TemplateMark',
      children: <TemplateMarkdown />
    },
    {
      key: "model",
      label: 'Concerto Model',
      children: <TemplateModel />
    },
    {
      key: "data",
      label: 'Preview Data',
      children: <AgreementData />
    }
  ]

  return (
    <AntdApp>
      <Layout>
        <Layout>
          <Header style={{ textAlign: 'center', padding: 0, background: colorBgContainer }}>
            <Typography.Title level={2}>Template Playground (beta)</Typography.Title>
          </Header>
          <Content>
            <div style={{ padding: 24, minHeight: 360, background: colorBgContainer }}>
              <Row>
                <Col span={4}>
                  <SampleDropdown/>
                </Col>
                <Col span={14}>
                  <Errors />
                </Col>
                <Col span={6}>
                <Links/>
                </Col>
              </Row>
              <div style={{ padding: 24, minHeight: 360, background: colorBgContainer }}>
              <Row gutter={24}>
                <Col span={16}>
                  <Collapse defaultActiveKey={activePanel} onChange={onChange} items={panels} />
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
      {/* <Footer style={{ textAlign: 'center' }}>
        Accord Project
      </Footer> */}
    </AntdApp>
  );
}

export default App;
