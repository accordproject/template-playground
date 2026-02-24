import styled from "styled-components";

export const SidebarContainer = styled.div<{ $isOpen: boolean }>`
  width: 15rem;
	background-color: var(--bg-color);
  padding: 1.25rem;
  overflow-y: auto;
  border-right: 0.0625rem solid #2c3e50;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;

  @media (max-width: 48rem) {
    position: fixed;
    top: 0;
    left: ${props => props.$isOpen ? '0' : '-17.5rem'};
    height: 100%;
    z-index: 1000;
    transition: left 0.3s ease-in-out;
    box-shadow: ${props => props.$isOpen ? '0.125rem 0 0.625rem rgba(0, 0, 0, 0.3)' : 'none'};
  }
`;

export const SidebarTitle = styled.h2`
  color: var(--text-color);
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
`;

export const StepItem = styled.div<{ $isActive: boolean }>`
  padding: 0.75rem 1rem;
  margin-bottom: 0.625rem;
  background-color: ${props => props.$isActive ? '#2c3e50' : 'transparent'};
  color: ${props => (props.$isActive ? '#ffffff' : 'var(--text-color)')};
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: ${props => props.$isActive ? '600' : '400'};
  border-left: ${props => props.$isActive ? '0.1875rem solid #19c6c7' : '0.1875rem solid transparent'};

  &:hover {
    color: white;
    background-color: #2c3e50;
  }
`;

export const TipContainer = styled.div`
  margin-top: auto;
  padding-top: 1.5rem;
  background-color: #d1f0f0;
  padding: 1rem;
  border-radius: 0.375rem;
  margin-top: 1.5rem;
`;

export const TipIcon = styled.div`
  color: #19c6c7;
  font-size: 1.5rem;
  margin-bottom: 0.625rem;
`;

export const TipText = styled.p`
  color: #1b2540;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
`;