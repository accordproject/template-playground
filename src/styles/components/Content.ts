import styled from "styled-components";

export const ContentContainer = styled.div`
  padding: 1.25rem;
  max-width: 56.25rem;
  width: 100%;
  margin: 0 auto;
  background-color: var(--bg-color);
  border-radius: 0.5rem;
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
  box-sizing: border-box;

  h1, h2, h3, h4, h5, h6 {
    margin-top: 1em;
    margin-bottom: 0.5em;
    color: var(--text-color);
  }

  p {
    line-height: 1.6;
    margin-bottom: 1em;
    color: var(--text-color);
  }

  a {
    color: #19c6c7;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }

  ul, ol {
    margin: 1em 0;
    li {
      margin-bottom: 0.5em;
      color: var(--text-color);
    }
  }

  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
  }

  .image-container {
    display: flex;
    justify-content: center;
  }

  pre {
    background-color: #282c34;
    color: white;
    padding: 0.75rem;
    border-radius: 0.3125rem;
    overflow-x: auto;
    font-size: 0.875rem;
    margin: 0.625rem 0;
  }

  code {
    font-family: "Fira Code", monospace;
    white-space: pre-wrap;
  }

  @media (max-width: 75rem) {
    max-width: 90%;
  }

  @media (max-width: 48rem) {
    padding: 0.9375rem;
  }
`;

export const CodeBlockContainer = styled.div`
  position: relative;
  margin: 0.625rem 0;
`;

export const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.625rem;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  padding: 0.3125rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;

  &:hover {
    background: rgba(255, 255, 255, 0.4);
  }
`;

export const NavigationButtons = styled.div`
  margin-top: 3.75rem;
  margin-bottom: 1.25rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 48rem) {
    flex-direction: column;
    align-items: stretch;
    button {
      margin-bottom: 0.625rem;
    }
  }
`;

export const NavigationButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 0.125rem solid #2c3e50;
  border-radius: 2rem;
  background-color: #2c3e50;
  color: white;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(44, 62, 80, 0.2);
  position: relative;
  overflow: hidden;

  &:disabled {
    background-color: #95a5a6;
    color: #ecf0f1;
    cursor: not-allowed;
    border-color: #95a5a6;
    box-shadow: none;
  }

  &:hover:not(:disabled) {
    background-color: white;
    color: #2c3e50;
    border-color: #2c3e50;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(44, 62, 80, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(44, 62, 80, 0.2);
  }
`;