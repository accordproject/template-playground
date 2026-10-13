import React from "react";
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
          Welcome to the Learning Pathway! Follow the guide step-by-step.
          Use the <strong>Open in Playground</strong> button inside each module to experiment with the template directly.
        </HelperText>
      </HelperBox>
    </SidebarContainer>
  );
};

export default LearningPathwaySidebar;