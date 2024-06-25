import React from "react";
import { Layout, Row, Col, Typography, Space, Button, Image, Grid } from "antd";
import {
  GithubOutlined,
  XOutlined,
  DiscordFilled,
  LinkedinFilled,
} from "@ant-design/icons";
import FOOTER_SECTION from "../constants/content/footer.json";

const { Footer } = Layout;
const { Text, Link } = Typography;
const { useBreakpoint } = Grid;

const CustomFooter: React.FC = () => {
  const year = new Date().getFullYear();
  const screens = useBreakpoint();

  if (!screens.md) {
    return null;
  }

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
            <Link href="https://www.accordproject.org" target="_blank">
              <Image
                src="/logo.png"
                alt="Template Playground"
                preview={false}
                style={{ paddingRight: "1.5em", height: "36px" }}
              />
            </Link>
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
        {FOOTER_SECTION.sections.map((section: any) => (
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
              {section.links.map((link: any) => (
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
            copyright © {year} accord project &bull;{" "}
            <Link
              strong
              href="https://accordproject.org/privacy"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              trademark policy
            </Link>{" "}
            &bull;{" "}
            <Link
              strong
              href="https://accordproject.org/brand-assets"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              brand assets
            </Link>
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
              href="https://twitter.com/AccordHQ"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              <XOutlined style={{ fontSize: "17px" }} />
            </Link>
            <Link
              href="https://discord.com/invite/Zm99SKhhtA"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              <DiscordFilled style={{ fontSize: "17px" }} />
            </Link>
            <Link
              href="https://www.linkedin.com/company/accordproject/"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              <LinkedinFilled style={{ fontSize: "17px" }} />
            </Link>
          </Space>
        </Col>
      </Row>
    </Footer>
  );
};

export default CustomFooter;
