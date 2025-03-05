import { useState, useEffect} from "react";
import { Menu, Dropdown, Button, Image} from "antd";
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
  CompassOutlined,
} from "@ant-design/icons";
import ToggleDarkMode from "./ToggleDarkMode";

function Navbar({ scrollToFooter }: { scrollToFooter: () => void }) {
  const [hovered, setHovered] = useState<
    null | "home" | "explore" | "help" | "github" | "join"
  >(null);
  const location = useLocation();

  const [isWideScreen, setIsWideScreen] = useState(
    typeof window !== 'undefined' && window.innerWidth >= 954
  );

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

  const mobileMenu = (
    <Menu>
      <Menu.Item key="explore" onClick={scrollToFooter}>
        <CompassOutlined /> Explore
      </Menu.Item>
      <Menu.SubMenu key="help" title={<span><QuestionOutlined /> Help</span>}>
        <Menu.ItemGroup title="Info">
          <Menu.Item key="about">
            <a
              href="https://github.com/accordproject/template-playground/blob/main/README.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              About
            </a>
          </Menu.Item>
          <Menu.Item key="community">
            <a
              href="https://discord.com/invite/Zm99SKhhtA"
              target="_blank"
              rel="noopener noreferrer"
            >
              Community
            </a>
          </Menu.Item>
          <Menu.Item key="issues">
            <a
              href="https://github.com/accordproject/template-playground/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              Issues
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
              Documentation
            </a>
          </Menu.Item>
        </Menu.ItemGroup>
      </Menu.SubMenu>
    </Menu>
  );

  const menuItemStyle = (key: string, isLast: boolean) => ({
    display: "flex",
    alignItems: "center",
    padding: isWideScreen ? "0 20px" : "0",
    backgroundColor:
      hovered === key ? "rgba(255, 255, 255, 0.1)" : "transparent",
    height: "65px",
    borderRight:
      isWideScreen && !isLast ? "1.5px solid rgba(255, 255, 255, 0.1)" : "none",
  });

  const isLearnPage = location.pathname.startsWith("/learn");

  useEffect(() => {
    const handleResize = () => {
      setIsWideScreen(window.innerWidth >= 954);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      style={{
        background: "#1b2540",
        height: "65px",
        lineHeight: "65px",
        display: "flex",
        alignItems: "center",
        paddingLeft: isWideScreen ? 40 : 10,
        paddingRight: isWideScreen ? 40 : 10,
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
          href="/"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center" }}
        >
          <Image
            src={isWideScreen ? "/logo.png" : "/accord_logo.png"}
            alt="Template Playground"
            preview={false}
            style={{
              paddingRight: isWideScreen ? "24px" : "10px",
              height: "26px",
              maxWidth: isWideScreen ? "184.17px" : "36.67px",
            }}
          />
          {isWideScreen && <span style={{ color: "white" }}>Template Playground</span>}
        </a>
      </div>
      {isWideScreen ? (
        <>
          <div
            style={{
              ...menuItemStyle("explore", false),
              cursor: "pointer",
            }}
            onClick={scrollToFooter}
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
            <Dropdown overlay={helpMenu} trigger={["click"]}>
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
      ) : (
        <div style={{ marginLeft: "10px" }}>
          <Dropdown overlay={mobileMenu} trigger={["click"]}>
            <Button
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
              }}
            >
              <MenuOutlined style={{ fontSize: "20px", color: "white" }} />
            </Button>
          </Dropdown>
        </div>
      )}
      <div
        style={{
          display: "flex",
          marginLeft: "auto",
          alignItems: "center",
          height: "65px",
        }}
      >
        <div>
          <ToggleDarkMode />
        </div>
        {!isLearnPage && (
          <div
            style={{
              marginLeft: isWideScreen ? "20px" : "0",
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
                  ...props,
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
            padding: isWideScreen ? "0 20px" : "0 10px",
            borderRadius: "5px",
            borderLeft: isWideScreen
              ? "1.5px solid rgba(255, 255, 255, 0.1)"
              : "none",
            paddingLeft: isWideScreen ? "20px" : "0",
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
            <GithubOutlined
              style={{
                fontSize: "20px",
                color: "white",
                marginRight: isWideScreen ? "5px" : "0",
              }}
            />
            {isWideScreen && <span>Github</span>}
          </a>
        </div>
      </div>
    </div>
  );
}

export default Navbar;