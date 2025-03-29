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
  const [hover, setHover] = useState(false);
  const[hovericon,sethoverIcon]=useState(0)
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
            <Link href="https://www.accordproject.org" target="_blank" 
             onMouseEnter={() => setHover(true)} // Detect hover
             onMouseLeave={() => setHover(false)} // Detect when hover ends
            >
              <Image
                src="/logo.png"
                alt="Template Playground"
                preview={false}
                style={{ height: hover ? "38px":"36px", maxWidth: "100%" }}
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
            <Link href="https://discord.com/invite/Zm99SKhhtA" target="_blank"  >
              <Button
                size="large"
                style={{
                  padding: "5px 30px",
                  backgroundColor:hovericon==2 ?'#D3D3D3': "#19c6c7",
                  borderRadius: "5px",
                  color: "#050c40",
                  textAlign: "center",
                  border: "none",
                }}
                onMouseEnter={()=>sethoverIcon(2)}
                onMouseLeave={()=>sethoverIcon(0)}
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
              {FOOTER_SECTION.sections.map((section: FooterSection,j:number) => (
                <Col xs={24} sm={12} md={6} key={section.title}>
                  <Space direction="vertical" size="middle">
                    <Text
                      strong
                      style={{
                        color: "rgba(255, 255, 255, 0.85)",
                        fontSize: "11px",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {section.title}
                    </Text>
                    {section.links.map((link: FooterLink,i:number) => (
                      <Link
                        href={link.href}
                        key={i}
                        style={{ color: hovericon==(2*i+1)*(3*j+1)+10? "#A9A9A9":"white", fontSize: "15px" }}
                        onMouseEnter={()=>sethoverIcon((2*i+1)*(3*j+1)+10)}
                        onMouseLeave={()=>sethoverIcon(0)}
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
              style={{ color:hovericon==3 ? " rgba(200,222,255,0.75) ": "rgba(255, 255, 255, 0.85)" }} onMouseEnter={()=>sethoverIcon(3)} onMouseLeave={()=>sethoverIcon(0)}
            >
              trademark policy
            </Link>{" "}
            &bull;{" "}
            <Link
              strong
              href="https://accordproject.org/brand-assets"
              target="_blank"
              style={{ color:hovericon==4 ? " rgba(200,222,255,0.75) ": "rgba(255, 255, 255, 0.85)" }} onMouseEnter={()=>sethoverIcon(4)} onMouseLeave={()=>sethoverIcon(0)}
            >
              brand assets
            </Link>
          </Text>
        </Col>

        <Col>
          <Space>
            <Link href="https://github.com/accordproject" target="_blank"    style={{ color:hovericon==5 ? " rgba(200,222,255,0.75) ": "rgba(255, 255, 255, 0.85)" }} onMouseEnter={()=>sethoverIcon(5)} onMouseLeave={()=>sethoverIcon(0)}>
              <GithubOutlined style={{ fontSize: "17px" }} />
            </Link>
            <Link href="https://twitter.com/AccordHQ" target="_blank"    style={{ color:hovericon==6 ? " rgba(200,222,255,0.75) ": "rgba(255, 255, 255, 0.85)" }} onMouseEnter={()=>sethoverIcon(6)} onMouseLeave={()=>sethoverIcon(0)}>
              <XOutlined style={{ fontSize: "17px" }} />
            </Link>
            <Link href="https://discord.com/invite/Zm99SKhhtA" target="_blank"   style={{ color:hovericon==7 ? " rgba(200,222,255,0.75) ": "rgba(255, 255, 255, 0.85)" }} onMouseEnter={()=>sethoverIcon(7)} onMouseLeave={()=>sethoverIcon(0)}>
              <DiscordFilled style={{ fontSize: "17px" }} />
            </Link>
            <Link href="https://www.linkedin.com/company/accordproject/" target="_blank"  style={{ color:hovericon==7 ? " rgba(200,222,255,0.75) ": "rgba(255, 255, 255, 0.85)" }} onMouseEnter={()=>sethoverIcon(7)} onMouseLeave={()=>sethoverIcon(0)}>
              <LinkedinFilled style={{ fontSize: "17px" }} />
            </Link>
          </Space>
        </Col>
      </Row>
    </Footer>
  );
};

export default CustomFooter;
