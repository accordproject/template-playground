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
  DividerLine,
} from "../styles/components/Sidebar";
import { BulbOutlined } from "@ant-design/icons";
import styled from "styled-components";

interface SidebarProps {
  steps: { title: string; link: string }[];
}
const Sidebar: React.FC<SidebarProps> = ({ steps }) => {
  const HelperText = styled.div`
  flex: 1;
  color: #333;

  a {
    color: #19c6c7 !important;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  & > a {
    margin-left: 0.25rem;
  }
`;
  return (
    <SidebarContainer>
      <SidebarTitle>Learning Pathway</SidebarTitle>
      <SidebarList>
        {steps.map((step, index) => (
          <SidebarListItem key={index}>
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
          Open the {" "}
          <Link to="/" target="_blank" rel="noopener noreferrer">
            Template Playground
          </Link>{" "}
          in another tab to experiment as you learn.
        </HelperText>
      </HelperBox>
    </SidebarContainer>
  );
};

export default Sidebar;