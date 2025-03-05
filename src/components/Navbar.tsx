import { Menu, Dropdown, Button, Image, Grid } from "antd";
import { useLocation, Link } from "react-router-dom";
import {
  GithubOutlined,
  QuestionOutlined,
  UserOutlined,
  InfoOutlined,
  BookOutlined,
  CaretDownFilled,
  MenuOutlined,
} from "@ant-design/icons";
import ToggleDarkMode from "./ToggleDarkMode";

const { useBreakpoint } = Grid;

function Navbar({ scrollToFooter }: { scrollToFooter: () => void } ) {
  const screens = useBreakpoint();
  const location = useLocation();
  const isLearnPage = location.pathname.startsWith("/learn");

  const helpMenu = (
    <Menu>
      <Menu.ItemGroup title="Info">
        <Menu.Item key="about">
          <a href="https://github.com/accordproject/template-playground/blob/main/README.md" target="_blank" rel="noopener noreferrer">
            <QuestionOutlined /> About
          </a>
        </Menu.Item>
        <Menu.Item key="community">
          <a href="https://discord.com/invite/Zm99SKhhtA" target="_blank" rel="noopener noreferrer">
            <UserOutlined /> Community
          </a>
        </Menu.Item>
        <Menu.Item key="issues">
          <a href="https://github.com/accordproject/template-playground/issues" target="_blank" rel="noopener noreferrer">
            <InfoOutlined /> Issues
          </a>
        </Menu.Item>
      </Menu.ItemGroup>
      <Menu.Divider />
      <Menu.ItemGroup title="Documentation">
        <Menu.Item key="documentation">
          <a href="https://github.com/accordproject/template-engine/blob/main/README.md" target="_blank" rel="noopener noreferrer">
            <BookOutlined /> Documentation
          </a>
        </Menu.Item>
      </Menu.ItemGroup>
    </Menu>
  );

  const mobileMenu = (
    <Menu>
      <Menu.Item key="template">
        <a href="/" rel="noopener noreferrer">Template Playground</a>
      </Menu.Item>
      <Menu.Item key="explore" onClick={scrollToFooter}>
        Explore
      </Menu.Item>
      <Menu.Divider />
      <Menu.ItemGroup title="Help">
        <Menu.Item key="about">
          <a href="https://github.com/accordproject/template-playground/blob/main/README.md" target="_blank" rel="noopener noreferrer">
            <QuestionOutlined /> About
          </a>
        </Menu.Item>
        <Menu.Item key="community">
          <a href="https://discord.com/invite/Zm99SKhhtA" target="_blank" rel="noopener noreferrer">
            <UserOutlined /> Community
          </a>
        </Menu.Item>
        <Menu.Item key="issues">
          <a href="https://github.com/accordproject/template-playground/issues" target="_blank" rel="noopener noreferrer">
            <InfoOutlined /> Issues
          </a>
        </Menu.Item>
        <Menu.Item key="documentation">
          <a href="https://github.com/accordproject/template-engine/blob/main/README.md" target="_blank" rel="noopener noreferrer">
            <BookOutlined /> Documentation
          </a>
        </Menu.Item>
      </Menu.ItemGroup>
    </Menu>
  );

  return (
    <div style={{ background: "#1b2540", height: "65px", lineHeight: "65px", display: "flex", alignItems: "center", paddingLeft: screens.md ? 40 : 10, paddingRight: screens.md ? 40 : 10 }}>
      <div style={{ cursor: "pointer" }}>
        <a href="/" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center" }}>
          <Image src={screens.md ? "/logo.png" : "/accord_logo.png"} alt="Template Playground" preview={false} style={{ paddingRight: screens.md ? "24px" : "10px", height: "26px", maxWidth: screens.md ? "184.17px" : "36.67px" }} />
          {screens.md && <span style={{ color: "white" }}>Template Playground</span>}
        </a>
      </div>
      {screens.md ? (
        <>
          <div style={{ marginLeft: "20px", cursor: "pointer" }} onClick={scrollToFooter}>
            <span style={{ color: "white" }}>Explore</span>
          </div>
          <Dropdown overlay={helpMenu} trigger={["click"]}>
            <Button style={{ background: "transparent", border: "none", color: "white", marginLeft: "20px" }}>
              Help <CaretDownFilled />
            </Button>
          </Dropdown>
        </>
      ) : (
        <Dropdown overlay={mobileMenu} trigger={["click"]}>
          <Button style={{ background: "transparent", border: "none", color: "white" }}>
            <MenuOutlined style={{ fontSize: "20px" }} />
          </Button>
        </Dropdown>
      )}
      <div style={{ display: "flex", marginLeft: "auto", alignItems: "center", height: "65px" }}>
        <ToggleDarkMode />
        {!isLearnPage && (
          <Link to="/learn/intro">
            <Button style={{ marginLeft: "20px", backgroundColor: "#19c6c7", color: "#050c40" }}>Learn</Button>
          </Link>
        )}
        <a href="https://github.com/accordproject/template-playground" target="_blank" rel="noopener noreferrer" style={{ marginLeft: "20px", display: "flex", alignItems: "center", color: "white" }}>
          <GithubOutlined style={{ fontSize: "20px" }} />
        </a>
      </div>
    </div>
  );
}

export default Navbar;
