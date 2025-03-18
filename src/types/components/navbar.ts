export interface NavbarProps {
  scrollToFooter: () => void;
}

export interface MenuItemType {
  key: string;
  title: string;
  href: string;
  icon?: React.ReactNode;
} 