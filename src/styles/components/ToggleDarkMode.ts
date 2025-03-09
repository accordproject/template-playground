import styled from "styled-components";

export const ToggleDarkModeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  margin-top: 22%;
  
  /* Prevent clicks on the outer container */
  pointer-events: none; 


  .dark-mode-toggle svg {
    stroke: white !important;
    stroke-width: 8px;
  }
`;
