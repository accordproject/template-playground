import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BulbOutlined } from "@ant-design/icons";
import { SidebarContainer, SidebarTitle, StepItem, TipContainer, TipIcon, TipText } from "../styles/components/LearningPathwaySidebar";

interface Step {
  title: string;
  link: string;
}

interface LearningPathwaySidebarProps {
  steps: Step[];
  isOpen?: boolean;
  onClose?: () => void;
}

const LearningPathwaySidebar: React.FC<LearningPathwaySidebarProps> = ({ 
  steps, 
  isOpen = false, 
  onClose 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleStepClick = (link: string) => {
    navigate(link);
    if (onClose) {
      onClose();
    }
  };

  return (
    <SidebarContainer $isOpen={isOpen}>
      <SidebarTitle>Learning Pathway</SidebarTitle>
      {steps.map((step, index) => (
        <StepItem
          key={index}
          onClick={() => handleStepClick(step.link)}
          $isActive={location.pathname === step.link}
        >
          {step.title}
        </StepItem>
      ))}
      
      <TipContainer>
        <TipIcon>
          <BulbOutlined />
        </TipIcon>
        <TipText>
          Welcome to the Learning Pathway! Use the sidebar to follow the guide. Open the <span style={{ color: '#19c6c7', fontWeight: '600' }}>Template Playground</span> in another tab to experiment as you learn.
        </TipText>
      </TipContainer>
    </SidebarContainer>
  );
};

export default LearningPathwaySidebar;