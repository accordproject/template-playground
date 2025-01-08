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
} from "@ant-design/icons";

const { useBreakpoint } = Grid;

function Navbar({ scrollToExplore }: { scrollToExplore: any }) {
  const [hovered, setHovered] = useState<
    null | "home" | "explore" | "help" | "github" | "join"
  >(null);
  const screens = useBreakpoint();
  const location = useLocation();

  const props = useSpring({
    to: async (next) => {
      while (true) {
        await next({
          opacity: 1,
          boxShadow: "0px 0px 5px rgba(255, 255, 255, 1)",
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await next({
          opacity: 0.9,
          boxShadow: "0px 0px 0px rgba(255, 255, 255, 0)",
        });
        await new Promise((resolve) => setTimeout(resolve, 4000));
      }
    },
    from: { opacity: 0.5, boxShadow: "0px 0px 0px rgba(255, 255, 255, 0)" },
    config: { duration: 1000 },
  });

  const menu = (
    <Menu>
      <Menu.ItemGroup title="Info">
        <Menu.Item key="about">
          <a
            href="https://github.com/accordproject/template-playground/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Learn more about this project" // Added aria-label
          >
            <QuestionOutlined /> About
          </a>
        </Menu.Item>
        <Menu.Item key="community">
          <a
            href="https://discord.com/invite/Zm99SKhhtA"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join the community on Discord" // Added aria-label
          >
            <UserOutlined /> Community
          </a>
        </Menu.Item>
        <Menu.Item key="issues">
          <a
            href="https://github.com/accordproject/template-playground/issues"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View issues on GitHub" // Added aria-label
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
            aria-label="Read the documentation" // Added aria-label
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

  const isLearnPage = location.pathname.startsWith("/learn");

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
      aria-label="Main navigation bar" // Added aria-label for the main navigation
    >
      <div
        style={{
          cursor: "pointer",
          ...menuItemStyle("home", false),
        }}
        onMouseEnter={() => setHovered("home")}
        onMouseLeave={() => setHovered(null)}
        aria-label="Navigate to home" // Added aria-label
      >
        <a
          href="/"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center" }}
        >
          <Image
            src={screens.md ? "/logo.png" : "/accord_logo.png"}
            alt="Template Playground logo" // Improved alt text
            preview={false}
            style={{
              paddingRight: screens.md ? "24px" : "10px",
              height: "26px",
              maxWidth: screens.md ? "184.17px" : "36.67px",
            }}
          />
          <span style={{ color: "white" }}>Template Playground</span>
        </a>
      </div>
      {screens.md && (
        <>
          <div
            style={{
              cursor: "pointer",
              ...menuItemStyle("explore", false),
            }}
            onClick={scrollToExplore}
            onMouseEnter={() => setHovered("explore")}
            onMouseLeave={() => setHovered(null)}
            aria-label="Scroll to explore section" // Added aria-label
          >
            <span style={{ color: "white" }}>Explore</span>
          </div>
          <div
            style={{
              ...menuItemStyle("explore", false),
              cursor: "pointer",
            }}
            onMouseEnter={() => setHovered("help")}
            onMouseLeave={() => setHovered(null)}
            aria-label="Open help menu" // Added aria-label
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
                aria-label="Help options" // Added aria-label
              >
                Help
                <CaretDownFilled
                  style={{ fontSize: "10px", marginLeft: "5px" }}
                  aria-hidden="true" // Screen readers can ignore this decorative icon
                />
              </Button>
            </Dropdown>
          </div>
        </>
      )}
      <div
        style={{
          display: "flex",
          marginLeft: "auto",
          alignItems: "center",
          height: "65px",
        }}
      >
        {!isLearnPage && (
          <div
            style={{
              marginLeft: screens.md ? "20px" : "0",
              height: "65px",
              display: "flex",
              alignItems: "center",
              backgroundColor:
                hovered === "join" ? "rgba(255, 255, 255, 0.1)" : "transparent",
              cursor: "pointer",
            }}
            onMouseEnter={() => setHovered("join")}
            onMouseLeave={() => setHovered(null)}
            aria-label="Navigate to learn section" // Added aria-label
          >
            <Link to="/learn/intro" className="learnNow-button">
              <animated.button
                style={{
                  ...props,
                  padding: "10px 22px",
                  backgroundColor: "#19c6c7",
                  color: "#050c40",
                  border: "none",
                  borderRadius: "5px",
                  marginRight: "15px",
                  cursor: "pointer",
                }}
                aria-label="Start learning" // Added aria-label
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
            borderLeft: screens.md
              ? "1.5px solid rgba(255, 255, 255, 0.1)"
              : "none",
            paddingLeft: screens.md ? "20px" : "0",
            backgroundColor:
              hovered === "github" ? "rgba(255, 255, 255, 0.1)" : "transparent",
            cursor: "pointer",
          }}
          onMouseEnter={() => setHovered("github")}
          onMouseLeave={() => setHovered(null)}
          aria-label="Navigate to GitHub repository" // Added aria-label
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
              aria-hidden="true" // Screen readers can ignore this decorative icon
            />
            {screens.md && <span>Github</span>}
          </a>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
