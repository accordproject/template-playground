import styled from "styled-components";

export const SidebarContainer = styled.div`
  width: 220px;
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

export const SidebarLink = styled.div`
  text-decoration: none;
  color: #050c40;
  display: block;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 600;
  transition: background-color 0.3s, color 0.3s;

  &:hover {
    background-color: #e0e0e0;
    color: #0056b3;
  }

  &.active {
    font-weight: 600;
    background-color: #007bff;
    color: #ffffff;
  }
`;
