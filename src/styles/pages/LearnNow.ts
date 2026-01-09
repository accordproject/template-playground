import styled from "styled-components";

export const LearnNowContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--bg-color);
`;

export const SidebarContainer = styled.div`
  width: 250px;
  background-color: var(--bg-color) !important; 
  padding: 0;
  border-right: 1px solid var(--border-color) !important;

  h2 {
    margin-top: 0;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    margin-bottom: 10px;
  }

  a {
    text-decoration: none;
    color: var(--text-color) !important; 
  }
`;

export const ContentContainer = styled.div`
  flex: 1;
  padding: 20px;
  background-color: var(--bg-color) !important; 
  color: var(--text-color) !important;
  overflow-y: auto;
`;
