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
} from "@ant-design/icons";
import { Spin, message, Button } from "antd";
import fetchContent from "../utils/fetchContent";
import { steps } from "../constants/learningSteps/steps";
import { LearnContentProps } from "../types/components/Content.types";
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

  const currentIndex = steps.findIndex((step) =>
    step.link.includes(file.split(".")[0])
  );

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
            <LoadingOutlined style={{ fontSize: 42, color: "#19c6c7" }} spin />
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
	  {currentIndex !== steps.length - 1 && (
  		<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
    	  <Button
			type="link"
			onClick={handleExitLearning}
			style={{
    		  background: "transparent",
			  border: "none",
			  color: "#6b7280",
			  cursor: "pointer",
			  fontSize: "0.9rem",
			  textDecoration: "underline",
			  padding: 0,
			  height: "auto"
			}}
		  >
			Exit learning
		  </Button>
	    </div>
	  )}
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