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
      className="bg-[#1b2540] text-white px-[50px] pt-[50px] pb-[20px]"
    >
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Space direction="vertical" size="middle">
            <Link href="https://www.accordproject.org" target="_blank">
              <Image
                src="/logo.png"
                alt="Template Playground"
                preview={false}
                className="h-9 max-w-full"
              />
            </Link>
            <Text className="text-white/65">
              The open-source smart legal contract stack
            </Text>
            <Link href="mailto:admin@accordproject.org">
              <Text strong className="text-white/65">
                admin@accordproject.org
              </Text>
            </Link>
            <Link href="https://discord.com/invite/Zm99SKhhtA" target="_blank">
              <Button
                size="large"
                className="px-[30px] py-[5px] bg-[#19c6c7] rounded-[5px] text-[#050c40] text-center border-none"
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
              className="text-white text-base mb-[10px]"
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
                      className="text-white/65 text-[11px] tracking-widest"
                    >
                      {section.title}
                    </Text>
                    {section.links.map((link: FooterLink) => (
                      <Link
                        href={link.href}
                        key={link.title}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white text-[15px]"
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

      <Row justify="space-between" align="middle" className="mt-[40px]">
        <Col>
          <Text className="text-white/85">
            copyright © {year} accord project &bull;{" "}
            <Link
              strong
              href="https://accordproject.org/privacy"
              target="_blank"
              className="text-white/85"
            >
              trademark policy
            </Link>{" "}
            &bull;{" "}
            <Link
              strong
              href="https://accordproject.org/brand-assets"
              target="_blank"
              className="text-white/85"
            >
              brand assets
            </Link>
          </Text>
        </Col>

        <Col>
          <Space>
            <Link href="https://github.com/accordproject" target="_blank" className="text-white/85">
              <GithubOutlined className="text-[17px]" />
            </Link>
            <Link href="https://twitter.com/AccordHQ" target="_blank" className="text-white/85">
              <XOutlined className="text-[17px]" />
            </Link>
            <Link href="https://discord.com/invite/Zm99SKhhtA" target="_blank" className="text-white/85">
              <DiscordFilled className="text-[17px]" />
            </Link>
            <Link href="https://www.linkedin.com/company/accordproject/" target="_blank" className="text-white/85">
              <LinkedinFilled className="text-[17px]" />
            </Link>
          </Space>
        </Col>
      </Row>
    </Footer>
  );
};

export default CustomFooter;