import React from "react";
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
import { BulbOutlined } from "@ant-design/icons";
import { useState , useEffect } from "react";
import { Collapse } from "antd";





const Sidebar: React.FC<{ steps: { title: string; link: string }[] }> = ({
  steps,
}) => {

  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (


    <>
    {isMobile ? (    <Collapse>
     <Collapse.Panel key={"1"} header={""}>

    <SidebarContainer >
    
  
      <SidebarList>
      <SidebarTitle>Learning Pathway</SidebarTitle>
        {steps.map((step, index) => (
          <SidebarListItem key={index}>
            <SidebarLink
              to={step.link}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
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

    </Collapse.Panel>
    </Collapse>) : (    

    <SidebarContainer >
    
  
      <SidebarList>
      <SidebarTitle>Learning Pathway</SidebarTitle>
        {steps.map((step, index) => (
          <SidebarListItem key={index}>
            <SidebarLink
              to={step.link}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
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


