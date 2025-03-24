"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
import { App as AntdApp, Layout, Row, Col, Collapse } from "antd";
import { Routes, Route, useSearchParams } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import tour from "./components/Tour";
import AgreementData from "./editors/editorsContainer/AgreementData";
import LearnNow from "./pages/LearnNow";
import AgreementHtml from "./AgreementHtml";
import Errors from "./utils/helpers/Errors";
import TemplateMarkdown from "./editors/editorsContainer/TemplateMarkdown";
import TemplateModel from "./editors/editorsContainer/TemplateModel";
import useAppStore from "./store/store";
import SampleDropdown from "./components/SampleDropdown";
import UseShare from "./components/UseShare";
import LearnContent from "./components/Content";
import FloatingFAB from "./components/FabButton";
import { useMediaQuery } from "./hooks/use-mobile";

const { Content } = Layout;

const App = () => {
  const init = useAppStore((state) => state.init);
  const loadFromLink = useAppStore((state) => state.loadFromLink);
  const backgroundColor = useAppStore((state) => state.backgroundColor);
  const textColor = useAppStore((state) => state.textColor);
  const [activePanel, setActivePanel] = useState<string | string[]>();
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  // Split pane state
  const [leftPanelWidth, setLeftPanelWidth] = useState(66); // 66% matches 16/24 col ratio
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 576px)"); // sm breakpoint in Ant Design

  const scrollToFooter = () => {
    const exploreContent = document.getElementById("footer");
    if (exploreContent) {
      exploreContent.scrollIntoView({ behavior: "smooth" });
    }
  };

  const onChange = (key: string | string[]) => {
    setActivePanel(key);
  };

  // Split pane event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth =
      ((e.clientX - containerRect.left) / containerRect.width) * 100;

    // Limit the resize between 30% and 80%
    if (newLeftWidth >= 30 && newLeftWidth <= 80) {
      setLeftPanelWidth(newLeftWidth);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !containerRef.current || !e.touches[0]) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth =
      ((e.touches[0].clientX - containerRect.left) / containerRect.width) * 100;

    // Limit the resize between 30% and 80%
    if (newLeftWidth >= 30 && newLeftWidth <= 80) {
      setLeftPanelWidth(newLeftWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add event listeners for resize
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await init();
        const compressedData = searchParams.get("data");
        if (compressedData) {
          await loadFromLink(compressedData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    void initializeApp();

    // DarkMode Styles
    const style = document.createElement("style");
    style.innerHTML = `
  .ant-collapse-header {
    color: ${textColor} !important;
  }
  .ant-collapse-content {
    background-color: ${backgroundColor} !important;
  }
  .ant-collapse-content-active {
    background-color: ${backgroundColor} !important;
  }
  
  /* Split pane styles */
  .split-pane-resizer {
    cursor: col-resize;
    background-color: #f0f0f0;
    position: relative;
    z-index: 10;
    transition: background-color 0.2s;
    height: 100%;
  }
  
  .split-pane-resizer:hover, .split-pane-resizer.dragging {
    background-color: #d9d9d9;
  }
  
  .split-pane-resizer-line {
    background-color: #d9d9d9;
    height: 100% !important;
    width: 2px;
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }

  .split-pane-resizer:hover .split-pane-resizer-line,
  .split-pane-resizer.dragging .split-pane-resizer-line {
    background-color: #1890ff;
  }
`;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [init, loadFromLink, searchParams, textColor, backgroundColor]);

  useEffect(() => {
    const startTour = async () => {
      try {
        await tour.start();
      } catch (error) {
        console.error("Tour failed to start:", error);
      }
    };

    const showTour = searchParams.get("showTour") === "true";

    if (showTour || !localStorage.getItem("hasVisited")) {
      void startTour();
      localStorage.setItem("hasVisited", "true");
    }
  }, [searchParams]);

  const panels = [
    {
      key: "templateMark",
      label: "TemplateMark",
      children: <TemplateMarkdown />,
    },
    {
      key: "model",
      label: "Concerto Model",
      children: <TemplateModel />,
    },
    {
      key: "data",
      label: "Preview Data",
      children: <AgreementData />,
    },
  ];

  return (
    <AntdApp>
      <Layout style={{ minHeight: "100vh" }}>
        <Navbar scrollToFooter={scrollToFooter} />
        <Content>
          <Routes>
            <Route
              path="/"
              element={
                <div
                  style={{
                    padding: 24,
                    paddingBottom: 150,
                    minHeight: 360,
                    background: backgroundColor,
                  }}
                >
                  <Row>
                    <Col xs={24} sm={8}>
                      <Row
                        style={{
                          marginLeft: "25px",
                          display: "flex",
                          flexDirection: "row",
                          gap: "10px",
                        }}
                      >
                        <SampleDropdown setLoading={setLoading} />
                        <UseShare />
                      </Row>
                    </Col>
                    <Col span={18}>
                      <Errors />
                    </Col>
                  </Row>
                  <div
                    style={{
                      padding: 24,
                      minHeight: 360,
                      background: backgroundColor,
                    }}
                  >
                    {/* On mobile, use the original layout */}
                    {isMobile ? (
                      <Row gutter={24}>
                        <Col xs={24} style={{ paddingBottom: "20px" }}>
                          <Collapse
                            defaultActiveKey={activePanel}
                            onChange={onChange}
                            items={panels}
                          />
                        </Col>
                        <Col xs={24}>
                          <div style={{ marginBottom: "10px" }}></div>
                          <AgreementHtml loading={loading} isModal={false} />
                        </Col>
                      </Row>
                    ) : (
                      // On desktop, use the resizable split pane
                      <div
                        ref={containerRef}
                        style={{
                          display: "flex",
                          position: "relative",
                          width: "100%",
                          gap: "0px",
                          minHeight: "300px", // Ensure minimum height
                          height: "auto",
                        }}
                      >
                        {/* Left panel */}
                        <div style={{ width: `${leftPanelWidth}%` }}>
                          <Collapse
                            defaultActiveKey={activePanel}
                            onChange={onChange}
                            items={panels}
                          />
                        </div>

                        {/* Resizer */}
                        <div
                          className={`split-pane-resizer ${
                            isDragging ? "dragging" : ""
                          }`}
                          style={{
                            width: "12px",
                            margin: "0 6px",
                            height: "100%",
                            minHeight: "100vh", // Ensure minimum height
                          }}
                          onMouseDown={handleMouseDown}
                          onTouchStart={handleTouchStart}
                        >
                          {/* <div
                            className="split-pane-resizer-line"
                            style={{
                              width: "2px",
                              height: "100%", // Full height
                            }}
                          ></div> */}
                          {/* Add drag indicator dots */}
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "3px",
                              zIndex: 2,
                            }}
                          >
                            <div
                              style={{
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                backgroundColor: "#888",
                              }}
                            ></div>
                            <div
                              style={{
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                backgroundColor: "#888",
                              }}
                            ></div>
                            <div
                              style={{
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Right panel */}
                        <div style={{ width: `${100 - leftPanelWidth - 2}%` }}>
                          <div style={{ marginBottom: "10px" }}></div>
                          <AgreementHtml loading={loading} isModal={false} />
                        </div>
                      </div>
                    )}
                  </div>
                  <FloatingFAB />
                </div>
              }
            />

            <Route path="/learn" element={<LearnNow />}>
              {/* ❕ learning-module routes */}
              <Route path="intro" element={<LearnContent file="intro.md" />} />
              <Route
                path="module1"
                element={<LearnContent file="module1.md" />}
              />
              <Route
                path="module2"
                element={<LearnContent file="module2.md" />}
              />

              <Route
                path="module3"
                element={<LearnContent file="module3.md" />}
              />
            </Route>
          </Routes>
        </Content>
        <Footer />
      </Layout>
    </AntdApp>
  );
};

export default App;
