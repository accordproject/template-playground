import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import { useNavigate } from "react-router-dom";
import {
  ContentContainer,
  NavigationButtons,
  NavigationButton,
  ModuleSection,
  LoadingContainer,
  ErrorContainer,
  RetryButton,
} from "../styles/components/Content";
import { LoadingOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import fetchContent from "../utils/fetchContent";
import { steps } from "../constants/learningSteps/steps";
import { LearnContentProps } from "../types/components/Content.types";

// Markdown syntax highlighting theme
import "highlight.js/styles/github.css";

const LearnContent: React.FC<LearnContentProps> = ({ file }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadContent = async (): Promise<void> => {
      try {
        setLoading(true);
        const content = await fetchContent(file);
        setContent(content);
        setError(null);
      } catch (err: unknown) {
        setError("Failed to load content");
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

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    const loadContent = async (): Promise<void> => {
      try {
        const content = await fetchContent(file);
        setContent(content);
        setError(null);
      } catch (err: unknown) {
        setError("Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    void loadContent();
  };

  if (loading) {
    return (
      <LoadingContainer>
        <Spin
          indicator={
            <LoadingOutlined style={{ fontSize: 42, color: "#19c6c7" }} spin />
          }
        />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <div>Error: {error}</div>
        <RetryButton onClick={handleRetry}>Retry</RetryButton>
      </ErrorContainer>
    );
  }

  return (
    <ContentContainer>
      {content && (
        <ModuleSection>
          <ReactMarkdown
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
            components={{
              img: ({ ...props }) => (
                <div className="image-container">
                  <img {...props} alt={props.alt || "Learn content image"} />
                </div>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </ModuleSection>
      )}
      <NavigationButtons>
        <NavigationButton
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          aria-label="Previous module"
        >
          <LeftOutlined /> Previous
        </NavigationButton>
        <NavigationButton
          onClick={handleNext}
          disabled={currentIndex === steps.length - 1}
          aria-label="Next module"
        >
          Next <RightOutlined />
        </NavigationButton>
      </NavigationButtons>
    </ContentContainer>
  );
};

export default LearnContent;
