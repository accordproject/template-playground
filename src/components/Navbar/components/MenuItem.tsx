import React from "react";
import { Menu } from "antd";

interface MenuItemProps {
    key: string;
    icon: React.ReactNode;
    label: string;
    href: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ key, icon, label, href }) => (
    <Menu.Item key={key}>
        <a href={href} target="_blank" rel="noopener noreferrer">
            {icon} {label}
        </a>
    </Menu.Item>
);

export default MenuItem;