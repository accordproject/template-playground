import React, {useState, useEffect} from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { LearnNowContainer} from "../styles/pages/LearnNow";
import { steps } from "../constants/learningSteps/steps";

const LearnNow: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  let lastScrollY = 0;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  }
  return (
    <LearnNowContainer>
    {!isSidebarOpen && ( 
      <div className={`hamburger-menu ${isVisible ? "" : "hamburger-hidden"}`} onClick={toggleSidebar}>
        &#9776;
      </div>
    )}
        <Sidebar steps={steps} isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <Outlet />
    </LearnNowContainer>
  );
};

export default LearnNow;
