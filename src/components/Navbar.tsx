import { useState } from "react";
import { Menu, Dropdown, Button, Image, Grid } from "antd";
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
} from "@ant-design/icons";
import ToggleDarkMode from "./ToggleDarkMode";

const { useBreakpoint } = Grid;

function Navbar({ scrollToFooter }: { scrollToFooter: () => void }) {
  const [hovered, setHovered] = useState<
    null | "home" | "explore" | "help" | "github" | "join"
  >(null);

  const screens = useBreakpoint();
  const location = useLocation();
  const isLearnPage = location.pathname.startsWith("/learn");

  // Animation for the "Learn" button using React Spring
  const learnButtonProps = useSpring({
    loop: true,
    from: { opacity: 0.5, boxShadow: "0px 0px 0px rgba(255, 255, 255, 0)" },
    to: [
      { opacity: 1, boxShadow: "0px 0px 5px rgba(255, 255, 255, 1)" },
      { opacity: 0.9, boxShadow: "0px 0px 0px rgba(255, 255, 255, 0)" },
    ],
    config: { duration: 1000 },
  });

  // Animation for the Navbar entrance
  const navbarProps = useSpring({
    from: { opacity: 0, transform: "translateY(-20px)" },
    to: { opacity: 1, transform: "translateY(0)" },
    config: { duration: 500 }, // Adjust duration as needed
  });

  // "Help" dropdown menu
  const helpMenu = (
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

  // Hamburger menu for small screens
  const hamburgerMenu = (
    <Menu>
      <Menu.Item key="explore" onClick={scrollToFooter}>
        Explore
      </Menu.Item>
      <Menu.SubMenu key="help" title="Help">
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
      </Menu.SubMenu>
      {!isLearnPage && (
        <Menu.Item key="learn">
          <Link to="/learn/intro">Learn</Link>
        </Menu.Item>
      )}
      <Menu.Item key="github">
        <a
          href="https://github.com/accordproject/template-playground"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </Menu.Item>
    </Menu>
  );

  // Reusable style for menu items
  const menuItemStyle = (key: string) => ({
    display: "flex",
    alignItems: "center",
    padding: screens.md ? "0 20px" : "0",
    backgroundColor:
      hovered === key ? "rgba(255, 255, 255, 0.1)" : "transparent",
    height: "65px",
  });

  return (
    <animated.div
      style={{
        ...navbarProps,
        background: "#1b2540",
        height: "65px",
        lineHeight: "65px",
        display: "flex",
        alignItems: "center",
        paddingLeft: screens.md ? 40 : 10,
        paddingRight: screens.md ? 40 : 10,
        overflow: "hidden", // Prevent content from overflowing
      }}
    >
      {/* Logo Section */}
      <div
        style={{ cursor: "pointer", ...menuItemStyle("home") }}
        onMouseEnter={() => setHovered("home")}
        onMouseLeave={() => setHovered(null)}
      >
        <a href="/" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center" }}>
          <Image
            src={screens.md ? "/logo.png" : "/accord_logo.png"}
            alt="Template Playground"
            preview={false}
            style={{
              height: "26px",
              width: screens.md ? "auto" : "36.67px",
              paddingRight: screens.md ? "24px" : "10px",
            }}
          />
          {screens.md && <span style={{ color: "white" }}>Template Playground</span>}
        </a>
      </div>

      {/* Menu Items for Medium and Larger Screens */}
      {screens.md && (
        <>
          <div
            style={{ ...menuItemStyle("explore"), cursor: "pointer" }}
            onClick={scrollToFooter}
            onMouseEnter={() => setHovered("explore")}
            onMouseLeave={() => setHovered(null)}
          >
            <span style={{ color: "white" }}>Explore</span>
          </div>
          <div
            style={{ ...menuItemStyle("help"), cursor: "pointer" }}
            onMouseEnter={() => setHovered("help")}
            onMouseLeave={() => setHovered(null)}
          >
            <Dropdown overlay={helpMenu} trigger={["hover"]} placement="bottomLeft">
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
                Help <CaretDownFilled style={{ fontSize: "10px", marginLeft: "5px" }} />
              </Button>
            </Dropdown>
          </div>
        </>
      )}

      {/* Right Side Content */}
      <div
        style={{
          display: "flex",
          marginLeft: "auto",
          alignItems: "center",
          height: "65px",
        }}
      >
        <ToggleDarkMode />

        {/* Medium and Larger Screens */}
        {screens.md ? (
          <>
            {!isLearnPage && (
              <div
                style={{
                  marginLeft: "20px",
                  height: "65px",
                  display: "flex",
                  justifyContent: "center",
                  paddingLeft: "15px",
                  borderRadius: "5px",
                  alignItems: "center",
                  backgroundColor:
                    hovered === "join" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                  cursor: "pointer",
                }}
                onMouseEnter={() => setHovered("join")}
                onMouseLeave={() => setHovered(null)}
              >
                <Link to="/learn/intro" className="learnNow-button">
                  <animated.button
                    style={{
                      ...learnButtonProps,
                      padding: "10px 22px",
                      backgroundColor: "#19c6c7",
                      color: "#050c40",
                      border: "none",
                      borderRadius: "5px",
                      marginRight: "15px",
                      cursor: "pointer",
                    }}
                  >
                    Learn
                  </animated.button>
                </Link>
              </div>
            )}
            <div
              style={{
                height: "65px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 20px",
                borderRadius: "5px",
                borderLeft: "1.5px solid rgba(255, 255, 255, 0.1)",
                paddingLeft: "20px",
                backgroundColor:
                  hovered === "github" ? "rgba(255, 255, 255, 0.1)" : "transparent",
                cursor: "pointer",
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
                <GithubOutlined style={{ fontSize: "20px", color: "white", marginRight: "5px" }} />
                <span>Github</span>
              </a>
            </div>
          </>
        ) : (
          /* Hamburger Menu for Small Screens */
          <Dropdown overlay={hamburgerMenu} trigger={["click"]} placement="bottomRight">
            <MenuOutlined
              style={{ fontSize: "24px", color: "white", marginLeft: "20px", cursor: "pointer" }}
            />
          </Dropdown>
        )}
      </div>
    </animated.div>
  );
}

export default Navbar;