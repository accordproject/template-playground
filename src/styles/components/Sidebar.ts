import styled from "styled-components";
import { NavLink } from "react-router-dom";

export const SidebarContainer = styled.div`
  width: 260px;
  background-color: var(--bg-color) !important;
  padding: 1rem;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  position: relative;
  overflow-y: auto;
  border-right: 1px solid var(--border-color) !important;
  height: 100vh; 
  margin: 0;

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    position: static;
  }
`;

export const SidebarTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: var(--text-color) !important;
`;

export const SidebarList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const SidebarListItem = styled.li`
  margin-bottom: 0.5rem;
`;

export const SidebarLink = styled(NavLink)`
  text-decoration: none;
  display: block;
  padding: 0.8rem 1rem;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color) !important;
  transition: background-color 0.3s, color 0.3s;

  &.active {
    background-color: var(--bg-color) !important;
    color: var(--text-color) !important;
    font-weight: 600;
    border-left: 2.5px solid #19c6c7;
  }

  &:hover {
    background-color: var(--bg-color) !important;
    color: var(--text-color) !important;
    text-decoration: underline;
  }
`;

export const HelperBox = styled.div`
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  background-color: var(--bg-color) !important;
  border-radius: 4px;
  font-size: 0.9rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const HelperIcon = styled.div`
  margin-right: 0.5rem;
  font-size: 1.2rem;
  color: #19c6c7;
`;

export const HelperText = styled.div`
  flex: 1;
  color: var(--text-color) !important;

  a {
    color: #19c6c7;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  & > a {
    margin-left: 0.25rem;
  }
`;

export const DividerLine = styled.div`
  height: 1px;
  background-color: var(--border-color) !important;
  margin: 7rem 0 1rem 0;
`;
