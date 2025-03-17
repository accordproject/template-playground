import React, { useState } from "react";
import { Layout, Row, Col, Typography, Space, Button, Image, Grid } from "antd";
import {
  GithubOutlined,
  XOutlined,
  DiscordFilled,
  LinkedinFilled,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import FOOTER_SECTION from "../constants/content/footer.json";
import { FooterSection, FooterLink } from "../types/components/Footer.types";

const { Footer } = Layout;
const { Text, Link } = Typography;
const { useBreakpoint } = Grid;

const CustomFooter: React.FC = () => {
  const year = new Date().getFullYear();
  const screens = useBreakpoint();
  const [expanded, setExpanded] = useState(false);

  return (
    <Footer
      id="footer"
      style={{
        background: "#1b2540",
        color: "white",
        padding: "50px 50px 20px 50px",
      }}
    >
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Space direction="vertical" size="middle">
            <Link href="https://www.accordproject.org" target="_blank">
              <Image
                src="/logo.png"
                alt="Template Playground"
                preview={false}
                style={{ height: "36px", maxWidth: "100%" }}
              />
            </Link>
            <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
              The open-source smart legal contract stack
            </Text>
            <Link href="mailto:admin@accordproject.org">
              <Text strong style={{ color: "rgba(255, 255, 255, 0.65)" }}>
                admin@accordproject.org
              </Text>
            </Link>
            <Link href="https://discord.com/invite/Zm99SKhhtA" target="_blank">
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

        <Col xs={24} md={12}>
          {!screens.md && (
            <Button
              type="text"
              onClick={() => setExpanded(!expanded)}
              style={{ color: "white", fontSize: "16px", marginBottom: "10px" }}
            >
              {expanded ? <UpOutlined /> : <DownOutlined />} Other Links
            </Button>
          )}

          {(screens.md || expanded) && (
            <Row justify="end" gutter={[16, 16]}>
              {FOOTER_SECTION.sections.map((section: FooterSection) => (
                <Col xs={24} sm={12} md={6} key={section.title}>
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
                    {section.links.map((link: FooterLink) => (
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
          )}
        </Col>
      </Row>

      <Row justify="space-between" align="middle" style={{ marginTop: "40px" }}>
        <Col>
          <Text style={{ color: "rgba(255, 255, 255, 0.85)" }}>
            copyright © {year} accord project &bull;{" "}
            <Link
              strong
              href="https://accordproject.org/privacy"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.85)" }}
            >
              trademark policy
            </Link>{" "}
            &bull;{" "}
            <Link
              strong
              href="https://accordproject.org/brand-assets"
              target="_blank"
              style={{ color: "rgba(255, 255, 255, 0.85)" }}
            >
              brand assets
            </Link>
          </Text>
        </Col>

        <Col>
          <Space>
            <Link href="https://github.com/accordproject" target="_blank" style={{ color: "rgba(255, 255, 255, 0.85)" }}>
              <GithubOutlined style={{ fontSize: "17px" }} />
            </Link>
            <Link href="https://twitter.com/AccordHQ" target="_blank" style={{ color: "rgba(255, 255, 255, 0.85)" }}>
              <XOutlined style={{ fontSize: "17px" }} />
            </Link>
            <Link href="https://discord.com/invite/Zm99SKhhtA" target="_blank" style={{ color: "rgba(255, 255, 255, 0.85)" }}>
              <DiscordFilled style={{ fontSize: "17px" }} />
            </Link>
            <Link href="https://www.linkedin.com/company/accordproject/" target="_blank" style={{ color: "rgba(255, 255, 255, 0.85)" }}>
              <LinkedinFilled style={{ fontSize: "17px" }} />
            </Link>
          </Space>
        </Col>
      </Row>
    </Footer>
  );
};

export default CustomFooter;
