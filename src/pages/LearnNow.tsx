import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { LearnNowContainer, SidebarContainer, ContentContainer } from "../styles/pages/LearnNow";
import { steps } from "../constants/learningSteps/steps";

const LearnNow: React.FC = () => {
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
