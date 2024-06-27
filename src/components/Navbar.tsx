import { useState } from "react";
import { Menu, Dropdown, Button, Image, Grid } from "antd";
import {
  GithubOutlined,
  QuestionOutlined,
  UserOutlined,
  InfoOutlined,
  BookOutlined,
  CaretDownFilled,
} from "@ant-design/icons";

const { useBreakpoint } = Grid;

function Navbar({ scrollToExplore }: { scrollToExplore: any }) {
  const [hovered, setHovered] = useState<
    null | "home" | "explore" | "help" | "github"
  >(null);
  const screens = useBreakpoint();

  const menu = (
    <Menu>
      <Menu.ItemGroup title="Info">
        <Menu.Item key="about">
          <a
            href="https://github.com/accordproject/template-playground/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <QuestionOutlined /> About
          </a>
        </Menu.Item>
        <Menu.Item key="community">
          <a
            href="https://discord.com/invite/Zm99SKhhtA"
            target="_blank"
            rel="noopener noreferrer"
          >
            <UserOutlined /> Community
          </a>
        </Menu.Item>
        <Menu.Item key="issues">
          <a
            href="https://github.com/accordproject/template-playground/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            <InfoOutlined /> Issues
          </a>
        </Menu.Item>
      </Menu.ItemGroup>
      <Menu.ItemGroup title="Documentation">
        <Menu.Item key="documentation">
          <a
            href="https://github.com/accordproject/template-engine/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOutlined /> Documentation
          </a>
        </Menu.Item>
      </Menu.ItemGroup>
    </Menu>
  );

  const menuItemStyle = (key: string, isLast: boolean) => ({
    display: "flex",
    alignItems: "center",
    padding: screens.md ? "0 20px" : "0",
    backgroundColor:
      hovered === key ? "rgba(255, 255, 255, 0.1)" : "transparent",
    height: "65px",
    borderRight:
      screens.md && !isLast ? "1.5px solid rgba(255, 255, 255, 0.1)" : "none",
  });

  return (
    <div
      style={{
        background: "#1b2540",
        height: "65px",
        lineHeight: "65px",
        display: "flex",
        alignItems: "center",
        paddingLeft: screens.md ? 40 : 10,
        paddingRight: screens.md ? 40 : 10,
      }}
    >
      <div
        style={{
          cursor: "pointer",
          ...menuItemStyle("home", false),
        }}
        onMouseEnter={() => setHovered("home")}
        onMouseLeave={() => setHovered(null)}
      >
        <a
          href="https://www.accordproject.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center" }}
        >
          <Image
            src={screens.md ? "/logo.png" : "/accord_logo.png"}
            alt="Template Playground"
            preview={false}
            style={{
              paddingRight: screens.md ? "1.5em" : "10px",
              height: "1.625em",
            }}
          />
          <span style={{ color: "white" }}>Template Playground</span>
        </a>
      </div>
      {screens.md && (
        <>
          <div
            style={{
              ...menuItemStyle("explore", false),
              cursor: "pointer",
            }}
            onClick={scrollToExplore}
            onMouseEnter={() => setHovered("explore")}
            onMouseLeave={() => setHovered(null)}
          >
            <span style={{ color: "white" }}>Explore</span>
          </div>
          <div
            style={{
              ...menuItemStyle("help", false),
              cursor: "pointer",
            }}
            onMouseEnter={() => setHovered("help")}
            onMouseLeave={() => setHovered(null)}
          >
            <Dropdown overlay={menu} trigger={["click"]}>
              <Button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "white",
                  height: "65px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Help
                <CaretDownFilled
                  style={{ fontSize: "10px", marginLeft: "5px" }}
                />
              </Button>
            </Dropdown>
          </div>
        </>
      )}
      <div
        style={{
          marginLeft: screens.md ? "auto" : "unset",
          height: "65px",
          display: "flex",
          alignItems: "center",
          borderLeft: screens.md
            ? "1.5px solid rgba(255, 255, 255, 0.1)"
            : "none",
          paddingLeft: screens.md ? "20px" : "0",
          backgroundColor:
            hovered === "github" ? "rgba(255, 255, 255, 0.1)" : "transparent",
          cursor: "pointer",
          position: screens.md ? "relative" : "absolute",
          right: screens.md ? "auto" : "10px",
          paddingRight: screens.md ? 0 : "10px",
        }}
        onMouseEnter={() => setHovered("github")}
        onMouseLeave={() => setHovered(null)}
      >
        <a
          href="https://github.com/accordproject/template-playground"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", color: "white" }}
        >
          <GithubOutlined
            style={{
              fontSize: "20px",
              color: "white",
              marginRight: screens.md ? "5px" : "0",
            }}
          />
          {screens.md && <span>Github</span>}
        </a>
      </div>
    </div>
  );
}

export default Navbar;
