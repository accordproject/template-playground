import { useState, useCallback } from "react";
import { useSpring, animated } from "react-spring";
import { useLocation, Link } from "react-router-dom";
import {
  GithubOutlined,
  QuestionOutlined,
  UserOutlined,
  InfoOutlined,
  BookOutlined,
  CaretDownFilled,
  MenuOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { FaDiscord } from 'react-icons/fa';
import {
  message,
  Modal,
  Layout,
  Dropdown,
  Button,
  Image,
  Grid,
  Typography,
  Space,
  theme,
  type MenuProps,
} from "antd";
import useAppStore from "../store/store";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

const { Header } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

function Navbar() {
  const [hovered, setHovered] = useState<
    null | "home" | "help" | "samples" | "github" | "discord" | "join"
  >(null);
  const screens = useBreakpoint();
  const location = useLocation();
  const { token } = theme.useToken();

  const {
    samples,
    loadSample,
    sampleName,
    editorValue,
    editorModelCto,
    editorAgreementData,
    editorLogicTs,
    isLogicFeatureEnabled,
  } = useStoreWithEqualityFn(
    useAppStore,
    (state) => ({
      samples: state.samples,
      loadSample: state.loadSample as (key: string) => Promise<void>,
      sampleName: state.sampleName,
      editorValue: state.editorValue,
      editorModelCto: state.editorModelCto,
      editorAgreementData: state.editorAgreementData,
      editorLogicTs: state.editorLogicTs,
      isLogicFeatureEnabled: state.isLogicFeatureEnabled,
    }),
    shallow
  );

  const performLoadSample = useCallback(
    async (name: string) => {
      try {
        await loadSample(name);
        void message.info(`Loaded ${name} sample`);
      } catch {
        void message.error("Failed to load sample");
      }
    },
    [loadSample]
  );

  const handleSampleClick = useCallback(
    (name: string) => {
      const currentSample = samples.find((s) => s.NAME === sampleName);
      const hasUnsavedChanges =
        !currentSample ||
        editorValue !== currentSample.TEMPLATE ||
        editorModelCto !== currentSample.MODEL ||
        editorAgreementData !== JSON.stringify(currentSample.DATA, null, 2) ||
        editorLogicTs !== (currentSample.LOGIC ?? "");

      if (hasUnsavedChanges) {
        Modal.confirm({
          title: "Load Sample Template",
          icon: <ExclamationCircleOutlined />,
          content: isLogicFeatureEnabled
            ? "Loading a new sample will replace your current Concerto Model, TemplateMark, JSON Data, and Logic. Any unsaved changes will be lost. Do you want to continue?"
            : "Loading a new sample will replace your current Concerto Model, TemplateMark, and JSON Data. Any unsaved changes will be lost. Do you want to continue?",
          okText: "Continue",
          cancelText: "Cancel",
          maskClosable: true,
          /*
           * Fire and forget: returning the promise would keep the modal open
           * until the sample has fully rendered, which can take a while on a
           * slow network (and now includes a sandbox worker restart, since the
           * abandoned edits may contain formula code). The dialog's job is the
           * confirmation; progress and errors surface via the preview and the
           * message toasts in performLoadSample.
           */
          onOk: () => {
            void performLoadSample(name);
          },
        });
      } else {
        void performLoadSample(name);
      }
    },
    [
      performLoadSample,
      samples,
      sampleName,
      editorValue,
      editorModelCto,
      editorAgreementData,
      editorLogicTs,
      isLogicFeatureEnabled,
    ]
  );

  const props = useSpring({
    loop: true,
    from: { opacity: 0.5, boxShadow: "0px 0px 0px rgba(255, 255, 255, 0)" },
    to: [
      { opacity: 1, boxShadow: "0px 0px 5px rgba(255, 255, 255, 1)" },
      { opacity: 0.9, boxShadow: "0px 0px 0px rgba(255, 255, 255, 0)" },
    ],
    config: { duration: 1000 },
  });

  const samplesMenuItems: MenuProps["items"] = [
    {
      key: "samples-group",
      type: "group",
      label: "Load Sample",
      children: samples?.map((s) => ({
        key: s.NAME,
        icon: <FileTextOutlined />,
        label: s.NAME,
        onClick: () => void handleSampleClick(s.NAME),
      })),
    },
  ];

  const helpMenuItems: MenuProps["items"] = [
    {
      key: "info-group",
      type: "group",
      label: "Info",
      children: [
        {
          key: "about",
          icon: <QuestionOutlined />,
          label: (
            <a
              href="https://github.com/accordproject/template-playground/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              About
            </a>
          ),
        },
        {
          key: "community",
          icon: <UserOutlined />,
          label: (
            <a
              href="https://discord.com/invite/Zm99SKhhtA"
              target="_blank"
              rel="noopener noreferrer"
            >
              Community
            </a>
          ),
        },
        {
          key: "issues",
          icon: <InfoOutlined />,
          label: (
            <a
              href="https://github.com/accordproject/template-playground/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              Issues
            </a>
          ),
        },
      ],
    },
    {
      key: "docs-group",
      type: "group",
      label: "Documentation",
      children: [
        {
          key: "documentation",
          icon: <BookOutlined />,
          label: (
            <a
              href="https://github.com/accordproject/template-engine/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </a>
          ),
        },
      ],
    },
  ];

  const mobileMenuItems: MenuProps["items"] = [
    {
      key: "home",
      label: <Link to="/">Template Playground</Link>,
    },
    {
      key: "samples-group",
      type: "group",
      label: "Samples",
      children: samples?.map((s) => ({
        key: s.NAME,
        icon: <FileTextOutlined />,
        label: s.NAME,
        onClick: () => void handleSampleClick(s.NAME),
      })),
    },
    {
      key: "about",
      icon: <QuestionOutlined />,
      label: (
        <a
          href="https://github.com/accordproject/template-playground/blob/main/README.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          About
        </a>
      ),
    },
    {
      key: "community",
      icon: <UserOutlined />,
      label: (
        <a
          href="https://discord.com/invite/Zm99SKhhtA"
          target="_blank"
          rel="noopener noreferrer"
        >
          Community
        </a>
      ),
    },
    {
      key: "issues",
      icon: <InfoOutlined />,
      label: (
        <a
          href="https://github.com/accordproject/template-playground/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          Issues
        </a>
      ),
    },
    {
      key: "documentation",
      icon: <BookOutlined />,
      label: (
        <a
          href="https://github.com/accordproject/template-engine/blob/main/README.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          Documentation
        </a>
      ),
    },
  ];

  const isLearnPage = location.pathname.startsWith("/learn");

  return (
    <Header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        height: 64,
        lineHeight: "64px",
        display: "flex",
        alignItems: "center",
        padding: screens.lg ? "0 40px" : "0 10px",
      }}
    >
      <div
        style={{
          cursor: "pointer",
          height: 64,
          display: "flex",
          alignItems: "center",
          padding: screens.md ? "0 20px" : "0",
          backgroundColor:
            hovered === "home" ? "rgba(255, 255, 255, 0.1)" : "transparent",
          borderRight: screens.md
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : undefined,
        }}
        onMouseEnter={() => setHovered("home")}
        onMouseLeave={() => setHovered(null)}
      >
        <Link
          to="/"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center" }}
        >
          <Image
            src={screens.lg ? "/logo.png" : "/accord_logo.png"}
            alt="Template Playground"
            preview={false}
            style={{
              height: 26,
              paddingRight: screens.lg ? 8 : 2,
              maxWidth: screens.lg ? 185 : 37,
            }}
          />
          <Text
            style={{
              color: "#ffffff",
              display: screens.lg === false ? "none" : "inline",
            }}
          >
            Template Playground
          </Text>
        </Link>
      </div>

      {screens.md ? (
        <>
          <div
            className="samples-element"
            style={{
              cursor: "pointer",
              height: 64,
              display: "flex",
              alignItems: "center",
              padding: screens.md ? "0 20px" : "0",
              backgroundColor:
                hovered === "samples"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "transparent",
              borderRight: screens.md
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : undefined,
            }}
            onMouseEnter={() => setHovered("samples")}
            onMouseLeave={() => setHovered(null)}
          >
            <Dropdown menu={{ items: samplesMenuItems }} trigger={["click"]}>
              <Button
                type="text"
                style={{
                  color: "#ffffff",
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                <Space size={6}>
                  <span>Samples{sampleName ? `: ${sampleName}` : ""}</span>
                  <CaretDownFilled style={{ fontSize: 12 }} />
                </Space>
              </Button>
            </Dropdown>
          </div>
          <div
            style={{
              cursor: "pointer",
              height: 64,
              display: "flex",
              alignItems: "center",
              padding: screens.md ? "0 20px" : "0",
              backgroundColor:
                hovered === "help"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "transparent",
              borderRight: screens.md
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : undefined,
            }}
            onMouseEnter={() => setHovered("help")}
            onMouseLeave={() => setHovered(null)}
          >
            <Dropdown menu={{ items: helpMenuItems }} trigger={["click"]}>
              <Button
                type="text"
                style={{
                  color: "#ffffff",
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                <Space size={6}>
                  <span>Help</span>
                  <CaretDownFilled style={{ fontSize: 12 }} />
                </Space>
              </Button>
            </Dropdown>
          </div>
        </>
      ) : (
        <div style={{ marginLeft: 6 }}>
          <Dropdown menu={{ items: mobileMenuItems }} trigger={["click"]}>
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 20, color: "#ffffff" }} />}
              style={{
                height: 64,
                display: "flex",
                alignItems: "center",
              }}
            />
          </Dropdown>
        </div>
      )}

      <Space
        align="center"
        style={{ marginLeft: "auto", height: 64 }}
        size={screens.md ? 20 : 10}
      >
        {!isLearnPage && (
          <div
            style={{
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              borderRadius: 6,
              boxShadow:
                hovered === "join"
                  ? "0 0 10px 10px rgba(255,255,255,0.1)"
                  : undefined,
            }}
            onMouseEnter={() => setHovered("join")}
            onMouseLeave={() => setHovered(null)}
          >
            <Link to="/learn/intro" className="learnNow-button">
              <animated.button
                style={{
                  ...props,
                  backgroundColor: token.colorPrimary,
                  color: token.colorTextLightSolid || "#ffffff",
                  padding: "10px 22px",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Learn
              </animated.button>
            </Link>
          </div>
        )}

        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            cursor: "pointer",
            padding: screens.md ? "0 16px" : "0 6px",
            borderLeft: screens.md
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : undefined,
            backgroundColor:
              hovered === "discord"
                ? "rgba(255, 255, 255, 0.1)"
                : "transparent",
          }}
          onMouseEnter={() => setHovered("discord")}
          onMouseLeave={() => setHovered(null)}
        >
          <a
            href="https://discord.com/invite/Zm99SKhhtA"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Discord"
            style={{
              display: "flex",
              alignItems: "center",
              color: "#ffffff",
              gap: screens.md ? 6 : 0,
            }}
          >
            <FaDiscord style={{ fontSize: 20, color: "#ffffff" }} />
            {screens.md && <span>Discord</span>}
          </a>
        </div>

        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            cursor: "pointer",
            padding: screens.md ? "0 16px" : "0 6px",
            borderLeft: screens.md
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : undefined,
            backgroundColor:
              hovered === "github"
                ? "rgba(255, 255, 255, 0.1)"
                : "transparent",
          }}
          onMouseEnter={() => setHovered("github")}
          onMouseLeave={() => setHovered(null)}
        >
          <a
            href="https://github.com/accordproject/template-playground"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            style={{
              display: "flex",
              alignItems: "center",
              color: "#ffffff",
              gap: screens.md ? 6 : 0,
            }}
          >
            <GithubOutlined style={{ fontSize: 20, color: "#ffffff" }} />
            {screens.md && <span>GitHub</span>}
          </a>
        </div>
      </Space>
    </Header>
  );
}

export default Navbar;
