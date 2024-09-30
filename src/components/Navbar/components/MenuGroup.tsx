import React from "react";
import { Menu } from "antd";
import MenuItem from "./MenuItem";

interface MenuGroupProps {
    title: string;
    items: Array<{
        key: string;
        icon: React.ReactNode;
        label: string;
        href: string;
    }>;
}

const MenuGroup: React.FC<MenuGroupProps> = ({ title, items }) => (
    <Menu.ItemGroup title={title}>
        {items.map((item) => (
            <MenuItem key={item.key} {...item} />
        ))}
    </Menu.ItemGroup>
);

export default MenuGroup;