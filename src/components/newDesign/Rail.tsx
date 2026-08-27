import { useState } from "react";
import { GithubOutlined, SettingOutlined } from "@ant-design/icons";
import { FaDiscord } from "react-icons/fa";
import useAppStore from "../../store/store";
import SettingsModal from "../SettingsModal";

const DISCORD_URL = "https://discord.com/invite/Zm99SKhhtA";
const GITHUB_URL = "https://github.com/accordproject/template-playground";

/**
 * Dark 56px navigation rail on the far left of the new design.
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
      <aside className="nd-rail" aria-label="Playground navigation">
        <button
          type="button"
          className={`nd-rail-menu ${menuOpen ? "nd-rail-menu-open" : ""}`}
          title="Playground menu"
          aria-label="Playground menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="nd-rail-menu-glyph" />
        </button>
        <div className="nd-spacer" />
        <button type="button" className="nd-rail-ai" title="AI assistant" aria-label="AI assistant">
          ✦
        </button>
        <button
          type="button"
          className="nd-rail-link"
          title="Settings"
          aria-label="Settings"
          onClick={() => setSettingsOpen(true)}
        >
          <SettingOutlined />
        </button>
        <a className="nd-rail-link" href={DISCORD_URL} target="_blank" rel="noopener noreferrer" title="Discord" aria-label="Discord">
          <FaDiscord />
        </a>
        <a className="nd-rail-link" href={GITHUB_URL} target="_blank" rel="noopener noreferrer" title="GitHub" aria-label="GitHub">
          <GithubOutlined />
        </a>
      </aside>
      <SettingsModal />

      {menuOpen && (
        <>
          <div className="nd-menu-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="nd-menu" role="menu" aria-label="Playground menu">
            <div className="nd-menu-head">
              <div className="nd-menu-title">Playground</div>
              <div className="nd-menu-sub">Open a demo, learn the format, or start over.</div>
            </div>
            <div className="nd-menu-body">
              {/* Actions intentionally not wired yet — visual skeleton only. */}
              <button type="button" role="menuitem" className="nd-menu-item" onClick={closeMenu}>
                <span className="nd-menu-icon nd-menu-icon-teal">◧</span>
                <span className="nd-menu-item-text">
                  <span className="nd-menu-item-label">Open the demo document</span>
                  <span className="nd-menu-item-hint">See the rendered {sampleName} as a signer would</span>
                </span>
              </button>
              <button type="button" role="menuitem" className="nd-menu-item" onClick={closeMenu}>
                <span className="nd-menu-icon nd-menu-icon-blue">▶</span>
                <span className="nd-menu-item-text">
                  <span className="nd-menu-item-label">Replay the guided tour</span>
                  <span className="nd-menu-item-hint">Back to step 0 — pick a starting point</span>
                </span>
              </button>
              <button type="button" role="menuitem" className="nd-menu-item" onClick={closeMenu}>
                <span className="nd-menu-icon">⬡</span>
                <span className="nd-menu-item-text">
                  <span className="nd-menu-item-label">Browse example templates</span>
                  <span className="nd-menu-item-hint">Employment offer, NDA, supply agreement…</span>
                </span>
              </button>
              <button type="button" role="menuitem" className="nd-menu-item" onClick={closeMenu}>
                <span className="nd-menu-icon nd-menu-icon-amber">↗</span>
                <span className="nd-menu-item-text">
                  <span className="nd-menu-item-label">Docs: template format</span>
                  <span className="nd-menu-item-hint">Model, text and logic explained</span>
                </span>
              </button>
              <button type="button" role="menuitem" className="nd-menu-item" onClick={closeMenu}>
                <span className="nd-menu-icon">↺</span>
                <span className="nd-menu-item-text">
                  <span className="nd-menu-item-label">Reset the playground</span>
                  <span className="nd-menu-item-hint">Clear edits and start from the sample</span>
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
