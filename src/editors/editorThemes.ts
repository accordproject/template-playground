import type { Monaco } from "@monaco-editor/react";

/**
 * Registers the two Monaco themes named by useThemeName().
 *
 * Monaco keeps themes in one global registry and falls back to its light
 * theme for a name it does not know, so every editor passes this to
 * `beforeMount`: no editor depends on another one having mounted first.
 * Each theme has fixed colors (the pair toggleDarkMode switches between), so
 * neither goes stale when the mode changes while an editor is not on screen.
 */
export default function defineEditorThemes(monaco: Monaco): void {
  const defineTheme = (
    name: string,
    base: "vs" | "vs-dark",
    background: string,
    foreground: string,
  ) => {
    monaco.editor.defineTheme(name, {
      base,
      inherit: true,
      rules: [],
      colors: {
        "editor.background": background,
        "editor.foreground": foreground,
        "editor.lineHighlightBorder": "#EDE8DC",
        "editorGhostText.foreground": "#9c9a9a",
      },
    });
  };

  defineTheme("lightTheme", "vs", "#ffffff", "#121212");
  defineTheme("darkTheme", "vs-dark", "#121212", "#ffffff");
}
