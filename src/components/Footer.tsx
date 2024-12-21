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
            <Link
              href="https://www.accordproject.org"
              target="_blank"
              aria-label="Visit Accord Project homepage" // Added for screen readers
            >
              <Image
                src="/logo.png"
                alt="Template Playground logo" // Updated alt for meaningful description
                preview={false}
                style={{ paddingRight: "1.5em", height: "36px" }}
              />
            </Link>
            <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
              The open source smart legal contract stack
            </Text>
            <Link
              href="mailto:admin@accordproject.org"
              aria-label="Send an email to admin@accordproject.org" // Added for better navigation
            >
              <Text strong style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                admin@accordproject.org
              </Text>
            </Link>
            <Link
              href="https://discord.com/invite/Zm99SKhhtA"
              target="_blank"
              aria-label="Join Accord Project Discord community" // Added for screen readers
            >
              <Button
                size="large"
                style={{
                  padding: "5px 30px",
                  backgroundColor: "#19c6c7",
                  borderRadius: "5px",
                  color: "#050c40",
                  textAlign: "center",
                  border: "none",
                }}
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
                aria-label={`Section: ${section.title}`} // Added for section identification
              >
                {section.title}
              </Text>
              {section.links.map((link: any) => (
                <Link
                  href={link.href}
                  key={link.title}
                  style={{ color: "white", fontSize: "15px" }}
                  aria-label={`Link to ${link.title}`} // Added for link identification
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
              aria-label="Read Accord Project's trademark policy" // Added for screen readers
            >
              trademark policy
            </Link>{" "}
            &bull;{" "}
            <Link
              strong
              href="https://accordproject.org/brand-assets"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
              aria-label="Access Accord Project's brand assets" // Added for screen readers
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
              aria-label="Visit Accord Project GitHub profile" // Added for clarity
            >
              <GithubOutlined style={{ fontSize: "17px" }} />
            </Link>
            <Link
              href="https://twitter.com/AccordHQ"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
              aria-label="Visit Accord Project Twitter profile" // Added for clarity
            >
              <XOutlined style={{ fontSize: "17px" }} />
            </Link>
            <Link
              href="https://discord.com/invite/Zm99SKhhtA"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
              aria-label="Join Accord Project on Discord" // Added for clarity
            >
              <DiscordFilled style={{ fontSize: "17px" }} />
            </Link>
            <Link
              href="https://www.linkedin.com/company/accordproject/"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
              aria-label="Visit Accord Project LinkedIn profile" // Added for clarity
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
