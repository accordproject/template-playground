import React from "react";
import { Layout, Row, Col, Typography, Space } from "antd";
import {
  GithubOutlined,
  TwitterOutlined,
  MailOutlined,
} from "@ant-design/icons";

const { Footer } = Layout;
const { Text, Link } = Typography;

const CustomFooter: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <Footer
      style={{ background: "#001529", color: "white", padding: "20px 50px" }}
    >
      <Row justify="space-between" align="middle">
        <Col>
          <Space direction="vertical" size="middle">
            <Text style={{ color: "rgba(255, 255, 255, 0.65)" }}>
              © {year} Accord Project. All rights reserved.
            </Text>
            <Space>
              <Link
                href="https://github.com/myproject"
                target="_blank"
                style={{ color: "rgba(255, 255, 255, 0.65)" }}
              >
                <GithubOutlined style={{ fontSize: "20px" }} />
              </Link>
              <Link
                href="https://twitter.com/myproject"
                target="_blank"
                style={{ color: "rgba(255, 255, 255, 0.65)" }}
              >
                <TwitterOutlined style={{ fontSize: "20px" }} />
              </Link>
              <Link
                href="mailto:contact@myproject.com"
                style={{ color: "rgba(255, 255, 255, 0.65)" }}
              >
                <MailOutlined style={{ fontSize: "20px" }} />
              </Link>
            </Space>
          </Space>
        </Col>
        <Col>
          <Space direction="vertical" size="middle">
            <Link
              href="/privacy-policy"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              style={{ color: "rgba(255, 255, 255, 0.65)" }}
            >
              Terms of Service
            </Link>
          </Space>
        </Col>
      </Row>
    </Footer>
  );
};

export default CustomFooter;
