import { useMemo } from 'react';
import { FiSettings, FiX, FiGlobe, FiCheckCircle, FiFileText, FiInfo } from 'react-icons/fi';
import useAppStore from '../store/store';
import { SettingsPanelProps, LOCALE_OPTIONS, LibraryVersions } from '../types/components/Settings.types';
import '../styles/components/SettingsPanel.css';

// Library versions from package.json - these are read at build time
const LIBRARY_VERSIONS: LibraryVersions = {
    templateEngine: '2.3.5',
    concertoCore: '3.11.1',
    markdownTransform: '0.16.19',
    markdownTemplate: '0.16.19',
};

const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
    const { backgroundColor, executionSettings, updateExecutionSettings } = useAppStore((state) => ({
        backgroundColor: state.backgroundColor,
        executionSettings: state.executionSettings,
        updateExecutionSettings: state.updateExecutionSettings,
    }));

    const isDarkMode = backgroundColor !== '#ffffff';

    const themeClasses = useMemo(() => ({
        container: isDarkMode ? 'settings-panel-container-dark' : 'settings-panel-container-light',
        closeBtn: isDarkMode ? 'settings-panel-close-btn-dark' : 'settings-panel-close-btn-light',
        section: isDarkMode ? 'settings-section-dark' : 'settings-section-light',
        sectionTitle: isDarkMode ? 'settings-section-title-dark' : 'settings-section-title-light',
        label: isDarkMode ? 'settings-label-dark' : 'settings-label-light',
        value: isDarkMode ? 'settings-value-dark' : 'settings-value-light',
        select: isDarkMode ? 'settings-select-dark' : 'settings-select-light',
        badge: isDarkMode ? 'settings-version-badge-dark' : 'settings-version-badge-light',
        infoText: isDarkMode ? 'settings-info-text-dark' : 'settings-info-text-light',
    }), [isDarkMode]);

    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="settings-panel-overlay twp" onClick={handleOverlayClick}>
            <div className={`settings-panel-container ${themeClasses.container}`}>
                {/* Header */}
                <div className="settings-panel-header">
                    <h2 className="settings-panel-title">
                        <FiSettings size={20} />
                        Execution Context
                    </h2>
                    <button
                        onClick={onClose}
                        className={`settings-panel-close-btn ${themeClasses.closeBtn}`}
                        aria-label="Close settings"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                <div className="settings-panel-content">
                    {/* Validation Settings */}
                    <section className={`settings-section ${themeClasses.section}`}>
                        <h3 className={`settings-section-title ${themeClasses.sectionTitle}`}>
                            <FiCheckCircle size={16} />
                            Validation
                        </h3>
                        <div className="settings-row">
                            <span className={`settings-label ${themeClasses.label}`}>
                                Lenient Validation
                            </span>
                            <label className="settings-toggle">
                                <input
                                    type="checkbox"
                                    className="settings-toggle-input"
                                    checked={executionSettings.validationMode === 'lenient'}
                                    onChange={(e) => updateExecutionSettings({
                                        validationMode: e.target.checked ? 'lenient' : 'strict'
                                    })}
                                />
                                <span className={`settings-toggle-slider ${executionSettings.validationMode === 'lenient'
                                    ? 'settings-toggle-slider-on'
                                    : 'settings-toggle-slider-off'
                                    }`} />
                            </label>
                        </div>
                        <div className={`settings-info-text ${themeClasses.infoText}`}>
                            {executionSettings.validationMode === 'lenient'
                                ? 'Enabled: Allows partial data and extra fields'
                                : 'Disabled: Enforces exact schema compliance (Strict)'}
                        </div>
                    </section>

                    {/* Formatting Context */}
                    <section className={`settings-section ${themeClasses.section}`}>
                        <h3 className={`settings-section-title ${themeClasses.sectionTitle}`}>
                            <FiGlobe size={16} />
                            Formatting Context
                        </h3>
                        <div className="settings-row">
                            <span className={`settings-label ${themeClasses.label}`}>Locale</span>
                            <select
                                className={`settings-select ${themeClasses.select}`}
                                value={executionSettings.locale}
                                onChange={(e) => updateExecutionSettings({ locale: e.target.value })}
                            >
                                {LOCALE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={`settings-info-text ${themeClasses.infoText}`}>
                            Affects number, date, and currency formatting in templates. Does not affect template logic.
                        </div>
                    </section>

                    {/* Rendering Settings */}
                    <section className={`settings-section ${themeClasses.section}`}>
                        <h3 className={`settings-section-title ${themeClasses.sectionTitle}`}>
                            <FiFileText size={16} />
                            Rendering
                        </h3>
                        <div className="settings-row">
                            <span className={`settings-label ${themeClasses.label}`}>Markdown Flavor</span>
                            <span className={`settings-value ${themeClasses.value}`}>
                                {executionSettings.markdownFlavor === 'ciceromark' ? 'CiceroMark' : 'CommonMark'}
                            </span>
                        </div>
                        <div className="settings-row">
                            <span className={`settings-label ${themeClasses.label}`}>Clause Expansion</span>
                            <label className="settings-toggle">
                                <input
                                    type="checkbox"
                                    className="settings-toggle-input"
                                    checked={executionSettings.clauseExpansion}
                                    onChange={(e) => updateExecutionSettings({
                                        clauseExpansion: e.target.checked
                                    })}
                                />
                                <span className={`settings-toggle-slider ${executionSettings.clauseExpansion
                                    ? 'settings-toggle-slider-on'
                                    : 'settings-toggle-slider-off'
                                    }`} />
                            </label>
                        </div>
                        <div className={`settings-info-text ${themeClasses.infoText}`}>
                            Controls visual expansion only; does not affect execution
                        </div>
                    </section>

                    {/* Version Information */}
                    <section className={`settings-section ${themeClasses.section}`}>
                        <h3 className={`settings-section-title ${themeClasses.sectionTitle}`}>
                            <FiInfo size={16} />
                            Library Versions
                        </h3>
                        <div className="settings-row">
                            <span className={`settings-label ${themeClasses.label}`}>Template Engine</span>
                            <span className={`settings-version-badge ${themeClasses.badge}`}>
                                v{LIBRARY_VERSIONS.templateEngine}
                            </span>
                        </div>
                        <div className="settings-row">
                            <span className={`settings-label ${themeClasses.label}`}>Concerto Core</span>
                            <span className={`settings-version-badge ${themeClasses.badge}`}>
                                v{LIBRARY_VERSIONS.concertoCore}
                            </span>
                        </div>
                        <div className="settings-row">
                            <span className={`settings-label ${themeClasses.label}`}>Markdown Transform</span>
                            <span className={`settings-version-badge ${themeClasses.badge}`}>
                                v{LIBRARY_VERSIONS.markdownTransform}
                            </span>
                        </div>
                        <div className="settings-row">
                            <span className={`settings-label ${themeClasses.label}`}>Markdown Template</span>
                            <span className={`settings-version-badge ${themeClasses.badge}`}>
                                v{LIBRARY_VERSIONS.markdownTemplate}
                            </span>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
