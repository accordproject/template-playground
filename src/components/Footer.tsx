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
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

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
              <Text
                strong
                style={{
                  color: hoveredLink === "email" ? "#19c6c7" : "rgba(255, 255, 255, 0.65)",
                  ...(hoveredLink === "email" ? { transition: "color 0.3s ease" } : {}),
                }}
                onMouseEnter={() => setHoveredLink("email")}
                onMouseLeave={() => setHoveredLink(null)}
              >
                admin@accordproject.org
              </Text>
            </Link>
            <Link href="https://discord.com/invite/Zm99SKhhtA" target="_blank">
              <Button
                size="large"
                style={{
                  padding: "5px 30px",
                  backgroundColor: hoveredLink === "join" ? "#17b0b1" : "#19c6c7",
                  borderRadius: "5px",
                  color: hoveredLink === "join" ? "#ffffff" : "#050c40",
                  textAlign: "center",
                  border: "none",
                  ...(hoveredLink === "join" ? { transition: "background-color 0.3s ease, color 0.3s ease" } : {}),
                }}
                onMouseEnter={() => setHoveredLink("join")}
                onMouseLeave={() => setHoveredLink(null)}
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
              style={{
                color: hoveredLink === "expand" ? "#19c6c7" : "white",
                fontSize: "16px",
                marginBottom: "10px",
                ...(hoveredLink === "expand" ? { transition: "color 0.3s ease" } : {}),
              }}
              onMouseEnter={() => setHoveredLink("expand")}
              onMouseLeave={() => setHoveredLink(null)}
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
                        style={{
                          color: hoveredLink === link.title ? "#19c6c7" : "white",
                          fontSize: "15px",
                          ...(hoveredLink === link.title ? { transition: "color 0.3s ease" } : {}),
                        }}
                        onMouseEnter={() => setHoveredLink(link.title)}
                        onMouseLeave={() => setHoveredLink(null)}
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
            copyright © {year} accord project •{" "}
            <Link
              strong
              href="https://accordproject.org/privacy"
              target="_blank"
              style={{
                color: hoveredLink === "trademark" ? "#19c6c7" : "rgba(255, 255, 255, 0.85)",
                ...(hoveredLink === "trademark" ? { transition: "color 0.3s ease" } : {}),
              }}
              onMouseEnter={() => setHoveredLink("trademark")}
              onMouseLeave={() => setHoveredLink(null)}
            >
              trademark policy
            </Link>{" "}
            •{" "}
            <Link
              strong
              href="https://accordproject.org/brand-assets"
              target="_blank"
              style={{
                color: hoveredLink === "brand-assets" ? "#19c6c7" : "rgba(255, 255, 255, 0.85)",
                ...(hoveredLink === "brand-assets" ? { transition: "color 0.3s ease" } : {}),
              }}
              onMouseEnter={() => setHoveredLink("brand-assets")}
              onMouseLeave={() => setHoveredLink(null)}
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
              style={{
                color: hoveredLink === "github" ? "#19c6c7" : "rgba(255, 255, 255, 0.85)",
                ...(hoveredLink === "github" ? { transition: "color 0.3s ease" } : {}),
              }}
              onMouseEnter={() => setHoveredLink("github")}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <GithubOutlined style={{ fontSize: "17px" }} />
            </Link>
            <Link
              href="https://twitter.com/AccordHQ"
              target="_blank"
              style={{
                color: hoveredLink === "twitter" ? "#19c6c7" : "rgba(255, 255, 255, 0.85)",
                ...(hoveredLink === "twitter" ? { transition: "color 0.3s ease" } : {}),
              }}
              onMouseEnter={() => setHoveredLink("twitter")}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <XOutlined style={{ fontSize: "17px" }} />
            </Link>
            <Link
              href="https://discord.com/invite/Zm99SKhhtA"
              target="_blank"
              style={{
                color: hoveredLink === "discord" ? "#19c6c7" : "rgba(255, 255, 255, 0.85)",
                ...(hoveredLink === "discord" ? { transition: "color 0.3s ease" } : {}),
              }}
              onMouseEnter={() => setHoveredLink("discord")}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <DiscordFilled style={{ fontSize: "17px" }} />
            </Link>
            <Link
              href="https://www.linkedin.com/company/accordproject/"
              target="_blank"
              style={{
                color: hoveredLink === "linkedin" ? "#19c6c7" : "rgba(255, 255, 255, 0.85)",
                ...(hoveredLink === "linkedin" ? { transition: "color 0.3s ease" } : {}),
              }}
              onMouseEnter={() => setHoveredLink("linkedin")}
              onMouseLeave={() => setHoveredLink(null)}
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