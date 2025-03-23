import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const ModuleSection = styled.div`
  background-color: ${(props) =>
    props.theme.bgColor === "#0a1a2f"
      ? "#050c40"
      : "#3a3a3a"}; /* Match ContentContainer in light mode */
  padding: 30px;
  border-radius: 8px;

  margin-bottom: 20px;
`;

export const ContentContainer = styled.div`
  flex: 1;
  padding: 30px 40px;
  background-color: ${(props) =>
    props.theme.bgColor === "#0a1a2f"
      ? "#000000"
      : "#3a3a3a"}; /* Dark gray in light mode */
  color: ${(props) =>
    props.theme.bgColor === "#0a1a2f"
      ? props.theme.textColor
      : "#ffffff"}; /* White text in light mode */
  animation: ${fadeIn} 0.5s ease-out forwards;

  /* Headings */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: ${(props) =>
      props.theme.bgColor === "#0a1a2f"
        ? props.theme.hoverColor
        : "#ffffff"}; /* White headings in light mode */
    margin-bottom: 20px;
    line-height: 1.4;
  }

  h1 {
    font-size: 32px;
    font-weight: 600;
  }

  h2 {
    font-size: 28px;
    font-weight: 500;
  }

  h3 {
    font-size: 24px;
    font-weight: 500;
  }

  h4 {
    font-size: 20px;
    font-weight: 500;
  }

  h5,
  h6 {
    font-size: 18px;
    font-weight: 500;
  }

  /* Paragraphs */
  p {
    font-size: 16px;
    line-height: 1.8;
    margin-bottom: 20px;
  }

  /* Lists */
  ul,
  ol {
    margin-bottom: 20px;
    padding-left: 30px;
  }

  ul li,
  ol li {
    font-size: 16px;
    line-height: 1.8;
    margin-bottom: 10px;
    color: ${(props) =>
      props.theme.bgColor === "#0a1a2f" ? props.theme.textColor : "#ffffff"};
  }

  /* Links */
  a {
    color: ${(props) => props.theme.hoverColor};
    text-decoration: none;
    transition: all 0.3s ease;
    position: relative;
  }

  a:hover {
    color: ${(props) =>
      props.theme.bgColor === "#0a1a2f" ? "#a0c4ff" : "#19c6c7"};
    text-decoration: none;
  }

  a::after {
    content: "";
    position: absolute;
    width: 0;
    height: 1px;
    bottom: -2px;
    left: 0;
    background-color: ${(props) =>
      props.theme.bgColor === "#0a1a2f" ? "#a0c4ff" : "#19c6c7"};
    transition: width 0.3s ease;
  }

  a:hover::after {
    width: 100%;
  }

  /* Code blocks */
  code {
    background-color: ${(props) =>
      props.theme.bgColor === "#0a1a2f"
        ? "#2a3a5f"
        : "#4a4a4a"}; /* Slightly lighter than #3a3a3a in light mode */
    color: ${(props) =>
      props.theme.bgColor === "#0a1a2f" ? props.theme.textColor : "#ffffff"};
    padding: 2px 6px;
    border-radius: 4px;
    font-family: "Fira Code", monospace;
    font-size: 14px;
  }

  pre {
    background-color: ${(props) =>
      props.theme.bgColor === "#0a1a2f" ? "#2a3a5f" : "#4a4a4a"};
    color: ${(props) =>
      props.theme.bgColor === "#0a1a2f" ? props.theme.textColor : "#ffffff"};
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow-x: auto;
    margin-bottom: 20px;
    font-family: "Fira Code", monospace;
    font-size: 14px;
    line-height: 1.6;
  }

  /* Blockquotes */
  blockquote {
    border-left: 4px solid
      ${(props) =>
        props.theme.bgColor === "#0a1a2f" ? "#4a6a9f" : props.theme.hoverColor};
    padding-left: 20px;
    margin: 20px 0;
    color: ${(props) =>
      props.theme.bgColor === "#0a1a2f" ? props.theme.textColor : "#ffffff"};
    font-style: italic;
  }

  /* Horizontal rule */
  hr {
    border: none;
    border-top: 1px solid ${(props) => props.theme.borderColor};
    margin: 30px 0;
  }

  /* Image container */
  .image-container {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }

  .image-container img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
`;

export const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
`;

export const NavigationButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 16px;
  font-weight: 500;
  color: ${(props) =>
    props.theme.bgColor === "#0a1a2f" ? props.theme.textColor : "#ffffff"};
  background-color: ${(props) =>
    props.theme.bgColor === "#0a1a2f" ? "#1a2a4f" : "#5a5a5a"};
  border: 1px solid #5a5a5a;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background-color: #1b2540;
    border: 1px solid #1b2540;
    color: ${(props) =>
      props.theme.bgColor === "#0a1a2f" ? "#050c40" : "#ffffff"};
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const LoadingContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
`;

export const ErrorContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  color: ${(props) =>
    props.theme.bgColor === "#0a1a2f" ? props.theme.textColor : "#ffffff"};
  font-size: 18px;
`;

export const RetryButton = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  color: ${(props) =>
    props.theme.bgColor === "#0a1a2f" ? props.theme.textColor : "#ffffff"};
  background-color: ${(props) => props.theme.hoverColor};
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${(props) =>
      props.theme.bgColor === "#0a1a2f" ? "#a0c4ff" : "#1a2a44"};
    transform: scale(1.05);
  }
`;
