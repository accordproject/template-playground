import React from "react";
import { useTranslation } from 'react-i18next';
import { IoCodeSlash } from "react-icons/io5";
import { VscOutput } from "react-icons/vsc";
import { FiTerminal, FiShare2, FiSettings } from "react-icons/fi";
import { FaCirclePlay } from "react-icons/fa6";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import useAppStore from "../store/store";
import { message, Tooltip } from "antd";
import FullScreenModal from "./FullScreenModal";
import SettingsModal from "./SettingsModal";
import tour from "./Tour";
import "../styles/components/PlaygroundSidebar.css";

const PlaygroundSidebar = () => {
  const { t } = useTranslation();
  const {
    isEditorsVisible,
    isPreviewVisible,
    isProblemPanelVisible,
    isAIChatOpen,
    setEditorsVisible,
    setPreviewVisible,
    setProblemPanelVisible,
    setAIChatOpen,
    generateShareableLink,
    setSettingsOpen,
  } = useAppStore((state) => ({
    isEditorsVisible: state.isEditorsVisible,
    isPreviewVisible: state.isPreviewVisible,
    isProblemPanelVisible: state.isProblemPanelVisible,
    isAIChatOpen: state.isAIChatOpen,
    setEditorsVisible: state.setEditorsVisible,
    setPreviewVisible: state.setPreviewVisible,
    setProblemPanelVisible: state.setProblemPanelVisible,
    setAIChatOpen: state.setAIChatOpen,
    generateShareableLink: state.generateShareableLink,
    setSettingsOpen: state.setSettingsOpen,
  }));

  const handleShare = async () => {
    try {
      const link = generateShareableLink();
      await navigator.clipboard.writeText(link);
      void message.success(t('sidebar.linkCopied'));
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      void message.error(t('sidebar.linkCopyFailed'));
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

  const handleEditorToggle = () => {
    if (isEditorsVisible && !isPreviewVisible) {
      void message.info(t('sidebar.panelWarning'));
      return;
    }
    setEditorsVisible(!isEditorsVisible);
  };

  const handlePreviewToggle = () => {
    if (isPreviewVisible && !isEditorsVisible) {
      void message.info(t('sidebar.panelWarning'));
      return;
    }
    setPreviewVisible(!isPreviewVisible);
  };

  interface NavItem {
    title: string;
    tourKey: string;
    icon?: React.ComponentType<{ size: number }>;
    component?: React.ReactNode;
    onClick?: () => void;
    active?: boolean;
  }

  const navTop: NavItem[] = [
    {
      title: t('sidebar.editor'),
      tourKey: 'editor',
      icon: IoCodeSlash,
      onClick: handleEditorToggle,
      active: isEditorsVisible
    },
    {
      title: t('sidebar.preview'),
      tourKey: 'preview',
      icon: VscOutput,
      onClick: handlePreviewToggle,
      active: isPreviewVisible
    },
    {
      title: t('sidebar.problems'),
      tourKey: 'problems',
      icon: FiTerminal,
      onClick: () => setProblemPanelVisible(!isProblemPanelVisible),
      active: isProblemPanelVisible
    },
    {
      title: t('sidebar.aiAssistant'),
      tourKey: 'ai-assistant',
      component: (
        <div className="flex items-center justify-center">
          <div className="relative w-6 h-6">
            <IoChatbubbleEllipsesOutline size={24} />
            <div
              className="absolute -top-3 -right-3.5 text-[12.5px] font-bold px-1 py-0 rounded bg-white text-transparent bg-gradient-to-r from-[#a78bfa] via-[#ec4899] to-[#ef4444] bg-clip-text shadow-sm"
              style={{
                WebkitBackgroundClip: "text"
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
      title: t('sidebar.fullscreen'),
      tourKey: 'fullscreen',
      component: <FullScreenModal />
    },
  ];

  interface NavBottomItem {
    title: string;
    tourKey: string;
    icon: React.ComponentType<{ size: number }>;
    onClick: () => void;
  }

  const navBottom: NavBottomItem[] = [
    {
      title: t('sidebar.share'),
      tourKey: 'share',
      icon: FiShare2,
      onClick: () => void handleShare()
    },
    {
      title: t('sidebar.startTour'),
      tourKey: 'start-tour',
      icon: FaCirclePlay,
      onClick: () => void handleStartTour()
    },
    {
      title: t('sidebar.settings'),
      tourKey: 'settings',
      icon: FiSettings,
      onClick: handleSettings
    },
  ];

  return [
    <aside key="sidebar" className="playground-sidebar">
      <nav className="playground-sidebar-nav">
        {navTop.map(({ title, tourKey, icon: Icon, component, onClick, active }) => (
          <Tooltip key={tourKey} title={title} placement="right">
            <div
              role="button"
              aria-label={title}
              tabIndex={0}
              onClick={onClick}
              className={`group playground-sidebar-nav-item ${active ? 'playground-sidebar-nav-item-active' : 'playground-sidebar-nav-item-inactive'
                } tour-${tourKey}`}
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
        {navBottom.map(({ title, tourKey, icon: Icon, onClick }) => (
          <Tooltip key={tourKey} title={title} placement="right">
            <div
              role="button"
              aria-label={title}
              tabIndex={0}
              onClick={onClick}
              className={`group playground-sidebar-nav-bottom-item tour-${tourKey}`}
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
