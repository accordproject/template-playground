import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { LearnNowContainer } from "../styles/pages/LearnNow";

const steps = [
  { title: "Introduction", link: "/learn/intro" },
  { title: "Module 1", link: "/learn/module1" },
  { title: "Module 2", link: "/learn/module2" },
];

const LearnNow: React.FC = () => {
  return (
    <LearnNowContainer>
      <Sidebar steps={steps} />
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </LearnNowContainer>
  );
};

export default LearnNow;
