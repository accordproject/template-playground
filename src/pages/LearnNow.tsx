import type React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ThemeProvider } from "styled-components";
import useAppStore from "../store/store";
import {
  LearnNowContainer,
  SidebarContainer,
  ContentContainer,
  SidebarHeader,
  SidebarNav,
  SidebarSection,
  SidebarSectionTitle,
  NavItem,
  NavLinkContent,
  ModuleNumber,
  Divider,
} from "../styles/pages/LearnNow";
import { BookOpen, BookText, ChevronRight } from "lucide-react";

interface Theme {
  bgColor: string;
  borderColor: string;
  textColor: string;
  hoverColor: string;
}

const LearnNow: React.FC = () => {
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);

  const theme: Theme = {
    bgColor: backgroundColor,
    borderColor: backgroundColor === "#0a1a2f" ? "#2a3a5f" : "#b3c7e6",
    textColor: textColor,
    hoverColor: "#19c6c7",
  };

  return (
    <ThemeProvider theme={theme}>
      <LearnNowContainer>
        <SidebarContainer>
          <SidebarHeader>
            <BookOpen size={24} />
            <h2>Learning Center</h2>
          </SidebarHeader>

          <Divider />

          <SidebarNav>
            <SidebarSection>
              <SidebarSectionTitle>Getting Started</SidebarSectionTitle>
              <NavItem>
                <NavLink
                  to="intro"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <NavLinkContent>
                    <BookText size={18} />
                    <span>Introduction</span>
                    <ChevronRight size={16} className="arrow-icon" />
                  </NavLinkContent>
                </NavLink>
              </NavItem>
            </SidebarSection>

            <Divider />

            <SidebarSection>
              <SidebarSectionTitle>Course Modules</SidebarSectionTitle>

              <NavItem>
                <NavLink
                  to="module1"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <NavLinkContent>
                    <ModuleNumber>01</ModuleNumber>
                    <span>Fundamentals</span>
                    <ChevronRight size={16} className="arrow-icon" />
                  </NavLinkContent>
                </NavLink>
              </NavItem>

              <NavItem>
                <NavLink
                  to="module2"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <NavLinkContent>
                    <ModuleNumber>02</ModuleNumber>
                    <span>Intermediate Concepts</span>
                    <ChevronRight size={16} className="arrow-icon" />
                  </NavLinkContent>
                </NavLink>
              </NavItem>

              <NavItem>
                <NavLink
                  to="module3"
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  <NavLinkContent>
                    <ModuleNumber>03</ModuleNumber>
                    <span>Advanced Techniques</span>
                    <ChevronRight size={16} className="arrow-icon" />
                  </NavLinkContent>
                </NavLink>
              </NavItem>
            </SidebarSection>

            <Divider />
          </SidebarNav>
        </SidebarContainer>
        <ContentContainer>
          <Outlet />
        </ContentContainer>
      </LearnNowContainer>
    </ThemeProvider>
  );
};

export default LearnNow;
