import styled from "styled-components"

export const LearnNowContainer = styled.div`
  display: flex;
`

export const SidebarContainer = styled.div<{ isOpen?: boolean }>`
  width: ${(props) => (props.isOpen ? "250px" : "60px")};
  background-color: var(--bg-color) !important; 
  padding: 0;
  border-right: 1px solid var(--border-color) !important;
  transition: width 0.3s ease;
  overflow: hidden;

  h2 {
    margin-top: 0;
    opacity: ${(props) => (props.isOpen ? "1" : "0")};
    transition: opacity 0.2s ease;
  }

  ul {
    list-style: none;
    padding: 0;
    opacity: ${(props) => (props.isOpen ? "1" : "0")};
    transition: opacity 0.2s ease;
  }

  li {
    margin-bottom: 10px;
  }

  a {
    text-decoration: none;
    color: var(--text-color) !important; 
  }
`

export const ContentContainer = styled.div<{ isSidebarOpen?: boolean }>`
  flex: 1;
  padding: 20px;
  background-color: var(--bg-color) !important; 
  color: var(--text-color) !important;
  margin-left: ${(props) => (props.isSidebarOpen ? "0" : "-190px")};
  transition: margin-left 0.3s ease;
`
