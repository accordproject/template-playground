"use client"

import type React from "react"
import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import { LearnNowContainer, SidebarContainer, ContentContainer } from "../styles/pages/LearnNow"
import { steps } from "../constants/learningSteps/steps"

const LearnNow: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <LearnNowContainer>
      <SidebarContainer isOpen={isSidebarOpen}>
        <Sidebar steps={steps} isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      </SidebarContainer>
      <ContentContainer isSidebarOpen={isSidebarOpen}>
        <Outlet />
      </ContentContainer>
    </LearnNowContainer>
  )
}

export default LearnNow
