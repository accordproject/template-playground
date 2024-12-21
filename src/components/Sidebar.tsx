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

const Sidebar: React.FC<{ steps: { title: string; link: string }[] }> = ({
  steps,
}) => {
  return (
    <SidebarContainer>
      <SidebarTitle>Learning Pathway</SidebarTitle>
      <SidebarList>
        {steps.map((step, index) => (
          <SidebarListItem key={index}>
            <SidebarLink
              to={step.link}
              className={({ isActive }) => (isActive ? "active" : undefined)}
              aria-label={`Navigate to step: ${step.title}`} // Added ARIA label for better navigation context
            >
              {step.title}
            </SidebarLink>
          </SidebarListItem>
        ))}
      </SidebarList>
      <DividerLine />
      <HelperBox>
        <HelperIcon>
          <BulbOutlined aria-label="Information icon" /> {/* Added ARIA label to describe the purpose of the icon */}
        </HelperIcon>
        <HelperText>
          Welcome to the Learning Pathway! Use the sidebar to follow the guide.
          Open the{" "}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the Template Playground in a new tab" // Added ARIA label to explain the link's purpose
          >
            Template Playground
          </Link>{" "}
          in another tab to experiment as you learn.
        </HelperText>
      </HelperBox>
    </SidebarContainer>
  );
};

export default Sidebar;
