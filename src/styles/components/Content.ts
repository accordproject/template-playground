import styled from "styled-components";

export const ContentContainer = styled.div`
  padding: 20px;
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  box-sizing: border-box;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin-top: 1em;
    margin-bottom: 0.5em;
    color: #333;
  }

  p {
    line-height: 1.6;
    margin-bottom: 1em;
  }

  a {
    color: #007bff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  code {
    background: #f1f1f1;
    padding: 2px 4px;
    border-radius: 4px;
  }

  pre {
    background: #f1f1f1;
    padding: 1em;
    border-radius: 4px;
    overflow: auto;
  }

  blockquote {
    border-left: 4px solid #007bff;
    padding-left: 1em;
    margin: 1em 0;
    color: #555;
  }

  ul,
  ol {
    margin: 1em 0;

    li {
      margin-bottom: 0.5em;
    }
  }

  @media (max-width: 1200px) {
    max-width: 90%;
  }

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

export const NavigationButtons = styled.div`
  margin-top: 60px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;

    button {
      margin-bottom: 10px;
    }
  }
`;

export const NavigationButton = styled.button`
  padding: 10px 20px;
  border: 2px solid #19c6c7;
  border-radius: 4px;
  background-color: white;
  color: #1b2540;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    background-color: #e0e0e0;
    color: #9e9e9e;
    cursor: not-allowed;
    border-color: #e0e0e0;
  }

  &:hover:not(:disabled) {
    background-color: #19c6c7; /* Hover background color */
    color: white; /* Text color on hover */
    text-decoration: underline; /* Underline text on hover */
  }

  svg {
    margin-right: 8px; /* Space between icon and text */
  }

  &:nth-child(1) svg {
    margin-right: 8px; /* Adjust for left arrow icon */
  }

  &:nth-child(2) {
    svg {
      margin-right: 0;
      margin-left: 8px; /* Adjust for right arrow icon */
    }
  }
`;
