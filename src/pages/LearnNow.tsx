import React from "react";
import { Outlet } from "react-router-dom";
import LearningPathwaySidebar from "../components/LearningPathwaySidebar";
import { LearnNowContainer, ContentContainer } from "../styles/pages/LearnNow";
import { steps } from "../constants/learningSteps/steps";

const LearnNow: React.FC = () => {
  return (
    <LearnNowContainer>
      <LearningPathwaySidebar steps={steps} />
      <ContentContainer>
        <Outlet />
      </ContentContainer>
    </LearnNowContainer>
  );
};

export default LearnNow;
