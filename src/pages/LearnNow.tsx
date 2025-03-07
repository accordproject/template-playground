import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "@components/Sidebar";
import { LearnNowContainer } from "@styles/pages/LearnNow";
import { steps } from "@constants/learningSteps/steps";

const LearnNow: React.FC = () => {
  return (
    <LearnNowContainer>
      <Sidebar steps={steps} />
      <Outlet />
    </LearnNowContainer>
  );
};

export default LearnNow;
