import React from "react";
import { IoCodeSlash } from "react-icons/io5";
import { VscOutput } from "react-icons/vsc";
import { FiTerminal, FiShare2, FiSettings, FiCpu } from "react-icons/fi";
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
    setEditorsVisible,
    setPreviewVisible,
    setProblemPanelVisible,
    setLogicPanelVisible,
    setAIChatOpen,
    generateShareableLink,
    setSettingsOpen,
  } = useAppStore((state) => ({
    isEditorsVisible: state.isEditorsVisible,
    isPreviewVisible: state.isPreviewVisible,
    isProblemPanelVisible: state.isProblemPanelVisible,
    isLogicPanelVisible: state.isLogicPanelVisible,
    isLogicFeatureEnabled: state.isLogicFeatureEnabled,
    isAIChatOpen: state.isAIChatOpen,
    setEditorsVisible: state.setEditorsVisible,
    setPreviewVisible: state.setPreviewVisible,
    setProblemPanelVisible: state.setProblemPanelVisible,
    setLogicPanelVisible: state.setLogicPanelVisible,
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
    if (isEditorsVisible && !isPreviewVisible && !isLogicActive) {
      void message.info('At least one panel must be visible');
      return;
    }
    setEditorsVisible(!isEditorsVisible);
  };

  const handlePreviewToggle = () => {
    if (isPreviewVisible && !isEditorsVisible && !isLogicActive) {
      void message.info('At least one panel must be visible');
      return;
    }
    setPreviewVisible(!isPreviewVisible);
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
        if (isLogicPanelVisible && !isEditorsVisible && !isPreviewVisible) {
          void message.info('At least one panel must be visible');
          return;
        }
        setLogicPanelVisible(!isLogicPanelVisible);
      },
      active: isLogicPanelVisible
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 24, height: 24 }}>
            <IoChatbubbleEllipsesOutline size={24} />
            <div
              className="absolute -top-3 -right-3.5 text-[12.5px] font-bold px-1 py-0 rounded bg-white text-transparent bg-gradient-to-r from-[#a78bfa] via-[#ec4899] to-[#ef4444] bg-clip-text shadow-sm"
              style={{
                WebkitBackgroundClip: "text",
                position: 'absolute',
                top: -12,
                right: -14,
                fontSize: '12.5px',
                fontWeight: 'bold',
                padding: '0 4px',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: 'transparent',
                backgroundImage: 'linear-gradient(to right, #a78bfa, #ec4899, #ef4444)',
                backgroundClip: 'text',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
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
            className={`group playground-sidebar-nav-item ${
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
            className={`group playground-sidebar-nav-bottom-item tour-${title.toLowerCase().replace(' ', '-')}`}
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
