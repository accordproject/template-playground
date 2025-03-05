import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import { useNavigate } from "react-router-dom";
import {
  ContentContainer,
  NavigationButtons,
  NavigationButton,
} from "@styles/components/Content";
import {
  LoadingOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Spin } from "antd";
import fetchContent from "@utils/fetchContent";
import { steps } from "@constants/learningSteps/steps";

// markdown syntax highlighting theme
import "highlight.js/styles/github.css";

interface LearnContentProps {
  file: string;
}

const LearnContent: React.FC<LearnContentProps> = ({ file }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const content = await fetchContent(file);
        setContent(content);
        setError(null);
      } catch (err: any) {
        setError("Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
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
      {content && (
        <ReactMarkdown
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
          components={{
            img: ({ node, ...props }) => (
              <div className="image-container">
                <img {...props} alt={props.alt || ""} />
              </div>
            ),
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
        <NavigationButton
          onClick={handleNext}
          disabled={currentIndex === steps.length - 1}
        >
          Next <RightOutlined />
        </NavigationButton>
      </NavigationButtons>
    </ContentContainer>
  );
};

export default LearnContent;
