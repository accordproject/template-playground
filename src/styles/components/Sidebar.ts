import styled from "styled-components";
import { NavLink } from "react-router-dom";

export const SidebarContainer = styled.div<{ isOpen?: boolean }>`
  width: 100%;
  height: 100%;
  background-color: var(--bg-color) !important;
  padding: 1rem;
  position: relative;
  overflow-y: auto;
  border-right: 1px solid #ddd;
  transition: all 0.3s ease;
  
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
  margin-top: 2.5rem;
  color: var(--text-color) !important;
  opacity: 1;
  transition: opacity 0.3s ease;
`;

export const SidebarList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  opacity: 1;
  transition: opacity 0.3s ease;
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
    background-color: var(--active-bg-color) !important;
    color: var(--active-text-color) !important;
    font-weight: 600;
    border-left: 2.5px solid #19c6c7;
  }

  &:hover {
    background-color: var(--hover-bg-color) !important;
    color: var(--hover-text-color) !important;
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

export const DividerLine = styled.div`
  height: 1px;
  background-color: #ddd;
  margin: 7rem 0 1rem 0;
`;

export const HamburgerButton = styled.button<{ isOpen?: boolean }>`
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 10px;
  right: ${props => props.isOpen ? "220px" : "20px"};
  z-index: 100;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  transition: all 0.3s ease;
  &:hover {
    color: #19c6c7;
    background-color: rgba(25, 198, 199, 0.1);
  }
`;