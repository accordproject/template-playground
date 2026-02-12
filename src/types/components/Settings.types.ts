/**
 * Execution settings for the Template Playground
 */
export interface ExecutionSettings {
  /** Validation mode: strict requires exact schema compliance, lenient allows partial data */
  validationMode: 'strict' | 'lenient';
  /** Locale for number/date/currency formatting (e.g., 'en-US', 'en-GB', 'fr') */
  locale: string;
  /** Markdown rendering flavor */
  markdownFlavor: 'ciceromark' | 'commonmark';
  /** Whether to expand clause blocks in output */
  clauseExpansion: boolean;
}

/**
 * Version information for Accord Project libraries
 */
export interface LibraryVersions {
  templateEngine: string;
  concertoCore: string;
  markdownTransform: string;
  markdownTemplate: string;
}

/**
 * Props for the SettingsPanel component
 */
export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Default execution settings
 */
export const DEFAULT_EXECUTION_SETTINGS: ExecutionSettings = {
  validationMode: 'strict',
  locale: 'en-US',
  markdownFlavor: 'ciceromark',
  clauseExpansion: true,
};

/**
 * Available locale options
 */
export const LOCALE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'it', label: 'Italian' },
] as const;
