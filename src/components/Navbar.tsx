// import { useSpring, animated } from "react-spring";
import { useState } from "react";
import { Menu, Dropdown, Button, Image, Grid } from "antd";
import { useLocation, Link } from "react-router-dom";
import {
  GithubOutlined,
  QuestionOutlined,
  UserOutlined,
  InfoOutlined,
  BookOutlined,
  MenuOutlined,
  // CaretDownFilled,
} from "@ant-design/icons";
import ToggleDarkMode from "./ToggleDarkMode";

const { useBreakpoint } = Grid;

interface NavbarProps {
  scrollToFooter: () => void;
}

function Navbar({ scrollToFooter }: NavbarProps) {
  const [hovered, setHovered] = useState<null | "home" | "help" | "about" | "community" | "issues" | "documentation" | "github" | "join">(null);
  const screens = useBreakpoint();
  const location = useLocation();

  // const props = useSpring({
  //   loop: true,
  //   from: { opacity: 0.5, boxShadow: "0px 0px 0px rgba(255, 255, 255, 0)" },
  //   to: [
  //     { opacity: 1, boxShadow: "0px 0px 5px rgba(255, 255, 255, 1)" },
  //     { opacity: 0.9, boxShadow: "0px 0px 0px rgba(255, 255, 255, 0)" },
  //   ],
  //   config: { duration: 1000 },
  // });

  const mobileMenu = (
    <Menu>
      <Menu.Item key="home">
        <a href="/" target="_self">Template Playground</a>
      </Menu.Item>

      <Menu.Item key="explore" onClick={scrollToFooter}>
        Explore
      </Menu.Item>

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

      <Menu.Item key="documentation">
        <a 
          href="https://github.com/accordproject/template-playground" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <GithubOutlined /> Github
        </a>
      </Menu.Item>

      <Menu.Item key="documentation">
        <a 
          href="https://github.com/accordproject/template-engine/blob/main/README.md" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <BookOutlined /> Documentation
        </a>
      </Menu.Item>

    </Menu>
  );

  const menuItemStyle = () => ({
    display: "flex",
    alignItems: "center",
    height: "65px",
    padding: screens.md ? "0 5px" : "0",
    backgroundColor: "transparent",
    transition: "background-color 0.3s ease",
  });

  const isLearnPage = location.pathname.startsWith("/learn");

  const menuItemButtonStyle = (key: string): React.CSSProperties => ({
    background: 'transparent',
    border: "none",
    color: hovered === key ? "#19c6c7" : '#fff',
    height: "65px",
    alignItems: "center",
    fontSize: "1rem",
    fontWeight: "600",
    fontStyle: "normal",
    position: "relative",
    display: "block",
    lineHeight: "1",
    textDecoration: "none", 
    transition: 'all 0.3s ease',
  });

  const iconStyle = { 
    color: "#19c6c7", 
    fontSize: "17px" 
  };


  return (
    <div
      style={{
        background: "#1b2540",
        height: "65px",
        lineHeight: "65px",
        display: "flex",
        alignItems: "center",
        paddingLeft: screens.lg ? 40 : screens.md ? 10 : 10,
        paddingRight: screens.lg ? 40 : screens.md ? 10 : 10
      }}
    >
      <div
        style={{
          cursor: "pointer", 
          ...menuItemStyle()
        }}
        onMouseEnter={() => setHovered("home")}
        onMouseLeave={() => setHovered(null)}
      >
        <Link 
          to="/" 
          rel="noopener noreferrer" 
          style={{ 
            display: "flex", 
            alignItems: "center" 
          }}
        >
          <Image
            src="/accord_logo.png"
            alt="Template Playground"
            preview={false}
            style={{
              paddingRight: screens.md ? "10px" : "2px",
              height: "30px",
              maxWidth: screens.md ? "184.17px" : "36.67px"
            }}
          />
          <span
            style={{
              color: "white",
              display: screens.lg ? "block" : "none",
              fontFamily: "Graphik, Helvetica, Arial, sans-serif",
              fontStyle: "normal",
              fontWeight: "bold",
              fontSize: "1.1rem",
              borderRight: "2px solid rgba(255, 255, 255, 0.2)",
              paddingRight: "2rem",
            }}
          >
            Template Playground
          </span>
        </Link>
      </div>

      {screens.md ? (
        <>
          <div
            style={{ 
              cursor: "pointer", 
              ...menuItemStyle()
            }}
            onMouseEnter={() => setHovered("about")}
            onMouseLeave={() => setHovered(null)}
          >
            <a 
              href="https://github.com/accordproject/template-playground/blob/main/README.md" target="_blank" 
              rel="noopener noreferrer"
            >
              <Button style={menuItemButtonStyle("about")}>
                <QuestionOutlined style={iconStyle} /> About
              </Button>
            </a>
          </div>

          <div 
            style={{ 
              cursor: "pointer", 
              ...menuItemStyle()
            }} 
            onMouseEnter={() => setHovered("community")} 
            onMouseLeave={() => setHovered(null)}
          >
            <a 
              href="https://discord.com/invite/Zm99SKhhtA" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button style={menuItemButtonStyle("community")}>
                <UserOutlined style={iconStyle} /> Community
              </Button>
            </a>
          </div>

          <div 
            style={{ 
              cursor: "pointer", 
              ...menuItemStyle() 
            }} 
            onMouseEnter={() => setHovered("issues")} 
            onMouseLeave={() => setHovered(null)}
          >
            <a 
              href="https://github.com/accordproject/template-playground/issues" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button style={menuItemButtonStyle("issues")}>
                <InfoOutlined style={iconStyle} /> Issues
              </Button>
            </a>
          </div>

          <div 
            style={{ 
              cursor: "pointer", 
              ...menuItemStyle() 
            }} 
            onMouseEnter={() => setHovered("documentation")} 
            onMouseLeave={() => setHovered(null)}
          >
            <a 
              href="https://github.com/accordproject/template-engine/blob/main/README.md" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button style={menuItemButtonStyle("documentation")}>
                <BookOutlined style={iconStyle} /> Documentation
              </Button>
            </a>
          </div>

          <div 
            style={{ 
              cursor: "pointer", 
              ...menuItemStyle() 
            }} 
            onMouseEnter={() => setHovered("github")} 
            onMouseLeave={() => setHovered(null)}
          >
            <a 
              href="https://github.com/accordproject/template-playground" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button style={menuItemButtonStyle("github")}>
                <GithubOutlined style={iconStyle} /> Github
              </Button>
            </a>
          </div>
        </>
      ) : (
        <div 
          style={{ marginLeft: "5px" }}
        >
          <Dropdown overlay={mobileMenu} trigger={["click"]}>
            <Button 
              style={{ 
                background: "transparent", 
                border: "none", 
                color: "white", 
                height: "65px", 
                display: "flex", 
                alignItems: "center" 
              }}
            >
              <MenuOutlined style={{ fontSize: "20px" }} />
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
          gap: screens.md ? "20px" : "10px", 
          marginRight: screens.md ? 0 : "5px" 
        }}
      >

        {!isLearnPage && (
          <div
            style={{
              height: "2.2rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              backgroundColor: hovered === "join" ? "#17b2b3" : "#19c6c7",
              padding: "1rem",
              borderRadius: "1rem",
              cursor: "pointer",
              border: "none",
              fontSize: "1rem",
              fontWeight: "600",
              fontStyle: "normal",
              position: "relative",
              lineHeight: "1",
              textDecoration: "none",
              transform: hovered === "join" ? "scale(1.05)" : "scale(1)",
              boxShadow: hovered === "join" ? "0 4px 12px rgba(0, 0, 0, 0.2)" : "none",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={() => setHovered("join")}
            onMouseLeave={() => setHovered(null)}
          >
            <Link
              to="/learn/intro"
              className="ant-btn ant-btn-primary ant-btn-lg"
              style={{ color: "#fff", textDecoration: "none" }}
            >
              Learn
            </Link>
          </div>
        )}


        <div 
          style={{ 
            marginLeft: screens.md ? 0 : "auto" 
          }}
        >
          <ToggleDarkMode />
        </div>

      </div>
    </div>
  );
}

export default Navbar;
