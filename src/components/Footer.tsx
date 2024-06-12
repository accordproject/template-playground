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

const footerSections = [
  {
    title: "ABOUT",
    links: [
      { title: "About the AP", href: "https://accordproject.org/about/" },
      {
        title: "FAQ",
        href: "https://accordproject.org/frequently-asked-questions/",
      },
    ],
  },
  {
    title: "COMMUNITY",
    links: [
      { title: "Contribute", href: "https://accordproject.org/contribute/" },
      {
        title: "Tech WG",
        href: "https://accordproject.org/working-groups/technology/",
      },
      {
        title: "Join Discord",
        href: "https://discord.com/invite/Zm99SKhhtA",
        external: true,
      },
    ],
  },
  {
    title: "PROJECTS",
    links: [
      {
        title: "Concerto",
        href: "https://accordproject.org/projects/concerto/",
      },
      { title: "Cicero", href: "https://accordproject.org/projects/cicero/" },
      {
        title: "VS Code Extension",
        href: "https://marketplace.visualstudio.com/items?itemName=accordproject.cicero-vscode-extension",
      },
    ],
  },
  {
    title: "RESOURCES",
    links: [
      {
        title: "Template Library",
        href: "https://templates.accordproject.org/",
      },
      { title: "Model Repository", href: "https://models.accordproject.org/" },
      { title: "Videos", href: "https://vimeo.com/accordproject" },
      {
        title: "GitHub",
        href: "https://github.com/accordproject",
        external: true,
      },
      { title: "Documentation", href: "https://docs.accordproject.org/" },
    ],
  },
];

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
                style={{ paddingRight: "1.5em", height: "36px" }}
              />
            </a>
            <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
              The open source smart legal contract stack
            </Text>
            <Link href="mailto:admin@accordproject.org">
              <Text strong style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                admin@accordproject.org
              </Text>
            </Link>
            <Link href="https://discord.com/invite/Zm99SKhhtA" target="_blank">
              <Button
                type="primary"
                shape="round"
                size="large"
                style={{ padding: "2px 24px" }}
              >
                Join
              </Button>
            </Link>
          </Space>
        </Col>
        {footerSections.map((section) => (
          <Col span={3} key={section.title}>
            <Space direction="vertical" size="middle">
              <Text
                strong
                style={{
                  color: "rgba(255, 255, 255, 0.65)",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                }}
              >
                {section.title}
              </Text>
              {section.links.map((link) => (
                <Link
                  href={link.href}
                  key={link.title}
                  style={{ color: "white", fontSize: "15px" }}
                >
                  {link.title}
                </Link>
              ))}
            </Space>
          </Col>
        ))}
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
