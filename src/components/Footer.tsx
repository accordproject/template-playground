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
      style={{
        background: "#1b2540",
        color: "white",
        padding: "80px 50px 20px 50px",
      }}
    >
      <Row justify="space-between" align="top">
        <Col span={7}>
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
        <Col span={3}>
          <Space direction="vertical" size="middle">
            <Text
              strong
              style={{
                color: "rgba(255, 255, 255, 0.65)",
                fontSize: "11px",
                letterSpacing: "0.1em",
              }}
            >
              ABOUT
            </Text>
            <Link href="/about" style={{ color: "white", fontSize: "15px" }}>
              About the AP
            </Link>
            <Link href="/faq" style={{ color: "white", fontSize: "15px" }}>
              FAQ
            </Link>
          </Space>
        </Col>
        <Col span={3}>
          <Space direction="vertical" size="middle">
            <Text
              strong
              style={{
                color: "rgba(255, 255, 255, 0.65)",
                fontSize: "11px",
                letterSpacing: "0.1em",
              }}
            >
              COMMUNITY
            </Text>
            <Link
              href="/contribute"
              style={{ color: "white", fontSize: "15px" }}
            >
              Contribute
            </Link>
            <Link href="/tech-wg" style={{ color: "white", fontSize: "15px" }}>
              Tech WG
            </Link>
            <Link
              href="https://discord.com/invite/Zm99SKhhtA"
              target="_blank"
              style={{ color: "white", fontSize: "15px" }}
            >
              Join Discord
            </Link>
          </Space>
        </Col>
        <Col span={3}>
          <Space direction="vertical" size="middle">
            <Text
              strong
              style={{
                color: "rgba(255, 255, 255, 0.65)",
                fontSize: "11px",
                letterSpacing: "0.1em",
              }}
            >
              PROJECTS
            </Text>
            <Link href="/cicero" style={{ color: "white", fontSize: "15px" }}>
              Cicero
            </Link>
            <Link href="/ergo" style={{ color: "white", fontSize: "15px" }}>
              Ergo
            </Link>
            <Link href="/concerto" style={{ color: "white", fontSize: "15px" }}>
              Concerto
            </Link>
            <Link
              href="/template-studio"
              style={{ color: "white", fontSize: "15px" }}
            >
              Template Studio
            </Link>
          </Space>
        </Col>
        <Col span={3}>
          <Space direction="vertical" size="middle">
            <Text
              strong
              style={{
                color: "rgba(255, 255, 255, 0.65)",
                fontSize: "11px",
                letterSpacing: "0.1em",
              }}
            >
              RESOURCES
            </Text>
            <Link
              href="/template-studio"
              style={{ color: "white", fontSize: "15px" }}
            >
              Template Studio
            </Link>
            <Link
              href="/template-library"
              style={{ color: "white", fontSize: "15px" }}
            >
              Template Library
            </Link>
            <Link
              href="/model-repository"
              style={{ color: "white", fontSize: "15px" }}
            >
              Model Repository
            </Link>
            <Link
              href="/vscode-extension"
              style={{ color: "white", fontSize: "15px" }}
            >
              VS Code Extension
            </Link>
            <Link href="/videos" style={{ color: "white", fontSize: "15px" }}>
              Videos
            </Link>
            <Link
              href="https://github.com/accordproject"
              style={{ color: "white", fontSize: "15px" }}
            >
              GitHub
            </Link>
            <Link
              href="/documentation"
              style={{ color: "white", fontSize: "15px" }}
            >
              Documentation
            </Link>
          </Space>
        </Col>
      </Row>
      <Row justify="space-between" align="middle" style={{ marginTop: "80px" }}>
        <Col>
          <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
            copyright © {year} accord project &bull; trademark policy &bull;
            brand assets
          </Text>
        </Col>
        <Col>
          <Space>
            <Link
              href="https://github.com/accordproject"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              <GithubOutlined style={{ fontSize: "17px" }} />
            </Link>
            <Link
              href="https://twitter.com/accordproject"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              <TwitterOutlined style={{ fontSize: "17px" }} />
            </Link>
            <Link
              href="https://discord.com/invite/Zm99SKhhtA"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              <MailOutlined style={{ fontSize: "17px" }} />
            </Link>
            <Link
              href="https://www.linkedin.com/company/accord-project"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              <LinkedinOutlined style={{ fontSize: "17px" }} />
            </Link>
          </Space>
        </Col>
      </Row>
    </Footer>
  );
};

export default CustomFooter;
