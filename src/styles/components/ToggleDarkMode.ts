import styled from "styled-components";

export const ToggleDarkModeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;

  /* Prevent clicks on the outer container */
  pointer-events: none;

  .dark-mode-toggle {
    pointer-events: auto; /* Enable clicks only inside the actual toggle */
    outline: 0.125rem solid white;
    border-radius: 1.25rem;
  }
`;
