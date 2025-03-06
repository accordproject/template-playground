import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { LearnNowContainer, SidebarContainer, ContentContainer } from "../styles/pages/LearnNow";
import { steps } from "../constants/learningSteps/steps";

const LearnNow: React.FC = () => {
  useEffect(() => {
    const computedBg = getComputedStyle(document.documentElement).getPropertyValue('--bg-color');
    console.log("LearnNow: computed --bg-color:", computedBg);
  }, []);

  return (
    <LearnNowContainer>
      <SidebarContainer>
        <Sidebar steps={steps} />
      </SidebarContainer>
      <ContentContainer>
        <Outlet />
      </ContentContainer>
    </LearnNowContainer>
  );
};

export default LearnNow;
