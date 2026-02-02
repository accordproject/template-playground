import React, {useRef, useState, useEffect } from "react";
import { IoCodeSlash, IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { VscOutput } from "react-icons/vsc";
import { FiTerminal, FiShare2, FiSettings } from "react-icons/fi";
import { FaCirclePlay } from "react-icons/fa6";
import useAppStore from "../store/store";
import { message, Tooltip, Switch, Select } from "antd";
import FullScreenModal from "./FullScreenModal";
import tour from "./Tour";
import "../styles/components/PlaygroundSidebar.css";

const PlaygroundSidebar = () => {
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
    backgroundColor,
    toggleDarkMode,
    editorValue,
    editorModelCto,
    editorAgreementData,
    setEditorValue,
    setEditorModelCto,
    setEditorAgreementData,

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
    backgroundColor: state.backgroundColor,
    toggleDarkMode: state.toggleDarkMode,
    editorValue: state.editorValue,
    editorModelCto: state.editorModelCto,
    editorAgreementData: state.editorAgreementData,
    setEditorValue: state.setEditorValue,
    setEditorModelCto: state.setEditorModelCto,
    setEditorAgreementData: state.setEditorAgreementData,
  }));

  const [isSettingOpen, setSettingOpen] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [editorTheme, setEditorTheme] = useState("Light");
  const settingsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      settingsRef.current &&
      !settingsRef.current.contains(event.target as Node)
    ) {
      setSettingOpen(false);
    }
  };

  if (isSettingOpen) {
    document.addEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [isSettingOpen]);


  const isDarkMode = backgroundColor === "#121212";
  const hasRestoredRef = useRef(false);

  
  useEffect(() => {
    if (!autoSave) return;
    if (!hasRestoredRef.current) return;

    const payload = {
      editorValue,
      editorModelCto,
      editorAgreementData,
    };

    localStorage.setItem("playground-data", JSON.stringify(payload));
  }, [editorValue, editorModelCto, editorAgreementData, autoSave]);


  useEffect(() => {
    const saved = localStorage.getItem("playground-data");
    if (!saved) {
      hasRestoredRef.current = true;
      return;
    }

    try {
      const parsed = JSON.parse(saved);

      if (parsed.editorValue) {
        setEditorValue(parsed.editorValue);
        useAppStore.getState().setTemplateMarkdown(parsed.editorValue);
      }

      if (parsed.editorModelCto) {
        setEditorModelCto(parsed.editorModelCto);
        useAppStore.getState().setModelCto(parsed.editorModelCto);
      }

      if (parsed.editorAgreementData) {
        setEditorAgreementData(parsed.editorAgreementData);
        useAppStore.getState().setData(parsed.editorAgreementData);
      }

    } catch (e) {
      console.error("Failed to restore autosave data", e);
  }   finally {
        hasRestoredRef.current = true; 
      }
}, []);


  const handleShare = async () => {
    try {
      const link = generateShareableLink();
      await navigator.clipboard.writeText(link);
      void message.success("Link copied to clipboard!");
    } catch (err) {
      console.error("Error copying to clipboard:", err);
      void message.error("Failed to copy link to clipboard");
    }
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
      void message.info("At least one panel must be visible");
      return;
    }
    setEditorsVisible(!isEditorsVisible);
  };

  const handlePreviewToggle = () => {
    if (isPreviewVisible && !isEditorsVisible) {
      void message.info("At least one panel must be visible");
      return;
    }
    setPreviewVisible(!isPreviewVisible);
  };

  const navTop = [
    {
      title: "Editor",
      icon: IoCodeSlash,
      onClick: handleEditorToggle,
      active: isEditorsVisible,
    },
    {
      title: "Preview",
      icon: VscOutput,
      onClick: handlePreviewToggle,
      active: isPreviewVisible,
    },
    {
      title: "Problems",
      icon: FiTerminal,
      onClick: () => setProblemPanelVisible(!isProblemPanelVisible),
      active: isProblemPanelVisible,
    },
    {
      title: "AI Assistant",
      component: (
        <div className="flex items-center justify-center">
          <div className="relative w-6 h-6">
            <IoChatbubbleEllipsesOutline size={24} />
            <div className="absolute -top-3 -right-3.5 text-[12.5px] font-bold px-1 py-0 rounded bg-white text-transparent bg-gradient-to-r from-[#a78bfa] via-[#ec4899] to-[#ef4444] bg-clip-text shadow-sm">
              AI
            </div>
          </div>
        </div>
      ),
      onClick: () => setAIChatOpen(!isAIChatOpen),
      active: isAIChatOpen,
    },
    {
      title: "Fullscreen",
      component: <FullScreenModal />,
    },
  ];

  const navBottom = [
    {
      title: "Share",
      icon: FiShare2,
      onClick: handleShare,
    },
    {
      title: "Start Tour",
      icon: FaCirclePlay,
      onClick: handleStartTour,
    },
    {
      title: "Settings",
      icon: FiSettings,
      onClick: () => setSettingOpen(!isSettingOpen),
    },
  ];

  return (
    <aside className="playground-sidebar  top-0">
      <nav className="playground-sidebar-nav">
        {navTop.map(({ title, icon: Icon, component, onClick, active }) => (
          <Tooltip key={title} title={title} placement="right">
            <div
              role="button"
              aria-label={title}
              tabIndex={0}
              onClick={onClick}
              className={`group playground-sidebar-nav-item ${
                active
                  ? "playground-sidebar-nav-item-active"
                  : "playground-sidebar-nav-item-inactive"
              }`}
            >
              {component ? component : Icon ? <Icon size={20} /> : null}
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
              className="group playground-sidebar-nav-bottom-item"
            >
              <Icon size={18} />
              <span className="playground-sidebar-nav-item-title">{title}</span>
            </div>
          </Tooltip>
        ))}
      </nav>

      {isSettingOpen && (
        <div  ref={settingsRef} className="absolute bottom-16 left-16 w-64 bg-[#001040] text-white rounded-xl shadow-lg z-50 border border-[#00617c]">
          <h3 className="text-sm font-semibold mb-3 bg-[#013072] p-2 text-center rounded-t-xl">
            Settings
          </h3>

          <div className="flex items-center justify-between mb-3 px-4">
            <span className="text-sm">Dark Mode</span>
            <Switch
            className="bg-[#013072]"
            checked={isDarkMode}
            onChange={(checked) => {
              if (checked !== isDarkMode) toggleDarkMode();
              }}
            />
          </div>

          <div className="flex items-center justify-between mb-3 px-4">
            <span className="text-sm">Auto Save</span>
            <Switch  className="bg-[#013072]" checked={autoSave} onChange={setAutoSave} />
          </div>

          <div className="flex flex-col gap-1 px-4 pb-4">
            <span className="text-sm">Editor Theme</span>
            <Select
              value={editorTheme}
              onChange={(value) => {setEditorTheme(value);
                if (value === "Dark" && !isDarkMode) {toggleDarkMode();}
                if (value === "Light" && isDarkMode) {toggleDarkMode();}
              }}
              className="w-full"
              options={[
                { value: "Light", label: "Light" },
                { value: "Dark", label: "Dark" },
              ]}
            />
          </div>
        </div>
      )}
    </aside>
  );
};

export default PlaygroundSidebar;
