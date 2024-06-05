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

  return (
    <Menu
      mode="horizontal"
      theme="dark"
      style={{
        background: "#1b2540",
        height: "65px",
        lineHeight: "65px",
        paddingLeft: 40,
        paddingRight: 40,
        display: "flex",
        alignItems: "center",
      }}
    >
      <Menu.Item
        key="home"
        style={{
          display: "flex",
          alignItems: "center",
          borderRight: "1.5px solid rgba(255, 255, 255, 0.1)",
        }}
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
        style={{
          height: "65px",
          display: "flex",
          alignItems: "center",
          borderRight: "1.5px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        Explore
      </Menu.Item>
      <Menu.Item
        style={{
          height: "65px",
          display: "flex",
          alignItems: "center",
          borderRight: "1.5px solid rgba(255, 255, 255, 0.1)",
        }}
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
            <CaretDownFilled style={{ fontSize: "10px" }} />
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
        }}
      >
        <a
          href="https://github.com/accordproject/template-playground"
          target="_blank"
          rel="noopener noreferrer"
        >
          <GithubOutlined style={{ fontSize: "24px", color: "white" }} />
        </a>
        <span style={{ color: "white" }}>Github</span>
      </Menu.Item>
    </Menu>
  );
}

export default Navbar;
