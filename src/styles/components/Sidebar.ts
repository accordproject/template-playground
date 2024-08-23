import styled from "styled-components";
import { NavLink } from "react-router-dom";

export const SidebarContainer = styled.div`
  width: 260px;
  background-color: #f5f5f5;
  padding: 1rem;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  position: relative;
  overflow-y: auto;

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
  color: #333;
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
  color: #717171;
  transition: background-color 0.3s, color 0.3s;

  &.active {
    background-color: #e0e0e0;
    color: #1b2540;
    font-weight: 600;
    border-left: 2.5px solid #19c6c7;
  }

  &:hover {
    background-color: #e0e0e0;
    color: #050c40;
    text-decoration: underline;
  }
`;

export const HelperBox = styled.div`
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  background-color: #e6f7ff;
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
  color: #333;

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
  background-color: #ddd;
  margin: 7rem 0 1rem 0;
`;
