import { Menu, Dropdown, Button, Image, Grid } from "antd";
import { useLocation, Link } from "react-router-dom";
import {
  GithubOutlined,
  QuestionOutlined,
  UserOutlined,
  InfoOutlined,
  BookOutlined,
  CaretDownFilled,
  DownOutlined,
} from "@ant-design/icons";
import ToggleDarkMode from "./ToggleDarkMode";

const { useBreakpoint } = Grid;

interface NavbarProps {
  scrollToFooter: () => void;
}

function Navbar({ scrollToFooter }: NavbarProps) {
  const screens = useBreakpoint();
  const location = useLocation();

  // Dropdown menu for "Help"
  const helpMenu = (
    <Menu className="custom-dropdown">
      <Menu.ItemGroup
        key="info"
        title={
          <span>
            Info{" "}
            <DownOutlined
              style={{ fontSize: "10px", marginLeft: "5px", color: "#19c6c7" }}
            />
          </span>
        }
      >
        <Menu.Item key="about">
          <a
            href="https://github.com/accordproject/template-playground/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <QuestionOutlined style={{ marginRight: "8px" }} /> About
          </a>
        </Menu.Item>
        <Menu.Item key="community">
          <a
            href="https://discord.com/invite/Zm99SKhhtA"
            target="_blank"
            rel="noopener noreferrer"
          >
            <UserOutlined style={{ marginRight: "8px" }} /> Community
          </a>
        </Menu.Item>
        <Menu.Item key="issues">
          <a
            href="https://github.com/accordproject/template-playground/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            <InfoOutlined style={{ marginRight: "8px" }} /> Issues
          </a>
        </Menu.Item>
      </Menu.ItemGroup>
      <Menu.ItemGroup
        key="documentation"
        title={
          <span>
            Documentation{" "}
            <DownOutlined
              style={{ fontSize: "10px", marginLeft: "5px", color: "#19c6c7" }}
            />
          </span>
        }
      >
        <Menu.Item key="documentation">
          <a
            href="https://github.com/accordproject/template-engine/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOutlined style={{ marginRight: "8px" }} /> Documentation
          </a>
        </Menu.Item>
      </Menu.ItemGroup>
    </Menu>
  );

  const menuItemStyle = {
    display: "flex",
    alignItems: "center",
    padding: screens.md ? "0 24px" : "0 12px",
    height: "80px",
    transition: "background-color 0.3s ease",
  };

  const isLearnPage = location.pathname.startsWith("/learn");

  return (
    <>
      <style>
        {`
          .custom-dropdown {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 8px 0;
            min-width: 200px;
          }

          .custom-dropdown .ant-dropdown-menu-item-group-title {
            color: #1a2a44;
            font-weight: 500;
            padding: 8px 16px;
            font-size: 14px;
            display: flex;
            align-items: center;
          }

          .custom-dropdown .ant-dropdown-menu-item {
            padding: 8px 16px;
            color: #1a2a44;
            font-size: 14px;
            font-weight: 400;
            transition: background-color 0.3s ease;
          }

          .custom-dropdown .ant-dropdown-menu-item:hover {
            background-color: #f0f2f5;
          }

          .custom-dropdown .ant-dropdown-menu-item a {
            color: #1a2a44;
            text-decoration: none;
            display: flex;
            align-items: center;
          }

          .custom-dropdown .ant-dropdown-menu-item a:hover {
            color: #1a2a44;
          }

          /* Responsive adjustments */
          @media (max-width: 768px) {
            .navbar {
              padding: 0 10px !important;
            }

            .navbar-title {
              font-size: 16px !important;
            }

            .learn-button {
              padding: 8px 16px !important;
              font-size: 14px !important;
            }
          }
        `}
      </style>

      {/* Navbar component */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#1b2540",
          height: "100px", // Increased height for a formal look
          padding: "0 40px",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
        className="navbar"
      >
        {/* Left side: Logo and Menu Items */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: screens.md ? "20px" : "15px", // Increased gap for a more spacious look
          }}
        >
          <div style={menuItemStyle}>
            <Link to="/" style={{ display: "flex", alignItems: "center" }}>
              <Image
                src={screens.lg ? "/logo.png" : "/accord_logo.png"}
                alt="Template Playground"
                preview={false}
                style={{
                  paddingRight: screens.md ? "20px" : "10px",
                  height: "30px", // Slightly increased logo height to match the taller navbar
                  maxWidth: screens.md ? "200px" : "40px", // Adjusted maxWidth for better scaling
                }}
              />
              <span
                style={{
                  color: "#FAF9F6",
                  fontSize: "16px", // Increased font size for a formal look
                  fontWeight: 300, // Slightly bolder for formality
                  letterSpacing: "0.5px",
                  transition: "color 0.3s ease",
                  paddingLeft: screens.md ? "27px" : "10px", // Increased padding for better spacing
                }}
                className="navbar-title"
                onMouseEnter={(e) => (e.currentTarget.style.color = "#19c6c7")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#FAF9F6")}
              >
                Template Playground
              </span>
            </Link>
          </div>

          {screens.md && (
            <>
              <div style={menuItemStyle} onClick={scrollToFooter}>
                <span
                  style={{
                    color: "#FAF9F6",
                    fontSize: "16px",
                    fontWeight: 300,
                    transition: "color 0.3s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#19c6c7")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#FAF9F6")
                  }
                >
                  Explore
                </span>
              </div>
              <div>
                <Link to="/learn/intro">
                  <button
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "white",
                      height: "80px",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "16px",
                      fontWeight: 300,
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#19c6c7")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "white")
                    }
                  >
                    Learn
                  </button>
                </Link>
              </div>
              <div style={menuItemStyle}>
                <Dropdown overlay={helpMenu} trigger={["hover"]}>
                  <Button
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "white",
                      height: "80px",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "16px",
                      fontWeight: 300,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#19c6c7")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "white")
                    }
                  >
                    Help
                    <CaretDownFilled
                      style={{ fontSize: "12px", marginLeft: "5px" }}
                    />
                  </Button>
                </Dropdown>
              </div>
            </>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: screens.md ? "30px" : "15px",
          }}
        >
          <div>
            <ToggleDarkMode />
          </div>
          {!isLearnPage && (
            <div
              style={{
                height: "80px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            ></div>
          )}
          <div
            style={{
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: screens.md ? "0 24px" : "0 12px",
            }}
          >
            <a
              href="https://github.com/accordproject/template-playground"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", color: "white" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#19c6c7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#FAF9F6";
              }}
            >
              <GithubOutlined
                style={{
                  fontSize: "24px",
                  marginRight: screens.md ? "8px" : "0",
                  transition: "color 0.3s ease",
                }}
              />
              {screens.md && (
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 300,
                    transition: "color 0.3s ease",
                  }}
                >
                  GitHub
                </span>
              )}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
