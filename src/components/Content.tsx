import { colors } from '../utils/theme';
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import { useNavigate } from "react-router-dom";
import {
  ContentContainer,
  NavigationButtons,
  NavigationButton,
  CodeBlockContainer,
  CopyButton,
} from "../styles/components/Content";
import {
  LoadingOutlined,
  LeftOutlined,
  RightOutlined,
  CopyOutlined,
  CheckOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { Spin, message, Button, Card, Row, Col, Space, Typography } from "antd";
import fetchContent from "../utils/fetchContent";
import { steps } from "../constants/learningSteps/steps";
import { LearnContentProps } from "../types/components/Content.types";
import useAppStore from "../store/store";
import "highlight.js/styles/github.css";

const LearnContent: React.FC<LearnContentProps> = ({ file }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const contentData = await fetchContent(file);
        setContent(contentData);
        setError(null);
      } catch (err) {
        setError("Failed to load content");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void loadContent();
  }, [file]);

  const loadSample = useAppStore((state) => state.loadSample);

  const currentIndex = steps.findIndex((step) =>
    step.link.includes(file.split(".")[0])
  );
  const currentStep = currentIndex !== -1 ? steps[currentIndex] : undefined;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      navigate(steps[currentIndex - 1].link);
    }
  };

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      navigate(steps[currentIndex + 1].link);
    }
  };

  const handleExitLearning = () => {
    navigate("/");
  };

  const handleOpenInPlayground = async () => {
    if (!currentStep?.sampleName) return;
    try {
      await loadSample(currentStep.sampleName);
      void message.success(`Loaded "${currentStep.sampleName}" into Playground`);
      navigate(`/?sample=${encodeURIComponent(currentStep.sampleName)}`);
    } catch (err) {
      console.error("Failed to load sample in playground:", err);
      void message.error("Failed to load sample in Playground");
    }
  };

  const copyToClipboard = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopied(code);
    void message.success("Copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin
          indicator={
            <LoadingOutlined style={{ fontSize: 42, color: colors.primary }} spin />
          }
        />
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <ContentContainer>
      <Row justify="space-between" align="middle" style={{ marginBottom: "16px" }}>
        <Col>
          {currentStep?.sampleName && (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => void handleOpenInPlayground()}
              style={{
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                color: colors.darkNavy,
                fontWeight: 600,
              }}
            >
              Open in Playground
            </Button>
          )}
        </Col>
        <Col>
          {currentIndex !== steps.length - 1 && (
            <Button
              type="link"
              onClick={handleExitLearning}
              style={{
                color: "#6b7280",
                fontSize: "0.9rem",
                textDecoration: "underline",
                padding: 0,
                height: "auto",
              }}
            >
              Exit learning
            </Button>
          )}
        </Col>
      </Row>
      {content && (
        <ReactMarkdown
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
          components={{
            pre: ({ children }) => {
              const codeElement = React.Children.toArray(children)[0] as React.ReactElement | undefined;
              if (!codeElement || typeof codeElement !== "object") return <pre>{children}</pre>;

              const codeElementProps = codeElement.props as { children?: unknown } | undefined;
              const codeText = (typeof codeElementProps?.children === 'string' ? codeElementProps.children : String(codeElementProps?.children ?? "")) ?? "";
              return (
                <CodeBlockContainer>
                  <pre>{children}</pre>
                  <CopyButton onClick={() => copyToClipboard(String(codeText))}>
                    {copied === codeText ? <CheckOutlined /> : <CopyOutlined />}
                  </CopyButton>
                </CodeBlockContainer>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      )}
      {currentStep?.sampleName && (
        <Card
          size="small"
          style={{
            margin: "24px 0 16px 0",
            borderRadius: 8,
            border: `1px solid ${colors.primary}40`,
            background: "rgba(25, 198, 199, 0.05)",
          }}
        >
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} sm={16}>
              <Space direction="vertical" size={2}>
                <Typography.Text strong>
                  Ready to experiment with this template?
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: "0.85rem" }}>
                  Load &ldquo;{currentStep.sampleName}&rdquo; directly in the Playground editor and live preview.
                </Typography.Text>
              </Space>
            </Col>
            <Col xs={24} sm={8} style={{ textAlign: "right" }}>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => void handleOpenInPlayground()}
                style={{
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  color: colors.darkNavy,
                  fontWeight: 600,
                }}
              >
                Open in Playground
              </Button>
            </Col>
          </Row>
        </Card>
      )}
      <NavigationButtons>
        <NavigationButton
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <LeftOutlined /> Previous
        </NavigationButton>
        {currentIndex === steps.length - 1 ? (
		  <NavigationButton onClick={handleExitLearning}>
		  Finish
		  </NavigationButton>
		) : (
		  <NavigationButton onClick={handleNext}>
		  Next <RightOutlined />
		  </NavigationButton>
		)}
      </NavigationButtons>
    </ContentContainer>
  );
};

export default LearnContent;