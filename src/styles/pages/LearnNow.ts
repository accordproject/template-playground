import styled from "styled-components";

export const LearnNowContainer = styled.div`
  display: flex;
  height: 100%;
  min-height: calc(100vh - 60px); /* Adjust based on your header height */
`;

export const SidebarContainer = styled.aside`
  width: 280px;
  background-color: ${(props) => props.theme.bgColor};
  border-right: 1px solid ${(props) => props.theme.borderColor};
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: all 0.3s ease;
`;

export const SidebarHeader = styled.div`
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${(props) => props.theme.textColor};
    letter-spacing: 0.5px;
  }

  svg {
    color: ${(props) => props.theme.hoverColor};
  }
`;

export const Divider = styled.div`
  height: 1px;
  background-color: ${(props) => props.theme.borderColor};
  margin: 4px 0;
  opacity: 0.6;
`;

export const SidebarNav = styled.nav`
  display: flex;
  flex-direction: column;
  padding: 12px 0;
`;

export const SidebarSection = styled.div`
  margin-bottom: 16px;
`;

export const SidebarSectionTitle = styled.h3`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${(props) => props.theme.textColor};
  opacity: 0.7;
  margin: 0;
  padding: 16px 20px 8px;
  font-weight: 600;
`;

export const NavItem = styled.div`
  a {
    text-decoration: none;
    color: ${(props) => props.theme.textColor};
    display: block;
    transition: all 0.2s ease;

    &:hover {
      background-color: ${(props) =>
        props.theme.bgColor === "#0a1a2f"
          ? "rgba(255, 255, 255, 0.05)"
          : "rgba(0, 0, 0, 0.03)"};

      .arrow-icon {
        opacity: 1;
        transform: translateX(0);
      }
    }

    &.active {
      background-color: ${(props) =>
        props.theme.bgColor === "#0a1a2f"
          ? "rgba(25, 198, 199, 0.15)"
          : "rgba(25, 198, 199, 0.1)"};
      border-left: 3px solid ${(props) => props.theme.hoverColor};

      span {
        color: ${(props) => props.theme.hoverColor};
        font-weight: 500;
      }

      .arrow-icon {
        opacity: 1;
        transform: translateX(0);
        color: ${(props) => props.theme.hoverColor};
      }
    }
  }
`;

export const NavLinkContent = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  gap: 12px;
  position: relative;

  span {
    flex: 1;
    font-size: 14px;
    font-weight: 400;
  }

  svg {
    color: ${(props) =>
      props.theme.bgColor === "#0a1a2f"
        ? "rgba(214, 228, 255, 0.7)"
        : "rgba(5, 12, 64, 0.7)"};
  }

  .arrow-icon {
    opacity: 0;
    transform: translateX(-4px);
    transition: all 0.2s ease;
    margin-left: auto;
  }
`;

export const ModuleNumber = styled.div`
  font-family: "SF Mono", monospace;
  font-size: 14px;
  font-weight: 500;
  color: ${(props) => props.theme.hoverColor};
  min-width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ContentContainer = styled.main`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: ${
    (props) =>
      props.theme.bgColor === "#0a1a2f"
        ? "#0d1d33" /* Slightly lighter than sidebar in dark mode */
        : "#f5f9ff" /* Slightly darker than sidebar in light mode */
  };
`;
