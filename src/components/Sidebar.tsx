import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  SidebarContainer,
  SidebarTitle,
  SidebarList,
  SidebarListItem,
  SidebarLink,
  HelperBox,
  HelperIcon,
  HelperText,
  DividerLine,
} from "../styles/components/Sidebar";
import { BulbOutlined, MenuOutlined } from "@ant-design/icons";

const Sidebar: React.FC<{ steps: { title: string; link: string }[] }> = ({ steps }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <button 
        onClick={toggleSidebar} 
        style={{
          position: "absolute",
          left: "20px",
          top: "80px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "16px"
        }}
      >
        {!isSidebarOpen && <MenuOutlined />}
      </button>
      {isSidebarOpen && (
        <SidebarContainer>
          <button onClick={()=>{setIsSidebarOpen(false)}} >x</button>
          <SidebarTitle>Learning Pathway</SidebarTitle>
          <SidebarList>
            {steps.map((step, index) => (
              <SidebarListItem key={index}>
                <SidebarLink to={step.link} onClick={() => setIsSidebarOpen(false)}  className={({ isActive }) => (isActive ? "active" : undefined)}>
                  {step.title}
                </SidebarLink>
              </SidebarListItem>
            ))}
          </SidebarList>
          <DividerLine />
          <HelperBox>
            <HelperIcon>
              <BulbOutlined />
            </HelperIcon>
            <HelperText>
              Welcome to the Learning Pathway! Use the sidebar to follow the guide.
              Open the{" "}
              <Link to="/" target="_blank" rel="noopener noreferrer">
                Template Playground
              </Link>{" "}
              in another tab to experiment as you learn.
            </HelperText>
          </HelperBox>
        </SidebarContainer>
      )}
    </>
  );
};

export default Sidebar;
