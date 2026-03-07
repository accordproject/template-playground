# How the Template Playground Works — Architecture Guide

> **Audience:** New contributors who want to understand how the frontend, template logic, and execution pipeline connect.

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Repository Structure](#2-repository-structure)
3. [Data Flow Diagram](#3-data-flow-diagram)
4. [Where Templates Are Loaded](#4-where-templates-are-loaded)
5. [The Execution Pipeline: Input → Execution → Output](#5-the-execution-pipeline-input--execution--output)
6. [State Management (Zustand Store)](#6-state-management-zustand-store)
7. [Frontend Component Architecture](#7-frontend-component-architecture)
8. [Shareable Links](#8-shareable-links)
9. [AI Assistant Integration](#9-ai-assistant-integration)
10. [Key Third-Party Libraries](#10-key-third-party-libraries)

---

## 1. High-Level Overview

The Template Playground is a **browser-only** React + TypeScript application. There is no backend server — all template compilation and rendering happens entirely in the browser using WebAssembly-powered and pure-JS packages from the Accord Project.

The three inputs a user controls are:

| Input | Editor Panel | Purpose |
|-------|-------------|---------|
| **Concerto Model** (`.cto`) | Top-left | Defines the data schema (types, fields) |
| **TemplateMark** (`.md`) | Middle-left | The natural-language template with variable expressions |
| **JSON Data** (`.json`) | Bottom-left | The concrete values to substitute into the template |

These three inputs are fed into the **execution pipeline**, which produces an **HTML preview** (right panel) in real time.

---

## 2. Repository Structure

```
template-playground/
├── public/                   # Static assets (logo, favicon)
├── src/
│   ├── main.tsx              # App entry point (React DOM render)
│   ├── App.tsx               # Root component: routing, init, theme
│   ├── store/
│   │   └── store.ts          # ★ Central Zustand state + rebuild() pipeline
│   ├── samples/              # Built-in template examples (TypeScript modules)
│   │   ├── index.ts          # Exports SAMPLES array + Sample type
│   │   ├── playground.ts     # Default "playground" sample
│   │   ├── helloworld.ts
│   │   └── ...               # (14 more samples)
│   ├── pages/
│   │   ├── MainContainer.tsx # The 3-editor + preview layout
│   │   └── LearnNow.tsx      # Learning pathway page
│   ├── editors/
│   │   ├── ConcertoEditor.tsx         # Monaco editor for .cto model
│   │   ├── JSONEditor.tsx             # Monaco editor for JSON data
│   │   ├── MarkdownEditor.tsx         # Monaco editor for TemplateMark
│   │   └── editorsContainer/
│   │       ├── TemplateMarkdown.tsx   # Wires MarkdownEditor to store
│   │       ├── TemplateModel.tsx      # Wires ConcertoEditor to store
│   │       └── AgreementData.tsx      # Wires JSONEditor to store
│   ├── components/           # UI components (Navbar, Sidebar, AI chat, …)
│   ├── utils/
│   │   ├── compression/      # LZ-based compress/decompress for share links
│   │   └── markdownEditorUtils.ts
│   ├── ai-assistant/         # AI chat relay and activity tracker
│   ├── contexts/             # React contexts (MarkdownEditorContext)
│   ├── types/                # TypeScript type definitions
│   └── content/              # Markdown files for the Learn pathway
├── DEVELOPERS.md             # Dev setup guide
├── CONTRIBUTING.md           # Contribution guide
└── ARCHITECTURE.md           # ← This file
```

---

## 3. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          BROWSER (No Server)                        │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        src/App.tsx                           │   │
│  │  • Reads URL hash (#data=...) or query param (?data=...)     │   │
│  │  • Calls store.init() or store.loadFromLink()                │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                       │
│                             ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    store/store.ts (Zustand)                  │   │
│  │                                                              │   │
│  │   templateMarkdown ──┐                                       │   │
│  │   modelCto ──────────┼──► rebuild() ──► agreementHtml        │   │
│  │   data (JSON) ───────┘        │                              │   │
│  │                               │ (debounced 500 ms)           │   │
│  └───────────────────────────────┼──────────────────────────────┘   │
│                                  │                                   │
│              ┌───────────────────▼──────────────────┐               │
│              │      Accord Project Libraries         │               │
│              │                                      │               │
│              │  1. ModelManager (concerto-core)      │               │
│              │     └─ parses .cto model              │               │
│              │                                      │               │
│              │  2. TemplateMarkTransformer           │               │
│              │     (markdown-template)               │               │
│              │     └─ parses TemplateMark → AST      │               │
│              │                                      │               │
│              │  3. TemplateMarkInterpreter           │               │
│              │     (template-engine)                 │               │
│              │     └─ merges AST + JSON data         │               │
│              │        → CiceroMark DOM               │               │
│              │                                      │               │
│              │  4. transform() (markdown-transform)  │               │
│              │     └─ CiceroMark → HTML string       │               │
│              └───────────────────┬──────────────────┘               │
│                                  │                                   │
│                                  ▼                                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   MainContainer.tsx (UI)                     │   │
│  │                                                              │   │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────┐           │   │
│  │  │ Concerto    │  │TemplateMark  │  │ JSON Data │           │   │
│  │  │ Model Editor│  │   Editor     │  │  Editor   │           │   │
│  │  └─────────────┘  └──────────────┘  └───────────┘           │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │           Preview Panel (agreementHtml)              │   │   │
│  │  │   dangerouslySetInnerHTML + DOMPurify sanitization   │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Where Templates Are Loaded

### 4a. Built-in Sample Templates

All built-in templates live in `src/samples/`. Each file exports a `Sample` object with four fields:

```ts
// Example: src/samples/helloworld.ts
export const NAME     = "Hello World";
export const MODEL    = `namespace org.example.helloworld...`;   // Concerto .cto
export const TEMPLATE = `Hello {{firstName}} {{lastName}}!`;     // TemplateMark
export const DATA     = { firstName: "John", lastName: "Doe" }; // JSON
```

All samples are registered in `src/samples/index.ts` and stored in the global `SAMPLES` array.

On startup:
1. `App.tsx` calls `store.init()`.
2. `store.init()` checks for a `?data=` or `#data=` URL parameter (share link). If none, it calls `store.rebuild()`.
3. The default template (`src/samples/playground.ts`) is already pre-loaded as the initial Zustand state.

Users can switch samples via the **Sample Dropdown** in the editor header, which calls `store.loadSample(name)`.

### 4b. Loading from a Share Link

When the URL contains `#data=<compressed>` or `?data=<compressed>`:
1. `App.tsx` detects the parameter and calls `store.loadFromLink(compressedData)`.
2. The data is decompressed using LZ-based utilities in `src/utils/compression/`.
3. The decompressed `{ templateMarkdown, modelCto, data, agreementHtml }` object is written into the store.
4. `store.rebuild()` is called to re-execute and refresh the preview.

---

## 5. The Execution Pipeline: Input → Execution → Output

The core compilation happens inside the `rebuild()` function in `src/store/store.ts`. It is **debounced** (500 ms) so it doesn't fire on every keystroke.

```
User edits any editor
        │
        ▼
store.setTemplateMarkdown() / store.setModelCto() / store.setData()
        │
        ▼  (debounced 500ms)
async function rebuild(template, model, dataString):

  Step 1 ─ Parse the Concerto Model
            new ModelManager({ strict: true })
            modelManager.addCTOModel(model)
            await modelManager.updateExternalModels()
              └─ validates schema, resolves external imports

  Step 2 ─ Parse the TemplateMark template into an AST
            new TemplateMarkTransformer()
            templateMarkTransformer.fromMarkdownTemplate(
              { content: template }, modelManager, "contract"
            )
              └─ produces a templateMarkDom object

  Step 3 ─ Merge the AST with JSON data → CiceroMark
            new TemplateMarkInterpreter(modelManager, {})
            await engine.generate(templateMarkDom, JSON.parse(dataString))
              └─ substitutes {{variables}}, evaluates conditionals,
                 iterates lists, computes formulas
              └─ produces a CiceroMark DOM

  Step 4 ─ Transform CiceroMark → HTML
            await transform(
              ciceroMarkJson,
              "ciceromark_parsed",
              ["html"],
              {}
            )
              └─ produces a plain HTML string

  Step 5 ─ Store result
            set({ agreementHtml: result, error: undefined })

On error at any step:
  set({ error: formattedMessage, isProblemPanelVisible: true })
```

The resulting `agreementHtml` string is rendered in the **Preview Panel** via `dangerouslySetInnerHTML` (sanitised with [DOMPurify](https://github.com/cure53/DOMPurify) before rendering).

---

## 6. State Management (Zustand Store)

The entire application state lives in a single [Zustand](https://github.com/pmndrs/zustand) store (`src/store/store.ts`) using the `immer` + `devtools` middleware stack.

### Key State Fields

| Field | Type | Purpose |
|-------|------|---------|
| `templateMarkdown` | `string` | The committed template (triggers rebuild) |
| `editorValue` | `string` | What the Monaco editor currently shows (may lag behind) |
| `modelCto` | `string` | The committed Concerto model |
| `editorModelCto` | `string` | What the Monaco model editor shows |
| `data` | `string` | The committed JSON data string |
| `editorAgreementData` | `string` | What the Monaco JSON editor shows |
| `agreementHtml` | `string` | Final rendered HTML from the pipeline |
| `error` | `string \| undefined` | Last error from the pipeline |
| `samples` | `Sample[]` | All available sample templates |
| `sampleName` | `string` | Currently selected sample name |

### Why Two Fields Per Editor (e.g. `templateMarkdown` vs `editorValue`)?

The "editor" fields (`editorValue`, `editorModelCto`, `editorAgreementData`) track **live keystrokes** in Monaco, while the "committed" fields (`templateMarkdown`, `modelCto`, `data`) trigger the rebuild pipeline. This separation allows undo/redo to operate on the editor state independently of the pipeline execution state.

### Key Actions

| Action | What It Does |
|--------|-------------|
| `init()` | Checks for share link; otherwise runs `rebuild()` |
| `loadSample(name)` | Sets all three inputs from a sample, then rebuilds |
| `rebuild()` | Runs the full execution pipeline (debounced) |
| `setTemplateMarkdown(t)` | Updates template state + triggers rebuild |
| `setModelCto(m)` | Updates model state + triggers rebuild |
| `setData(d)` | Updates data state + triggers rebuild |
| `generateShareableLink()` | Compresses current state → URL hash |
| `loadFromLink(data)` | Decompresses + hydrates state from URL |
| `toggleDarkMode()` | Switches theme, persists to `localStorage` |

---

## 7. Frontend Component Architecture

```
App.tsx
├── Navbar.tsx                 ← Top bar: logo, theme toggle, share, settings
├── PlaygroundSidebar.tsx      ← Left icon rail: toggle editors/preview/AI/problems
└── MainContainer.tsx          ← Main split-panel workspace
    ├── [Left PanelGroup — vertical]
    │   ├── TemplateModel      ← Concerto .cto editor (ConcertoEditor.tsx)
    │   │     └── ConcertoEditor.tsx   (Monaco editor, language: "cto")
    │   ├── TemplateMarkdown   ← TemplateMark .md editor
    │   │     └── MarkdownEditor.tsx   (Monaco editor, language: "markdown")
    │   ├── AgreementData      ← JSON data editor
    │   │     └── JSONEditor.tsx       (Monaco editor, language: "json")
    │   └── ProblemPanel.tsx   ← Shows errors from the pipeline (collapsible)
    ├── [Right Panel — Preview]
    │   └── dangerouslySetInnerHTML (DOMPurify sanitised agreementHtml)
    │         + Download PDF button (html2pdf.js)
    └── [Optional — AI Chat Panel]
          └── AIChatPanel.tsx  ← Floating chat powered by chatRelay
```

### Panel Visibility

The left sidebar (`PlaygroundSidebar.tsx`) exposes toggle buttons that show/hide:
- Editor panels (`isEditorsVisible`)
- Preview panel (`isPreviewVisible`)
- Problem panel (`isProblemPanelVisible`)
- AI Chat panel (`isAIChatOpen`)

All visibility state is persisted to `localStorage` under the key `ui-panels`.

Individual editors (Concerto Model and JSON Data) can also be **collapsed** (minimised to a header-only strip) via the chevron buttons — controlled by `isModelCollapsed` and `isDataCollapsed` in the store.

---

## 8. Shareable Links

Clicking **Share** in the Navbar:

```
Current state { templateMarkdown, modelCto, data, agreementHtml }
        │
        ▼
compress() — LZ-string compression (src/utils/compression/)
        │
        ▼
URL: https://playground.accordproject.org/#data=<base64-compressed>
```

When someone opens a share link:
```
URL hash #data=<compressed>
        │
        ▼
App.tsx detects hash → store.loadFromLink(compressed)
        │
        ▼
decompress() → { templateMarkdown, modelCto, data, agreementHtml }
        │
        ▼
Set state + call rebuild() to re-validate
```

---

## 9. AI Assistant Integration

The AI Chat panel (`src/components/AIChatPanel.tsx`) is a contextual assistant that:
- Reads the current editor content via the Zustand store.
- Tracks which editor the user was last active in via `src/ai-assistant/activityTracker.ts`.
- Sends messages through `src/ai-assistant/chatRelay.ts`, which supports multiple LLM providers (configured via the **AI Config** popup).
- AI configuration (API keys, model selection) is stored in `localStorage`.

---

## 10. Key Third-Party Libraries

| Library | Role |
|---------|------|
| `@accordproject/concerto-core` | Parses & validates Concerto (`.cto`) data models |
| `@accordproject/markdown-template` | Parses TemplateMark `.md` → an AST (`TemplateMarkTransformer`) |
| `@accordproject/template-engine` | Merges the AST with JSON data → CiceroMark (`TemplateMarkInterpreter`) |
| `@accordproject/markdown-transform` | Converts CiceroMark → HTML / PDF / other formats (`transform()`) |
| `zustand` | Lightweight global state management |
| `@monaco-editor/react` | VS Code editor embedded in the browser |
| `react-resizable-panels` | Draggable split-panel layout |
| `DOMPurify` | Sanitises the HTML output before rendering |
| `html2pdf.js` | Client-side PDF export from the preview panel |
| `antd` | UI component library (buttons, dropdowns, layout) |

---

## Quick Mental Model

If you remember nothing else, remember this:

> **TemplateMark + Concerto Model + JSON Data → `rebuild()` → HTML Preview**

All three inputs live in the Zustand store. Any change to any of them fires `rebuild()` (debounced), which runs the Accord Project pipeline entirely in the browser and updates `agreementHtml`, which re-renders the preview.

---

*For dev setup instructions, see [DEVELOPERS.md](./DEVELOPERS.md). For contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).*
