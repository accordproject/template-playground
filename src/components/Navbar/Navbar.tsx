import React, { useState } from "react";
import {Image, Grid, Menu} from "antd";
import { useSpring, animated } from "react-spring";
import { useLocation, Link } from "react-router-dom";
import {
    GithubOutlined,
    QuestionOutlined,
    UserOutlined,
    InfoOutlined,
    BookOutlined,
} from "@ant-design/icons";
import MenuGroup from "./components/MenuGroup";
import NavbarItem from "./components/NavbarItem";
import menuItemsData from "./data/menuItems.json";

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

    const menuItems = menuItemsData.map((item) => ({
        ...item,
        icon: React.createElement(
            {
                QuestionOutlined,
                UserOutlined,
                InfoOutlined,
                BookOutlined,
            }[item.icon]
        ),
    }));

    const menu = (
        <Menu>
            <MenuGroup title="Info" items={menuItems.slice(0, 3)} />
            <MenuGroup title="Documentation" items={menuItems.slice(3)} />
        </Menu>
    );

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
        >
            <NavbarItem
                label={
                    <a
                        href="/"
                        rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center" }}
                    >
                        <Image
                            src={screens.md ? "/logo.png" : "/accord_logo.png"}
                            alt="Template Playground"
                            preview={false}
                            style={{
                                paddingRight: screens.md ? "24px" : "10px",
                                height: "26px",
                                maxWidth: screens.md ? "184.17px" : "36.67px",
                            }}
                        />
                        <span style={{ color: "white" }}>Template Playground</span>
                    </a>
                }
                hovered={hovered === "home"}
                setHovered={setHovered}
                keyName="home"
            />
            {screens.md && (
                <>
                    <NavbarItem
                        label="Explore"
                        onClick={scrollToExplore}
                        hovered={hovered === "explore"}
                        setHovered={setHovered}
                        keyName="explore"
                    />
                    <NavbarItem
                        label="Help"
                        dropdown={menu}
                        hovered={hovered === "help"}
                        setHovered={setHovered}
                        keyName="help"
                    />
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
                                hovered === "join"
                                    ? "rgba(255, 255, 255, 0.1)"
                                    : "transparent",
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
                <NavbarItem
                    label={
                        <a
                            href="https://github.com/accordproject/template-playground"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                color: "white",
                            }}
                        >
                            <GithubOutlined
                                style={{
                                    fontSize: "20px",
                                    color: "white",
                                    marginRight: screens.md ? "5px" : "0",
                                }}
                            />
                            {screens.md && <span>Github</span>}
                        </a>
                    }
                    hovered={hovered === "github"}
                    setHovered={setHovered}
                    keyName="github"
                />
            </div>
        </div>
    );
}

export default Navbar;