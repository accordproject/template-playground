import { useState } from "react";
import { Dropdown, type MenuProps } from "antd";
import { GithubOutlined, SettingOutlined } from "@ant-design/icons";
import { FaDiscord } from "react-icons/fa";
import useAppStore from "../../store/store";
import SettingsModal from "../SettingsModal";
import { RAIL, URLS } from "./constants";

interface MenuItemTextProps {
  label: string;
  hint: string;
}

const MenuItemText = ({ label, hint }: MenuItemTextProps) => (
  <span className="nd-menu-item-text">
    <span className="nd-menu-item-label">{label}</span>
    <span className="nd-menu-item-hint">{hint}</span>
  </span>
);

/**
 * Dark 56px navigation rail on the far left of design v2.
 * The ▲ button opens the Playground menu (demo, tour, samples, docs, reset),
 * rendered with antd Dropdown so keyboard and focus handling come for free.
 * Menu items are not wired to actions yet.
 * Settings / Discord / GitHub live at the bottom of the rail; Settings opens
 * the shared SettingsModal so every existing toggle is available here too.
 */
const Rail = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const sampleName = useAppStore((s) => s.sampleName);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  // Actions intentionally not wired yet — visual skeleton only.
  const menuItems: MenuProps["items"] = [
    {
      key: "demo",
      icon: <span className="nd-menu-icon nd-menu-icon-teal">◧</span>,
      label: <MenuItemText label={RAIL.items.demo.label} hint={RAIL.items.demo.hint(sampleName)} />,
    },
    {
      key: "tour",
      icon: <span className="nd-menu-icon nd-menu-icon-blue">▶</span>,
      label: <MenuItemText label={RAIL.items.tour.label} hint={RAIL.items.tour.hint} />,
    },
    {
      key: "examples",
      icon: <span className="nd-menu-icon">⬡</span>,
      label: <MenuItemText label={RAIL.items.examples.label} hint={RAIL.items.examples.hint} />,
    },
    {
      key: "docs",
      icon: <span className="nd-menu-icon nd-menu-icon-amber">↗</span>,
      label: <MenuItemText label={RAIL.items.docs.label} hint={RAIL.items.docs.hint} />,
    },
    {
      key: "reset",
      icon: <span className="nd-menu-icon">↺</span>,
      label: <MenuItemText label={RAIL.items.reset.label} hint={RAIL.items.reset.hint} />,
    },
  ];

  return (
    <>
      <aside className="nd-rail" aria-label={RAIL.navLabel}>
        <Dropdown
          menu={{ items: menuItems, onClick: () => setMenuOpen(false) }}
          trigger={["click"]}
          placement="bottomLeft"
          open={menuOpen}
          onOpenChange={setMenuOpen}
          dropdownRender={(menu) => (
            <div className="nd-menu">
              <div className="nd-menu-head">
                <div className="nd-menu-title">{RAIL.menuTitle}</div>
                <div className="nd-menu-sub">{RAIL.menuSubtitle}</div>
              </div>
              {menu}
            </div>
          )}
        >
          <button
            type="button"
            className={`nd-rail-menu ${menuOpen ? "nd-rail-menu-open" : ""}`}
            title={RAIL.menuButton}
            aria-label={RAIL.menuButton}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="nd-rail-menu-glyph" />
          </button>
        </Dropdown>
        <div className="nd-spacer" />
        <button type="button" className="nd-rail-ai" title={RAIL.aiButton} aria-label={RAIL.aiButton}>
          ✦
        </button>
        <button
          type="button"
          className="nd-rail-link"
          title={RAIL.settings}
          aria-label={RAIL.settings}
          onClick={() => setSettingsOpen(true)}
        >
          <SettingOutlined />
        </button>
        <a className="nd-rail-link" href={URLS.discord} target="_blank" rel="noopener noreferrer" title={RAIL.discord} aria-label={RAIL.discord}>
          <FaDiscord />
        </a>
        <a className="nd-rail-link" href={URLS.github} target="_blank" rel="noopener noreferrer" title={RAIL.github} aria-label={RAIL.github}>
          <GithubOutlined />
        </a>
      </aside>
      <SettingsModal />
    </>
  );
};

export default Rail;
