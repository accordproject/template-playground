import { useState } from "react";
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
import { FaDiscord } from 'react-icons/fa';
import ToggleDarkMode from "./ToggleDarkMode";


interface DropdownProps {
  children: React.ReactNode;
  overlay: React.ReactNode;
  trigger: string[];
  className?: string;
}

const Dropdown = ({ children, overlay, trigger, className = "" }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    if (trigger.includes("click")) {
      setIsOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (trigger.includes("hover")) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger.includes("hover")) {
      setIsOpen(false);
    }
  };

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div onClick={handleClick}>
        {children}
      </div>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 z-20 mt-1 min-w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
            {overlay}
          </div>
        </>
      )}
    </div>
  );
};

const Menu = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`py-1 ${className}`}>
    {children}
  </div>
);

const MenuItem = ({
  children,
  onClick,
  className = ""
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) => (
  <div
    className={`px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center space-x-2 ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const MenuItemGroup = ({
  title,
  children,
  className = ""
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={className}>
    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700">
      {title}
    </div>
    {children}
  </div>
);

const Button = ({
  children,
  onClick,
  className = ""
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) => (
  <button
    className={`flex items-center ${className}`}
    onClick={onClick}
  >
    {children}
  </button>
);

const Image = ({
  src,
  alt,
  className = ""
}: {
  src: string;
  alt: string;
  className?: string;
}) => (
  <img src={src} alt={alt} className={className} />
);

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
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  });

  return screenSize;
};

function Navbar() {
  const [hovered, setHovered] = useState<
    null | "home" | "help" | "github" | "discord" | "join"
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

  const helpMenu = (
    <Menu>
      <MenuItemGroup title="Info">
        <MenuItem>
          <a
            href="https://github.com/accordproject/template-playground/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2"
          >
            <QuestionOutlined />
            <span>About</span>
          </a>
        </MenuItem>
        <MenuItem>
          <a
            href="https://discord.com/invite/Zm99SKhhtA"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2"
          >
            <UserOutlined />
            <span>Community</span>
          </a>
        </MenuItem>
        <MenuItem>
          <a
            href="https://github.com/accordproject/template-playground/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2"
          >
            <InfoOutlined />
            <span>Issues</span>
          </a>
        </MenuItem>
      </MenuItemGroup>
      <MenuItemGroup title="Documentation">
        <MenuItem>
          <a
            href="https://github.com/accordproject/template-engine/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2"
          >
            <BookOutlined />
            <span>Documentation</span>
          </a>
        </MenuItem>
      </MenuItemGroup>
    </Menu>
  );

  const isLearnPage = location.pathname.startsWith("/learn");

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-[#1b2540] h-16 grid grid-cols-[1fr_auto_1fr] items-center ${screens.lg ? "px-10" : "px-4"
      }`}>
      {/* Left Section: Logo & Help */}
      <div className="flex items-center justify-start gap-2 sm:gap-4 z-20">
        <div
          className="cursor-pointer flex items-center h-full shrink-0"
          onMouseEnter={() => setHovered("home")}
          onMouseLeave={() => setHovered(null)}
        >
          <Link
            to="/"
            rel="noopener noreferrer"
            className="flex items-center"
          >
            <Image
              src={screens.lg ? "/logo.png" : "/accord_logo.png"}
              alt="Accord Project"
              className={`object-contain ${screens.lg ? "h-7" : "h-8 w-auto"}`}
            />
          </Link>
        </div>

        <div
          className="cursor-pointer shrink-0"
          onMouseEnter={() => setHovered("help")}
          onMouseLeave={() => setHovered(null)}
        >
          <Dropdown overlay={helpMenu} trigger={["click"]}>
            <Button className="bg-transparent border-none text-white h-16 flex items-center font-medium text-sm sm:text-base hover:text-[#19c6c7] transition-colors">
              <span>Help</span>
              <CaretDownFilled className="text-xs ml-1.5" />
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* Center Section: Title */}
      <div className="flex justify-center items-center z-10 w-full overflow-hidden px-2">
        <Link to="/" className="no-underline truncate">
          <span className="hidden sm:block bg-gradient-to-r from-white via-cyan-50 to-[#19c6c7] bg-clip-text text-transparent text-sm sm:text-xl md:text-2xl font-extrabold tracking-widest md:tracking-[0.15em] uppercase drop-shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap">
            Template Playground
          </span>
        </Link>
      </div>

      {/* Right Section: Actions */}
      <div className="flex items-center justify-end gap-2 sm:gap-4 z-20">
        <div className="flex items-center">
          <ToggleDarkMode />
        </div>

        {!isLearnPage && (
          <div
            className={`h-10 flex justify-center items-center cursor-pointer rounded-md ${hovered === "join" ? "shadow-[0_0_10px_10px_rgba(255,255,255,0.1)]" : ""
              }`}
            onMouseEnter={() => setHovered("join")}
            onMouseLeave={() => setHovered(null)}
          >
            <Link to="/learn/intro" className="learnNow-button">
              <animated.button
                style={props}
                className="px-3 py-1.5 sm:px-6 sm:py-2 bg-[#19c6c7] text-[#050c40] border-none rounded-md cursor-pointer font-medium text-sm sm:text-base"
              >
                Learn
              </animated.button>
            </Link>
          </div>
        )}

        {/* Discord & Github - Icon only on mobile, text on desktop */}
        <div
          className={`h-16 flex items-center justify-center rounded-md cursor-pointer ${screens.md
            ? "px-5 border-l border-white border-opacity-10 pl-4 pr-4"
            : "px-3"
            } ${hovered === "discord" ? "bg-white bg-opacity-10" : "bg-transparent"
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
            <FaDiscord className={`text-xl text-white ${screens.md ? "mr-1.5" : ""}`} />
            {screens.md && <span className="inline">Discord</span>}
          </a>
        </div>

        <div
          className={`h-16 flex items-center justify-center rounded-md cursor-pointer ${screens.md
            ? "px-5 border-l border-white border-opacity-10 pl-4 pr-4"
            : "px-3"
            } ${hovered === "github" ? "bg-white bg-opacity-10" : "bg-transparent"
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
            <GithubOutlined className={`text-xl text-white ${screens.md ? "mr-1.5" : ""}`} />
            {screens.md && <span className="inline">Github</span>}
          </a>
        </div>
      </div>
    </div>
  );
}

export default Navbar;