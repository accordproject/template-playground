import styled from "styled-components";

export const ToggleDarkModeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem; /* Using relative units for better responsiveness */
  
  /* Prevent clicks on the outer container */
  pointer-events: none;

  .dark-mode-toggle {
    pointer-events: auto; /* Enable clicks only inside the actual toggle */
  }
`;
