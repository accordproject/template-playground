import React from "react";
import { Layout, Row, Col, Typography, Space, Button, Image } from "antd";
import {
  GithubOutlined,
  TwitterOutlined,
  MailOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";

const { Footer } = Layout;
const { Text, Link } = Typography;

const CustomFooter: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <Footer
      style={{ background: "#001529", color: "white", padding: "20px 50px" }}
    >
      <Row justify="space-between" align="top">
        <Col span={6}>
          <Space direction="vertical" size="middle">
            <a
              href="https://www.accordproject.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/logo.png"
                alt="Template Playground"
                preview={false}
                style={{ paddingRight: "1.5em", height: "26px" }}
              />
            </a>
            <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
              The open source smart legal contract stack
            </Text>
            <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
              admin@accordproject.org
            </Text>
            <Button type="primary" shape="round">
              Join
            </Button>
          </Space>
        </Col>
        <Col span={4}>
          <Space direction="vertical" size="middle">
            <Text strong style={{ color: "white" }}>
              ABOUT
            </Text>
            <Link href="/about" style={{ color: "rgba(255, 255, 255, 0.65)" }}>
              About the AP
            </Link>
            <Link href="/faq" style={{ color: "rgba(255, 255, 255, 0.65)" }}>
              FAQ
            </Link>
          </Space>
        </Col>
        <Col span={4}>
          <Space direction="vertical" size="middle">
            <Text strong style={{ color: "white" }}>
              COMMUNITY
            </Text>
            <Link
              href="/contribute"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              Contribute
            </Link>
            <Link
              href="/tech-wg"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              Tech WG
            </Link>
            <Link
              href="https://discord.com/invite/Zm99SKhhtA"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              Join Discord
            </Link>
          </Space>
        </Col>
        <Col span={4}>
          <Space direction="vertical" size="middle">
            <Text strong style={{ color: "white" }}>
              PROJECTS
            </Text>
            <Link href="/cicero" style={{ color: "rgba(255, 255, 255, 0.65)" }}>
              Cicero
            </Link>
            <Link href="/ergo" style={{ color: "rgba(255, 255, 255, 0.65)" }}>
              Ergo
            </Link>
            <Link
              href="/concerto"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              Concerto
            </Link>
            <Link
              href="/template-studio"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              Template Studio
            </Link>
          </Space>
        </Col>
        <Col span={4}>
          <Space direction="vertical" size="middle">
            <Text strong style={{ color: "white" }}>
              RESOURCES
            </Text>
            <Link
              href="/template-studio"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              Template Studio
            </Link>
            <Link
              href="/template-library"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              Template Library
            </Link>
            <Link
              href="/model-repository"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              Model Repository
            </Link>
            <Link
              href="/vscode-extension"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              VS Code Extension
            </Link>
            <Link href="/videos" style={{ color: "rgba(255, 255, 255, 0.65)" }}>
              Videos
            </Link>
            <Link
              href="https://github.com/accordproject"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              GitHub
            </Link>
            <Link
              href="/documentation"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              Documentation
            </Link>
          </Space>
        </Col>
      </Row>
      <Row justify="space-between" align="middle" style={{ marginTop: "20px" }}>
        <Col>
          <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
            copyright © 2017-{year} accord project &bull; trademark policy
            &bull; brand assets
            {/* <Link
              href="https://lfprojects.org"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            ></Link> */}
          </Text>
        </Col>
        <Col>
          <Space>
            <Link
              href="https://github.com/accordproject"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              <GithubOutlined style={{ fontSize: "20px" }} />
            </Link>
            <Link
              href="https://twitter.com/accordproject"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              <TwitterOutlined style={{ fontSize: "20px" }} />
            </Link>
            <Link
              href="https://discord.com/invite/Zm99SKhhtA"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              <MailOutlined style={{ fontSize: "20px" }} />
            </Link>
            <Link
              href="https://www.linkedin.com/company/accord-project"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              <LinkedinOutlined style={{ fontSize: "20px" }} />
            </Link>
          </Space>
        </Col>
      </Row>
    </Footer>
  );
};

export default CustomFooter;
