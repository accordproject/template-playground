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
  MenuOutlined
} from "@ant-design/icons";
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
    null | "home" | "help" | "github" | "join"
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
      <MenuItem>
        <Link to="/" className="flex items-center space-x-2">
          <span>Template Playground</span>
        </Link>
      </MenuItem>
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
    </Menu>
  );

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

  const menuItemClasses = (key: string, isLast: boolean) => {
    const baseClasses = "flex items-center h-16";
    const paddingClasses = screens.md ? "px-5" : "px-0";
    const bgClasses = hovered === key ? "bg-white bg-opacity-10" : "bg-transparent";
    const borderClasses = screens.md && !isLast ? "border-r border-white border-opacity-10" : "";
    
    return `${baseClasses} ${paddingClasses} ${bgClasses} ${borderClasses}`;
  };

  const isLearnPage = location.pathname.startsWith("/learn");

  return (
    <div className={`sticky top-0 z-50 bg-[#1b2540] h-16 flex items-center ${
      screens.lg ? "px-10" : screens.md ? "px-2.5" : "px-2.5"
    }`}>
      <div
        className={`cursor-pointer ${menuItemClasses("home", false)}`}
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
            className={`${menuItemClasses("help", false)} cursor-pointer`}
            onMouseEnter={() => setHovered("help")}
            onMouseLeave={() => setHovered(null)}
          >
            <Dropdown overlay={helpMenu} trigger={["click"]}>
              <Button className="bg-transparent border-none text-white h-16 flex items-center">
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
      
      <div className={`flex ml-auto items-center h-16 ${
        screens.md ? "gap-5 mr-0" : "gap-2.5 mr-1.5"
      }`}>
        <div className={screens.md ? "ml-0" : "ml-auto"}>
          <ToggleDarkMode />
        </div>
        
        {!isLearnPage && (
          <div
            className={`h-10 flex justify-center items-center cursor-pointer rounded-md ${
              hovered === "join" ? "shadow-[0_0_10px_10px_rgba(255,255,255,0.1)]" : ""
            }`}
            onMouseEnter={() => setHovered("join")}
            onMouseLeave={() => setHovered(null)}
          >
            <Link to="/learn/intro" className="learnNow-button">
              <animated.button
                style={props}
                className="px-[22px] py-[10px] bg-[#19c6c7] text-[#050c40] border-none rounded-md cursor-pointer"
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
            <GithubOutlined className={`text-xl text-white ${
              screens.md ? "mr-1.5" : "mr-0"
            }`} />
            <span className={screens.md ? "inline" : "hidden"}>Github</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Navbar;