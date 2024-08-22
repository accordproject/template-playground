import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  ContentContainer,
  NavigationButtons,
  NavigationButton,
} from "../styles/components/Content";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import fetchContent from "../utils/fetchContent";

interface LearnContentProps {
  file: string;
}

const LearnContent: React.FC<LearnContentProps> = ({ file }) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { title: "Introduction", link: "/learn/intro" },
    { title: "Module 1", link: "/learn/module1" },
    { title: "Module 2", link: "/learn/module2" },
  ];

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
      window.location.href = steps[currentIndex - 1].link;
    }
  };

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      window.location.href = steps[currentIndex + 1].link;
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
      {content && <ReactMarkdown>{content}</ReactMarkdown>}
      <NavigationButtons>
        <NavigationButton
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          Previous
        </NavigationButton>
        <NavigationButton
          onClick={handleNext}
          disabled={currentIndex === steps.length - 1}
        >
          Next
        </NavigationButton>
      </NavigationButtons>
    </ContentContainer>
  );
};

export default LearnContent;
