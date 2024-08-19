import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  ContentContainer,
  NavigationButtons,
  NavigationButton,
} from "../styles/components/Content";
import fetchContent from "../utils/fetchContent";

const Content: React.FC = () => {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ⚠️ should be updated only based on actual steps and new contents
  const steps = ["intro.md", "module1.md", "module2.md"];

  useEffect(() => {
    const loadContent = async () => {
      if (!step) return;
      try {
        setLoading(true);
        const content = await fetchContent(`${step}`);
        setContent(content);
        setError(null);
      } catch (err: any) {
        setError("Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [step]);

  const currentIndex = steps.indexOf(step ?? "");

  const handlePrevious = () => {
    if (currentIndex > 0) {
      navigate(`/learn-now/${steps[currentIndex - 1]}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < steps.length - 1) {
      navigate(`/learn-now/${steps[currentIndex + 1]}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

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

export default Content;
