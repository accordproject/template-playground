import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Content from "../components/Content";
import fetchContent from "../utils/fetchContent";
import "../styles/learnNow.css";

const LearnNow: React.FC = () => {
  const { step } = useParams<{ step: string }>();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<{ title: string; link: string }[]>([]);
  const [content, setContent] = useState<string | null>(null);
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

        const initialStep = step || "intro.md"; // Use `intro.md` if no step provided
        const contentData = await fetchContent(initialStep);
        setContent(contentData);
      } catch (err: any) {
        setError("Failed to load content");
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [step]);

  // Redirect to `intro.md` if no `step` is provided
  useEffect(() => {
    if (!step) {
      navigate("/learn-now/intro.md");
    }
  }, [step, navigate]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="learn-now">
      <Sidebar steps={steps} />
      <Content />
    </div>
  );
};

export default LearnNow;
