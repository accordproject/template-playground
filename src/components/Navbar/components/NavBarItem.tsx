import React from "react";
import { Button, Dropdown } from "antd";
import { CaretDownFilled } from "@ant-design/icons";

interface NavbarItemProps {
    label: string;
    onClick?: () => void;
    dropdown?: React.ReactNode;
    hovered: boolean;
    setHovered: (key: string | null) => void;
    keyName: string;
}

const NavbarItem: React.FC<NavbarItemProps> = ({
                                                   label,
                                                   onClick,
                                                   dropdown,
                                                   hovered,
                                                   setHovered,
                                                   keyName,
                                               }) => (
    <div
        style={{
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            backgroundColor: hovered ? "rgba(255, 255, 255, 0.1)" : "transparent",
            height: "65px",
            cursor: "pointer",
        }}
        onMouseEnter={() => setHovered(keyName)}
        onMouseLeave={() => setHovered(null)}
        onClick={onClick}
    >
        {dropdown ? (
            <Dropdown overlay={dropdown} trigger={["click"]}>
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
                    {label}
                    <CaretDownFilled style={{ fontSize: "10px", marginLeft: "5px" }} />
                </Button>
            </Dropdown>
        ) : (
            <span style={{ color: "white" }}>{label}</span>
        )}
    </div>
);

export default NavbarItem;