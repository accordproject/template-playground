import { useState } from "react";
import { Menu, Dropdown, Button, Image, Grid } from "antd";
import { useLocation, Link } from "react-router-dom";
import { useSpring, animated } from "react-spring";
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

function Navbar({ scrollToFooter }: { scrollToFooter: () => void }) {
  const [hovered, setHovered] = useState<null | "home" | "explore" | "help" | "github" | "join">(null);
  const screens = useBreakpoint();
  const location = useLocation();
  const isLearnPage = location.pathname.startsWith("/learn");

  const props = useSpring({
    loop: true,
    from: { opacity: 0.5, boxShadow: "0px 0px 0px rgba(255, 255, 255, 0)" },
    to: [
      { opacity: 1, boxShadow: "0px 0px 5px rgba(255, 255, 255, 1)" },
      { opacity: 0.9, boxShadow: "0px 0px 0px rgba(255, 255, 255, 0)" },
    ],
    config: { duration: 1000 },
  });

  const helpMenu = (
    <Menu>
      <Menu.Item key="template-playground">
  <a href="/" rel="noopener noreferrer">
    Template Playground
  </a>
</Menu.Item>
<Menu.Item key="explore">
  <a href="#explore" rel="noopener noreferrer">
    Explore
  </a>
</Menu.Item>
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
      <Menu.ItemGroup title="Documentation">
        <Menu.Item key="documentation">
          <a href="https://github.com/accordproject/template-engine/blob/main/README.md" target="_blank" rel="noopener noreferrer">
            <BookOutlined /> Documentation
          </a>
        </Menu.Item>
      </Menu.ItemGroup>
    </Menu>
  );

  return (
    <div style={{ background: "#1b2540", height: "65px", display: "flex", alignItems: "center", padding: `0 ${screens.md ? 40 : 10}px` }}>
      <div style={{ cursor: "pointer", whiteSpace: "nowrap" }}>
        <a href="/" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center" }}>
          <Image src={screens.md ? "/logo.png" : "/accord_logo.png"} alt="Template Playground" preview={false} style={{ paddingRight: screens.md ? "24px" : "10px", height: "26px" }} />
          {screens.md && <span style={{ color: hovered === 'home' ? '#19c6c7' : 'white' }} onMouseEnter={() => setHovered('home')} onMouseLeave={() => setHovered(null)}>Template Playground</span>}
        </a>
      </div>
      {screens.md ? (
        <>
          <div style={{ marginLeft: "20px", cursor: "pointer", color: hovered === 'explore' ? '#19c6c7' : 'white' }} onMouseEnter={() => setHovered('explore')} onMouseLeave={() => setHovered(null)} onClick={scrollToFooter}>Explore</div>
          <div onMouseEnter={() => setHovered('help')} onMouseLeave={() => setHovered(null)}>
            <Dropdown overlay={helpMenu} trigger={["click"]}>
              <Button style={{ background: "transparent", border: "none", color: hovered === 'help' ? '#19c6c7' : 'white', marginLeft: "20px" }}>
                Help <CaretDownFilled />
              </Button>
            </Dropdown>
          </div>
        </>
      ) : (
        <Dropdown overlay={helpMenu} trigger={["click"]}>
          <Button style={{ background: "transparent", border: "none", color: "white" }}>
            <MenuOutlined style={{ fontSize: "20px" }} />
          </Button>
        </Dropdown>
      )}
      <div style={{ display: "flex", marginLeft: "auto", alignItems: "center", height: "65px" }}>
        <ToggleDarkMode />
        {!isLearnPage && (
          <Link to="/learn/intro">
            <animated.button style={{ ...props, padding: "10px 22px", backgroundColor: "#19c6c7", color: "#050c40", border: "none", borderRadius: "5px", marginLeft: "20px", cursor: "pointer" }}>
              Learn
            </animated.button>
          </Link>
        )}
        <a href="https://github.com/accordproject/template-playground" target="_blank" rel="noopener noreferrer" style={{ marginLeft: "20px", display: "flex", alignItems: "center", color: "white" }}>
          <GithubOutlined style={{ fontSize: "20px" }} />
          {screens.md && <span style={{ marginLeft: "8px" }}>GitHub</span>}
        </a>
      </div>
    </div>
  );
}

export default Navbar;
