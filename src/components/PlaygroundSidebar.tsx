import React from "react";
import { IoCodeSlash } from "react-icons/io5";
import { VscOutput } from "react-icons/vsc";
import { FiTerminal, FiShare2, FiSettings, FiCpu, FiPlayCircle } from "react-icons/fi";
import { FaCirclePlay } from "react-icons/fa6";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import useAppStore from "../store/store";
import { message, Tooltip } from "antd";
import FullScreenModal from "./FullScreenModal";
import SettingsModal from "./SettingsModal";
import tour from "./Tour";
import "../styles/components/PlaygroundSidebar.css";

const PlaygroundSidebar = () => {
  const { 
    isEditorsVisible,
    isPreviewVisible,
    isProblemPanelVisible,
    isLogicPanelVisible,
    isLogicFeatureEnabled,
    isAIChatOpen,
    isRunnerVisible,
    setEditorsVisible,
    setPreviewVisible,
    setProblemPanelVisible,
    setLogicPanelVisible,
    setRunnerVisible,
    setAIChatOpen,
    generateShareableLink,
    setSettingsOpen,
  } = useAppStore((state) => ({
    isEditorsVisible: state.isEditorsVisible,
    isPreviewVisible: state.isPreviewVisible,
    isProblemPanelVisible: state.isProblemPanelVisible,
    isLogicPanelVisible: state.isLogicPanelVisible,
    isRunnerVisible: state.isRunnerVisible,
    isLogicFeatureEnabled: state.isLogicFeatureEnabled,
    isAIChatOpen: state.isAIChatOpen,
    setEditorsVisible: state.setEditorsVisible,
    setPreviewVisible: state.setPreviewVisible,
    setProblemPanelVisible: state.setProblemPanelVisible,
    setLogicPanelVisible: state.setLogicPanelVisible,
    setRunnerVisible: state.setRunnerVisible,
    setAIChatOpen: state.setAIChatOpen,
    generateShareableLink: state.generateShareableLink,
    setSettingsOpen: state.setSettingsOpen,
  }));

  const hasLogicContent = useAppStore((s) => {
    const sampleHasLogic = !!s.samples.find((sample) => sample.NAME === s.sampleName)?.LOGIC;
    return sampleHasLogic || s.logicTs.trim().length > 0 || s.editorLogicTs.trim().length > 0;
  });

  const handleShare = async () => {
    try {
      const link = generateShareableLink();
      await navigator.clipboard.writeText(link);
      void message.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      void message.error('Failed to copy link to clipboard');
    }
  };

  const handleSettings = () => {
    setSettingsOpen(true);
  };

  const handleStartTour = async () => {
    try {
      await tour.start();
      localStorage.setItem("hasVisited", "true");
    } catch (error) {
      console.error("Tour failed to start:", error);
    }
  };

  const isLogicActive = isLogicPanelVisible && isLogicFeatureEnabled && hasLogicContent;

  const handleEditorToggle = () => {
    if (isEditorsVisible && !isPreviewVisible && !isLogicActive && !isRunnerVisible) {
      void message.info('At least one panel must be visible');
      return;
    }
    setEditorsVisible(!isEditorsVisible);
  };

  const handlePreviewToggle = () => {
    if (isPreviewVisible && !isEditorsVisible && !isLogicActive && !isRunnerVisible) {
      void message.info('At least one panel must be visible');
      return;
    }
    setPreviewVisible(!isPreviewVisible);
  };

  const handleRunnerToggle = () => {
    if (isRunnerVisible && !isEditorsVisible && !isPreviewVisible && !isLogicActive) {
      void message.info('At least one panel must be visible');
      return;
    }
    setRunnerVisible(!isRunnerVisible);
  };

  interface NavItem {
    title: string;
    icon?: React.ComponentType<{ size: number }>;
    component?: React.ReactNode;
    onClick?: () => void;
    active?: boolean;
  }

  const navTop: NavItem[] = [
    { 
      title: "Editor", 
      icon: IoCodeSlash, 
      onClick: handleEditorToggle,
      active: isEditorsVisible
    },
    ...(isLogicFeatureEnabled && hasLogicContent ? [{
      title: "Logic", 
      icon: FiCpu,
      onClick: () => {
        if (isLogicPanelVisible && !isEditorsVisible && !isPreviewVisible && !isRunnerVisible) {
          void message.info('At least one panel must be visible');
          return;
        }
        setLogicPanelVisible(!isLogicPanelVisible);
      },
      active: isLogicPanelVisible
    }] : []),
    ...(isLogicFeatureEnabled && hasLogicContent ? [{
      title: "Runner",
      icon: FiPlayCircle,
      onClick: handleRunnerToggle,
      active: isRunnerVisible
    }] : []),
    { 
      title: "Preview", 
      icon: VscOutput,
      onClick: handlePreviewToggle,
      active: isPreviewVisible
    },
    { 
      title: "Problems", 
      icon: FiTerminal,
      onClick: () => setProblemPanelVisible(!isProblemPanelVisible),
      active: isProblemPanelVisible
    },
    {
      title: "AI Assistant",
      component: (
        <div className="playground-sidebar-ai-badge-container">
          <div className="playground-sidebar-ai-badge-wrapper">
            <IoChatbubbleEllipsesOutline size={24} />
            <div className="playground-sidebar-ai-badge-text">
              AI
            </div>
          </div>
        </div>
      ),
      onClick: () => setAIChatOpen(!isAIChatOpen),
      active: isAIChatOpen
    },
    { 
      title: "Fullscreen", 
      component: <FullScreenModal />
    },
  ];

  interface NavBottomItem {
    title: string;
    icon: React.ComponentType<{ size: number }>;
    onClick: () => void;
  }

  const navBottom: NavBottomItem[] = [
    { 
      title: "Share", 
      icon: FiShare2,
      onClick: () => void handleShare()
    },
    { 
      title: "Start Tour", 
      icon: FaCirclePlay,
      onClick: () => void handleStartTour()
    },
    { 
      title: "Settings", 
      icon: FiSettings,
      onClick: handleSettings
    },
  ];

  return [
    <aside key="sidebar" className="playground-sidebar">
      <nav className="playground-sidebar-nav">
        {navTop.map(({ title, icon: Icon, component, onClick, active }) => (
          <Tooltip key={title} title={title} placement="right">
          <div
            role="button"
            aria-label={title}
            tabIndex={0}
            onClick={onClick}
            className={`playground-sidebar-nav-item ${
              active ? 'playground-sidebar-nav-item-active' : 'playground-sidebar-nav-item-inactive'
            } tour-${title.toLowerCase().replace(' ', '-')}`}
          >
            {component ? (
              <div className="playground-sidebar-nav-item-icon-container">
                {component}
              </div>
            ) : Icon ? (
              <Icon size={20} />
            ) : null}
            <span className="playground-sidebar-nav-item-title">{title}</span>
          </div>
          </Tooltip>
        ))}
      </nav>

      <nav className="playground-sidebar-nav-bottom">
        {navBottom.map(({ title, icon: Icon, onClick }) => (
          <Tooltip key={title} title={title} placement="right">
          <div
            role="button"
            aria-label={title}
            tabIndex={0}
            onClick={onClick}
            className={`playground-sidebar-nav-bottom-item tour-${title.toLowerCase().replace(' ', '-')}`}
          >
            <Icon size={18} />
            <span className="playground-sidebar-nav-item-title">{title}</span>
          </div>
          </Tooltip>
        ))}
      </nav>
    </aside>,
    <SettingsModal key="settings-modal" />
  ];
};

export default PlaygroundSidebar;
