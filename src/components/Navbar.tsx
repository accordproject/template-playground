import { useState } from "react";
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
          <div className="absolute top-full left-5 z-20 mt-7 min-w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
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
  const [helpOpen , sethelpOpen] = useState(false);
  const [openMenu , setOpenMenu] = useState(false);
  const screens = useBreakpoint();
  const location = useLocation();

  const mobileHelpSubMenu = (
    <>
      <li>
        <a
          href="https://github.com/accordproject/template-playground/blob/main/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-4 px-10 py-2.5 text-white font-semibold tracking-wider"
        >
          <QuestionOutlined />
          <span>About</span>
        </a>
      </li>
      <li>
        <a
          href="https://discord.com/invite/Zm99SKhhtA"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-4 px-10 py-2.5 text-white font-semibold tracking-wider"
        >
          <UserOutlined />
          <span>Community</span>
        </a>
      </li>
      <li>
        <a
          href="https://github.com/accordproject/template-playground/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-4 px-10 py-2.5 text-white font-semibold tracking-wider"
        >
          <InfoOutlined />
          <span>Issues</span>
        </a>
      </li>
      <li>
        <a
          href="https://github.com/accordproject/template-engine/blob/main/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-4 px-10 py-2.5 text-white font-semibold tracking-wider"
        >
          <BookOutlined />
          <span>Documentation</span>
        </a>
      </li>
    </>
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
    const baseClasses = "flex items-center";
    const paddingClasses = screens.md ? "p-2.5 rounded-lg h-10" : "p-0";
    const bgClasses = hovered === key ? "bg-white bg-opacity-10" : "bg-transparent";
    const borderClasses = screens.md && !isLast ? "border-r border-white border-opacity-10" : "";
    
    return `${baseClasses} ${paddingClasses} ${bgClasses} ${borderClasses}`;
  };
  
  const isLearnPage = location.pathname.startsWith("/learn");

  return (
    <>
      {openMenu && !screens.md && (
        <div 
        onClick={() => setOpenMenu(false)}
        className="fixed inset-0 z-50 bg-transparent" />
      )}
      
      <div className={`fixed top-[4rem] right-0 h-[calc(100vh-4rem)] z-50 w-[270px] bg-[#1b2540] flex flex-col justify-between transition-transform duration-300 ${openMenu ? "translate-x-0" : "translate-x-96"} ${screens.md ? "hidden" : "block"} overflow-auto`}>
            <ul className="flex flex-col list-none p-0 m-0">
              <li 
              className={`${menuItemClasses("help", false)} px-6 py-3 cursor-pointer `}
              onClick={() => sethelpOpen(!helpOpen)}
              onMouseEnter={() => setHovered("help")}
              onMouseLeave={() => setHovered(null)}
              >
                <Button 
                className="bg-transparent border-none text-white font-semibold flex items-center justify-between w-full p-0 cursor-pointer">
                  Help
                  <CaretDownFilled className="text-sm" />
                </Button>
              </li>
              {helpOpen && (
                <li>
                  <ul className="list-none p-0 m-0">
                      {mobileHelpSubMenu}
                  </ul>
                </li>
              )}
              <li className={`${menuItemClasses("discord", false)} p-0 m-0  cursor-pointer `}
              onMouseEnter={() => setHovered("discord")}
              onMouseLeave={() => setHovered(null)}
              >
                <a
                  href="https://discord.com/invite/Zm99SKhhtA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center w-full text-white font-semibold px-6 py-3"
                >
                  <FaDiscord className="text-xl text-white mr-2" />
                  <span>Discord</span>
                </a>
              </li>
              <li
                className={`${menuItemClasses("github", false)} cursor-pointer `}
                onMouseEnter={() => setHovered("github")}
                onMouseLeave={() => setHovered(null)}
              >
                <a
                  href="https://github.com/accordproject/template-playground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center w-full text-white font-semibold px-6 py-3"
                >
                  <GithubOutlined className="text-xl text-white mr-2" />
                  <span>Github</span>
                </a>
              </li>
            </ul>

            <div className="flex items-center flex-col py-5 gap-5">
              {!isLearnPage && (
                <>
                  <div className="bg-white bg-opacity-30 w-full h-0.5"></div>
                  <div
                    onClick={()=>setOpenMenu(false)}
                    className={`h-9 w-60 flex justify-center items-center cursor-pointer rounded-md transition-transform duration-150 ${hovered === "join" ? "bg-gradient-to-br from-[#114fdf] to-[#0830a8] scale-105" : "bg-gradient-to-br from-[#1459f7] to-[#0f3fce]"}`}
                    onMouseEnter={() => setHovered("join")}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <Link to="/learn/intro" className="learnNow-button">
                      <button
                        className={`px-[25px] bg-transparent font-semibold tracking-wider text-white border-none rounded-xl cursor-pointer `}
                      >
                        Learn
                      </button>
                    </Link>
                  </div>
                </>
              )}
            </div>
      </div>
      
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#1b2540] h-17 flex items-center">
        <div className={`group cursor-pointer ${screens.md ? "px-5" : "px-4"}`}>
          <Link
            to="/"
            rel="noopener noreferrer"
            className="flex items-center "
          >
            <Image
              src="/accord_logo.png"
              alt="Template Playground"
              className="h-6.5 transition-transform duration-150 group-hover:scale-105 pr-2 max-w-[41px]"
            />
            <div className={`pl-1.5 flex ${screens.lg ? "flex-row gap-2 items-baseline group-hover:pl-3" : "flex-col"} group-hover:scale-105 transition-all duration-150`}>          
              <span className={`font-semibold uppercase tracking-widest ${screens.lg ? "text-base text-white" : "text-sm text-white/80 group-hover:text-white"}`}>
                Accord project
              </span>
              <span className={`text-white/80 group-hover:text-white font-semibold tracking-widest ${screens.lg ? "text-[13px]" : "text-[11px] uppercase"}`}>
                Template Playground
              </span>
            </div>
          </Link>
        </div>
        
        <div className={`flex ml-auto items-center h-16 ${screens.lg ? "gap-5 mr-6" : "gap-2 mr-3"}`}>
          {screens.md && (
            <>
              <div
                className={`${menuItemClasses("help", false)} cursor-pointer`}
                onMouseEnter={() => setHovered("help")}
                onMouseLeave={() => setHovered(null)}
              >
                <Dropdown overlay={helpMenu} trigger={["click"]}>
                  <Button className="bg-transparent border-none text-white font-semibold flex items-center cursor-pointer">
                    Help
                    <CaretDownFilled className="text-xs ml-1.5" />
                  </Button>
                </Dropdown>
              </div>
              
              <div
                className={`${menuItemClasses("discord", false)} cursor-pointer `}
                onMouseEnter={() => setHovered("discord")}
                onMouseLeave={() => setHovered(null)}
              >
                <a
                  href="https://discord.com/invite/Zm99SKhhtA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-white font-semibold"
                >
                  <FaDiscord className="text-xl text-white mr-2" />
                  <span>Discord</span>
                </a>
              </div>
              
              <div
                className={`${menuItemClasses("github", false)} cursor-pointer `}
                onMouseEnter={() => setHovered("github")}
                onMouseLeave={() => setHovered(null)}
              >
                <a
                  href="https://github.com/accordproject/template-playground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-white font-semibold"
                >
                  <GithubOutlined className="text-xl text-white mr-2" />
                  <span>Github</span>
                </a>
              </div>
            </>
          )}

          <div className={screens.md ? "ml-0" : "ml-auto"}>
            <ToggleDarkMode />
          </div>

          {!screens.md ? (
            <button 
            onClick={() => {setOpenMenu(!openMenu)}}
            className="flex flex-col gap-1.5 bg-transparent border-none cursor-pointer">
              <div className={`h-0.5 w-6 bg-white transition-transform ${openMenu ? "rotate-45 translate-y-1 duration-300" : "rotate-0 translate-y-0"}`}></div>              
              <div className={`h-0.5 w-6 bg-white ${openMenu ? "hidden" : "block"}`}></div>              
              <div className={`h-0.5 w-6 bg-white transition-transform ${openMenu ? "-rotate-45 -translate-y-1 duration-300" : "-rotate-0 -translate-y-0"}`}></div>              
            </button>
          ):(!isLearnPage && (
            <div
              className={`h-9 flex justify-center items-center cursor-pointer rounded-md transition-transform duration-150 ${hovered === "join" ? "bg-gradient-to-br from-[#114fdf] to-[#0830a8] scale-105" : "bg-gradient-to-br from-[#1459f7] to-[#0f3fce]"}`}
              onMouseEnter={() => setHovered("join")}
              onMouseLeave={() => setHovered(null)}
            >
              <Link to="/learn/intro" className="learnNow-button">
                <button
                  className={`px-[25px] bg-transparent font-semibold tracking-wider text-white border-none rounded-xl cursor-pointer `}
                >
                  Learn
                </button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Navbar;