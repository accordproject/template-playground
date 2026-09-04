import { useState } from "react";
import { GithubOutlined, SettingOutlined } from "@ant-design/icons";
import { FaDiscord } from "react-icons/fa";
import useAppStore from "../../store/store";
import SettingsModal from "../SettingsModal";
import { RAIL, URLS } from "./constants";

/**
 * Dark 56px navigation rail on the far left of design v2.
 * The ▲ button opens the Playground menu (demo, tour, samples, docs, reset).
 * Menu items are not wired to actions yet.
 * Settings / Discord / GitHub live at the bottom of the rail; Settings opens
 * the shared SettingsModal so every existing toggle is available here too.
 */
const Rail = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const sampleName = useAppStore((s) => s.sampleName);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <aside className="nd-rail" aria-label={RAIL.navLabel}>
        <button
          type="button"
          className={`nd-rail-menu ${menuOpen ? "nd-rail-menu-open" : ""}`}
          title={RAIL.menuButton}
          aria-label={RAIL.menuButton}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="nd-rail-menu-glyph" />
        </button>
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

      {menuOpen && (
        <>
          <div className="nd-menu-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="nd-menu" role="menu" aria-label={RAIL.menuButton}>
            <div className="nd-menu-head">
              <div className="nd-menu-title">{RAIL.menuTitle}</div>
              <div className="nd-menu-sub">{RAIL.menuSubtitle}</div>
            </div>
            <div className="nd-menu-body">
              {/* Actions intentionally not wired yet — visual skeleton only. */}
              <button type="button" role="menuitem" className="nd-menu-item" onClick={closeMenu}>
                <span className="nd-menu-icon nd-menu-icon-teal">◧</span>
                <span className="nd-menu-item-text">
                  <span className="nd-menu-item-label">{RAIL.items.demo.label}</span>
                  <span className="nd-menu-item-hint">{RAIL.items.demo.hint(sampleName)}</span>
                </span>
              </button>
              <button type="button" role="menuitem" className="nd-menu-item" onClick={closeMenu}>
                <span className="nd-menu-icon nd-menu-icon-blue">▶</span>
                <span className="nd-menu-item-text">
                  <span className="nd-menu-item-label">{RAIL.items.tour.label}</span>
                  <span className="nd-menu-item-hint">{RAIL.items.tour.hint}</span>
                </span>
              </button>
              <button type="button" role="menuitem" className="nd-menu-item" onClick={closeMenu}>
                <span className="nd-menu-icon">⬡</span>
                <span className="nd-menu-item-text">
                  <span className="nd-menu-item-label">{RAIL.items.examples.label}</span>
                  <span className="nd-menu-item-hint">{RAIL.items.examples.hint}</span>
                </span>
              </button>
              <button type="button" role="menuitem" className="nd-menu-item" onClick={closeMenu}>
                <span className="nd-menu-icon nd-menu-icon-amber">↗</span>
                <span className="nd-menu-item-text">
                  <span className="nd-menu-item-label">{RAIL.items.docs.label}</span>
                  <span className="nd-menu-item-hint">{RAIL.items.docs.hint}</span>
                </span>
              </button>
              <button type="button" role="menuitem" className="nd-menu-item" onClick={closeMenu}>
                <span className="nd-menu-icon">↺</span>
                <span className="nd-menu-item-text">
                  <span className="nd-menu-item-label">{RAIL.items.reset.label}</span>
                  <span className="nd-menu-item-hint">{RAIL.items.reset.hint}</span>
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Rail;
