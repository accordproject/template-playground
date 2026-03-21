import React from "react";
import { Link } from "react-router-dom";
import {
  SidebarContainer,
  SidebarTitle,
  SidebarList,
  SidebarListItem,
  SidebarLink,
  HelperBox,
  HelperIcon,
  HelperText,
  DividerLine,
} from "../styles/components/Sidebar";
import { BulbOutlined } from "@ant-design/icons";

interface SidebarProps {
  steps: { title: string; link: string }[];
}
const LearningPathwaySidebar: React.FC<SidebarProps> = ({ steps }) => {
  return (
    <SidebarContainer>
      <SidebarTitle>Learning Pathway</SidebarTitle>
      <SidebarList>
        {steps.map((step) => (
          <SidebarListItem key={step.link}>
            <SidebarLink
              to={step.link}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {step.title}
            </SidebarLink>
          </SidebarListItem>
        ))}
      </SidebarList>
      <DividerLine />
      <HelperBox>
        <HelperIcon>
          <BulbOutlined />
        </HelperIcon>
        <HelperText>
          Welcome to the Learning Pathway! Use the sidebar to follow the guide.
          Open the
          <Link to="/" target="_blank" rel="noopener noreferrer">
            Template Playground
          </Link>{" "}
          in another tab to experiment as you learn.
        </HelperText>
      </HelperBox>
    </SidebarContainer>
  );
};

export default LearningPathwaySidebar;