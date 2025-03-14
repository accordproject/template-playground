import styled from "styled-components";

// Define the styled component with light and dark mode support
export const SkeletonStyled = styled.div`
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  border-radius: 6px;

  /* Light mode (default) */
  background-color: rgba(59, 130, 246, 0.1);

  /* Dark mode */
  @media (prefers-color-scheme: dark) {
    background-color: rgba(96, 165, 250, 0.1);
  }

  /* Keyframes for the pulse animation */
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;
