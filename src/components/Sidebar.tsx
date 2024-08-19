import React from "react";
import { Link } from "react-router-dom";
import {
  SidebarContainer,
  SidebarTitle,
  SidebarList,
  SidebarListItem,
  SidebarLink,
} from "../styles/components/Sidebar";

const Sidebar: React.FC<{ steps: { title: string; link: string }[] }> = ({
  steps,
}) => {
  return (
    <SidebarContainer>
      <SidebarTitle>Learning Pathway</SidebarTitle>
      <SidebarList>
        {steps.map((step, index) => (
          <SidebarListItem key={index}>
            <Link to={`/learn-now/${step.link}`}>
              <SidebarLink>{step.title}</SidebarLink>
            </Link>
          </SidebarListItem>
        ))}
      </SidebarList>
    </SidebarContainer>
  );
};

export default Sidebar;
