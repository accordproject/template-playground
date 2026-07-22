import { useState } from "react";
import { colors } from "../../utils/theme";
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
import { FaDiscord } from "react-icons/fa";
import { Dropdown, Menu, MenuItem, MenuItemGroup, Button } from "./components";
import Samples, { SampleMenuItems } from "./Samples";

const Image = ({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) => <img src={src} alt={alt} className={className} />;

const useBreakpoint = () => {
  const [screenSize, setScreenSize] = useState({
    sm: false,
    md: false,
    lg: false,
    xl: false,
  });

  useState(() => {
    const checkSize = () => {
      setScreenSize({
        sm: window.innerWidth >= 640,
        md: window.innerWidth >= 768,
        lg: window.innerWidth >= 1024,
        xl: window.innerWidth >= 1280,
      });
    };

    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  });

  return screenSize;
};

function Navbar() {
  const [hovered, setHovered] = useState<
    null | "home" | "help" | "samples" | "github" | "discord" | "join"
  >(null);
  const screens = useBreakpoint();
  const location = useLocation();

  const props = useSpring({
    loop: true,
    from: { opacity: 0.5, boxShadow: "0px 0px 0px rgba(255, 255, 255, 0)" },
    to: [
      { opacity: 1, boxShadow: "0px 0px 5px rgba(255, 255, 255, 1)" },
      { opacity: 0.9, boxShadow: "0px 0px 0px rgba(255, 255, 255, 0)" },
    ],
    config: { duration: 1000 },
  });

  const mobileMenu = (
    <Menu>
      <MenuItem to="/">
        <span>Template Playground</span>
      </MenuItem>
      <SampleMenuItems />
      <MenuItem href="https://github.com/accordproject/template-playground/blob/main/README.md">
        <QuestionOutlined />
        <span>About</span>
      </MenuItem>
      <MenuItem href="https://discord.com/invite/Zm99SKhhtA">
        <UserOutlined />
        <span>Community</span>
      </MenuItem>
      <MenuItem href="https://github.com/accordproject/template-playground/issues">
        <InfoOutlined />
        <span>Issues</span>
      </MenuItem>
      <MenuItem href="https://github.com/accordproject/template-engine/blob/main/README.md">
        <BookOutlined />
        <span>Documentation</span>
      </MenuItem>
    </Menu>
  );

  const helpMenu = (
    <Menu>
      <MenuItemGroup title="Info">
        <MenuItem href="https://github.com/accordproject/template-playground/blob/main/README.md">
          <QuestionOutlined />
          <span>About</span>
        </MenuItem>
        <MenuItem href="https://discord.com/invite/Zm99SKhhtA">
          <UserOutlined />
          <span>Community</span>
        </MenuItem>
        <MenuItem href="https://github.com/accordproject/template-playground/issues">
          <InfoOutlined />
          <span>Issues</span>
        </MenuItem>
      </MenuItemGroup>
      <MenuItemGroup title="Documentation">
        <MenuItem href="https://github.com/accordproject/template-engine/blob/main/README.md">
          <BookOutlined />
          <span>Documentation</span>
        </MenuItem>
      </MenuItemGroup>
    </Menu>
  );

  const menuItemClasses = (key: string, isLast: boolean) => {
    const baseClasses = "flex items-center h-16";
    const paddingClasses = screens.md ? "px-5" : "px-0";
    const bgClasses =
      hovered === key ? "bg-white bg-opacity-10" : "bg-transparent";
    const borderClasses =
      screens.md && !isLast ? "border-r border-white border-opacity-10" : "";

    return `${baseClasses} ${paddingClasses} ${bgClasses} ${borderClasses}`;
  };

  const isLearnPage = location.pathname.startsWith("/learn");

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center ${
        screens.lg ? "px-10" : screens.md ? "px-2.5" : "px-2.5"
      }`}
      style={{ backgroundColor: colors.navy }}
    >
      <div
        className={`cursor-pointer ${menuItemClasses("home", false)}`}
        onMouseEnter={() => setHovered("home")}
        onMouseLeave={() => setHovered(null)}
      >
        <Link to="/" rel="noopener noreferrer" className="flex items-center">
          <Image
            src={screens.lg ? "/logo.png" : "/accord_logo.png"}
            alt="Template Playground"
            className={`h-6.5 ${screens.lg ? "pr-2 max-w-[184.17px]" : "pr-0.5 max-w-[36.67px]"}`}
          />
          <span className={`text-white ${screens.lg ? "block" : "hidden"}`}>
            Template Playground
          </span>
        </Link>
      </div>

      {screens.md ? (
        <>
          <div
            className={`${menuItemClasses("samples", false)} cursor-pointer samples-element`}
            onMouseEnter={() => setHovered("samples")}
            onMouseLeave={() => setHovered(null)}
          >
            <Samples />
          </div>
          <div
            className={`${menuItemClasses("help", false)} cursor-pointer`}
            onMouseEnter={() => setHovered("help")}
            onMouseLeave={() => setHovered(null)}
          >
            <Dropdown overlay={helpMenu} trigger={["click"]}>
              <Button className="bg-transparent border-none text-white h-16 flex items-center cursor-pointer">
                Help
                <CaretDownFilled className="text-xs ml-1.5" />
              </Button>
            </Dropdown>
          </div>
        </>
      ) : (
        <div className="ml-1.5">
          <Dropdown overlay={mobileMenu} trigger={["click"]}>
            <Button className="bg-transparent border-none text-white h-16 flex items-center">
              <MenuOutlined className="text-xl text-white" />
            </Button>
          </Dropdown>
        </div>
      )}

      <div
        className={`flex ml-auto items-center h-16 ${
          screens.md ? "gap-5 mr-0" : "gap-2.5 mr-1.5"
        }`}
      >
        {!isLearnPage && (
          <div
            className={`h-10 flex justify-center items-center cursor-pointer rounded-md ${
              hovered === "join"
                ? "shadow-[0_0_10px_10px_rgba(255,255,255,0.1)]"
                : ""
            }`}
            onMouseEnter={() => setHovered("join")}
            onMouseLeave={() => setHovered(null)}
          >
            <Link to="/learn/intro" className="learnNow-button">
              <animated.button
                style={{
                  ...props,
                  backgroundColor: colors.primary,
                  color: colors.darkNavy,
                }}
                className="px-[22px] py-[10px] border-none rounded-md cursor-pointer"
              >
                Learn
              </animated.button>
            </Link>
          </div>
        )}

        <div
          className={`h-16 flex items-center justify-center rounded-md cursor-pointer ${
            screens.md
              ? "px-5 border-l border-white border-opacity-10 pl-4 pr-4"
              : "px-2.5 pl-1.5 pr-1.5"
          } ${
            hovered === "discord" ? "bg-white bg-opacity-10" : "bg-transparent"
          }`}
          onMouseEnter={() => setHovered("discord")}
          onMouseLeave={() => setHovered(null)}
        >
          <a
            href="https://discord.com/invite/Zm99SKhhtA"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-white"
          >
            <FaDiscord
              className={`text-xl text-white ${screens.md ? "mr-1.5" : "mr-0"}`}
            />
            <span className={screens.md ? "inline" : "hidden"}>Discord</span>
          </a>
        </div>

        <div
          className={`h-16 flex items-center justify-center rounded-md cursor-pointer ${
            screens.md
              ? "px-5 border-l border-white border-opacity-10 pl-4 pr-4"
              : "px-2.5 pl-1.5 pr-1.5"
          } ${
            hovered === "github" ? "bg-white bg-opacity-10" : "bg-transparent"
          }`}
          onMouseEnter={() => setHovered("github")}
          onMouseLeave={() => setHovered(null)}
        >
          <a
            href="https://github.com/accordproject/template-playground"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-white"
          >
            <GithubOutlined
              className={`text-xl text-white ${screens.md ? "mr-1.5" : "mr-0"}`}
            />
            <span className={screens.md ? "inline" : "hidden"}>GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
