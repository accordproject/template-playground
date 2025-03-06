import styled from "styled-components";

export const LearnNowContainer = styled.div`
  display: flex;

  @media (max-width:700px){
  display:flex;
  flex-direction:column
  
  }
`;

export const SidebarContainer = styled.div`
  width: 250px;
  background-color: #f4f4f4;
  padding: 20px;
  border-right: 1px solid #ddd;

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
    color: #333;
  }
  
`;

export const ContentContainer = styled.div`
  flex: 1;
  padding: 20px;
`;
