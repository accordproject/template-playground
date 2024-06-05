import { useState } from "react";
import { Menu, Dropdown, Button, Image } from "antd";
import {
  GithubOutlined,
  QuestionOutlined,
  UserOutlined,
  InfoOutlined,
  BookOutlined,
  CaretDownFilled,
} from "@ant-design/icons";

function Navbar({ scrollToExplore }: { scrollToExplore: any }) {
  const [hovered, setHovered] = useState<
    null | "home" | "explore" | "help" | "github"
  >(null);

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

  const menuItemStyle = (key: any) => ({
    display: "flex",
    alignItems: "center",
    borderRight: "1.5px solid rgba(255, 255, 255, 0.1)",
    backgroundColor:
      hovered === key ? "rgba(255, 255, 255, 0.1)" : "transparent",
    height: "65px",
  });

  return (
    <Menu
      mode="horizontal"
      theme="dark"
      style={{
        background: "#1b2540",
        height: "65px",
        lineHeight: "65px",
        display: "flex",
        alignItems: "center",
        paddingLeft: 40,
        paddingRight: 40,
      }}
    >
      <Menu.Item
        key="home"
        style={menuItemStyle("home")}
        onMouseEnter={() => setHovered("home")}
        onMouseLeave={() => setHovered(null)}
      >
        <a
          href="https://www.accordproject.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            src="/logo.png"
            preview={false}
            style={{ paddingRight: "1.5em", height: "26px" }}
          />
        </a>
        <span style={{ color: "white" }}>Template Playground</span>
      </Menu.Item>
      <Menu.Item
        key="explore"
        onClick={scrollToExplore}
        style={menuItemStyle("explore")}
        onMouseEnter={() => setHovered("explore")}
        onMouseLeave={() => setHovered(null)}
      >
        Explore
      </Menu.Item>
      <Menu.Item
        style={menuItemStyle("help")}
        onMouseEnter={() => setHovered("help")}
        onMouseLeave={() => setHovered(null)}
      >
        <Dropdown overlay={menu}>
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
            <CaretDownFilled style={{ fontSize: "10px", marginLeft: "5px" }} />
          </Button>
        </Dropdown>
      </Menu.Item>
      <Menu.Item
        key="github"
        style={{
          marginLeft: "auto",
          height: "65px",
          display: "flex",
          alignItems: "center",
          borderLeft: "1.5px solid rgba(255, 255, 255, 0.1)",
          backgroundColor:
            hovered === "github" ? "rgba(255, 255, 255, 0.1)" : "transparent",
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
            style={{ fontSize: "20px", color: "white", marginRight: "5px" }}
          />
          <span>Github</span>
        </a>
      </Menu.Item>
    </Menu>
  );
}

export default Navbar;
