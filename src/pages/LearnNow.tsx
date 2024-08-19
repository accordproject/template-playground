import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Content from "../components/Content";
import fetchContent from "../utils/fetchContent";
import { LearnNowContainer } from "../styles/pages/LearnNow";

const LearnNow: React.FC = () => {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<{ title: string; link: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContent() {
      try {
        const stepLinks = ["intro.md", "module1.md", "module2.md"];
        const stepTitles = ["Introduction", "Module 1", "Module 2"];

        setSteps(
          stepTitles.map((title, index) => ({ title, link: stepLinks[index] }))
        );

        await fetchContent(step || "intro.md");
      } catch (err: any) {
        setError("Failed to load content");
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [step]);

  useEffect(() => {
    if (!step) {
      navigate("/learn-now/intro.md");
    }
  }, [step, navigate]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <LearnNowContainer>
      <Sidebar steps={steps} />
      <Content />
    </LearnNowContainer>
  );
};

export default LearnNow;
