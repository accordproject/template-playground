/**
 * User-facing strings, URLs and routes for the design-v2 layout.
 * Components import from here instead of embedding literals, so copy can be
 * reviewed and changed in one place (and later localised).
 */
import { NAME as BLANK_SAMPLE_NAME } from "../../samples/blank";

export const URLS = {
  discord: "https://discord.com/invite/Zm99SKhhtA",
  github: "https://github.com/accordproject/template-playground",
  readme: "https://github.com/accordproject/template-playground/blob/main/README.md",
  issues: "https://github.com/accordproject/template-playground/issues",
  engineDocs: "https://github.com/accordproject/template-engine/blob/main/README.md",
  concertoSite: "https://concerto.accordproject.org/",
  concertoSpec: "https://concerto.accordproject.org/docs/category/specification",
  templateMark: "https://github.com/accordproject/markdown-transform/blob/main/packages/markdown-template/README.md",
  logicDocs: "https://github.com/accordproject/template-engine/blob/main/README.md#logic",
  concertoIntro: "https://concerto.accordproject.org/docs/intro",
} as const;

export const ROUTES = {
  learnIntro: "/learn/intro",
} as const;

export const RAIL = {
  navLabel: "Playground navigation",
  menuButton: "Playground menu",
  aiButton: "AI assistant",
  settings: "Settings",
  discord: "Discord",
  github: "GitHub",
  menuTitle: "Playground",
  menuSubtitle: "Open a demo, learn the format, or start over.",
  items: {
    demo: { label: "Open the demo document", hint: (sample: string) => `See the rendered ${sample} as a signer would` },
    tour: { label: "Replay the guided tour", hint: "Back to step 0 — pick a starting point" },
    examples: { label: "Browse example templates", hint: "Employment offer, NDA, supply agreement…" },
    docs: { label: "Docs: template format", hint: "Text, model and logic explained" },
    reset: { label: "Reset the playground", hint: "Clear edits and start from the sample" },
  },
} as const;

export const HEADER = {
  eyebrow: "ACCORD PROJECT · TEMPLATE PLAYGROUND",
  docs: "docs ↗",
  help: "Help",
  helpMenuLabel: "Help",
  helpGroupInfo: "Info",
  helpGroupDocs: "Documentation",
  advanced: "Advanced",
  preview: "◧ Preview",
  stepperLabel: "Steps",
  links: {
    about: "About",
    community: "Community",
    issues: "Issues",
    documentation: "Documentation",
  },
} as const;

export const FOOTER = {
  noProblems: "✓ no problems",
  applyAndCompileDirty: "Apply & Compile*",
  /** Problems pill while the app store reports an error; the full message follows it. */
  problem: "✕ error",
  problemLabel: "Problem",
  back: "← Back",
  applyAndCompile: "Apply & Compile",
  startWithTemplate: "Start with this template",
  next: "Next →",
} as const;

export const HELP_RAIL = {
  ariaLabel: "Step guidance",
  checklist: "CHECKLIST",
  tabWhy: "WHY THIS STEP",
  tabHow: "HOW IT WORKS",
  /** "2 / 3" done-of-total counter next to the checklist title. */
  count: (done: number, total: number) => `${done} / ${total}`,
  close: "Close help",
  /** Chip next to the step title that brings the rail back. */
  reopen: "? Help",
} as const;

export const PREVIEW = {
  ariaLabel: "Preview",
  title: "Preview",
  liveBadge: "live",
  pdf: "↓ PDF",
  close: "Close preview",
} as const;

export const WELCOME = {
  titleLine: "Contracts that",
  titleAccent: "run themselves.",
  subtitleLine1: "Write the agreement once — as data, text and rules — and watch it execute.",
  subtitleLine2: "Six steps, no setup.",
  start: "Start building",
  howItWorks: "How it works ↗",
} as const;

export const START = {
  title: "Choose a template type",
  hint: "everything stays editable later",
  blank: "+ Blank",
  blankName: "Blank template",
  draftWithAi: "✦ Draft with AI",
  includeLogic: "include logic",
  /** "steps 5 & 6" — the ids of the steps that only exist when logic is on. */
  includeLogicHint: (stepIds: readonly number[]) => `steps ${stepIds.join(" & ")}`,
  stepsLabel: (count: number) => `${count} steps`,
  cardLabel: (name: string, steps: string, note: string) => `${name} · ${steps} · ${note}`,
  notes: { startHere: "start here", noLogic: "no logic" },
  tags: { text: "text", model: "model", logic: "logic" },
} as const;

export type StartAccent = "teal" | "amber" | "blue";

/** One card in the "Choose a template type" gallery. */
export interface StartSample {
  /** Short display name on the card. */
  name: string;
  /** NAME of the matching sample in src/samples, loaded when the user starts with this template. */
  sampleName: string;
  /** Colour of the page spine and, for logic templates, the note. */
  accent: StartAccent;
  /** Whether picking this card turns the logic steps on. */
  logic: boolean;
  /** Short label under the tags ("start here", "no logic"). */
  note: string;
  /**
   * Preview lines: key facts from the sample's DATA ("Role: …"), then one
   * sentence from its template, so the card is scannable and truthful.
   * An empty string is a paragraph break.
   */
  body: readonly string[];
}

/** Gallery cards shown on the Start step. Loading the matching sample comes later. */
export const START_SAMPLES: readonly StartSample[] = [
  {
    name: "Counter Contract",
    sampleName: "Counter Contract (with Logic)",
    accent: "teal",
    logic: true,
    note: START.notes.startHere,
    body: [
      "Owner: Alice",
      "Maximum allowed count: 10",
      "",
      "This contract tracks a counter for Alice.",
      "Each request increments the counter by a specified amount.",
      "The counter cannot exceed 10.",
    ],
  },
  {
    name: "Employment Offer",
    sampleName: "Employment Offer Letter",
    accent: "amber",
    logic: false,
    note: START.notes.noLogic,
    body: [
      "Role: Junior AI Engineer",
      "Company: Accord Project",
      "Salary: 85,000 USD / year",
      "Start date: 1 February 2025",
      "",
      "We are pleased to offer you the position of Junior AI Engineer.",
    ],
  },
  {
    name: "Non-disclosure",
    sampleName: "Non-Disclosure Agreement",
    accent: "blue",
    logic: false,
    note: START.notes.noLogic,
    body: [
      "Parties: Accord Project · John Doe",
      "Term: 24 months",
      "Purpose: evaluating a potential business collaboration",
      "",
      "This Agreement shall remain in effect for 24 months from the effective date.",
    ],
  },
];

/**
 * NAME of the sample in src/samples to load for a card picked on the Start
 * step, or undefined when nothing (or an unknown name) is selected.
 */
export const sampleNameFor = (selectedTemplate: string | null): string | undefined => {
  if (selectedTemplate === START.blankName) return BLANK_SAMPLE_NAME;
  return START_SAMPLES.find((card) => card.name === selectedTemplate)?.sampleName;
};

export interface EditorMeta {
  icon: string;
  title: string;
  file: string;
  badge: string;
}

export const EDITOR = {
  format: "≡ format",
  copy: "⧉ copy",
  statusOk: "✓ ok",
  meta: {} satisfies Record<string, EditorMeta>,
} as const;

/** Step "Logic": logic.ts in the TypeScript editor, compiled through the store on Apply & Compile. */
export const LOGIC = {
  icon: "ƒ",
  title: "Add logic",
  subtitle:
    "Three parts, one job: the types a request carries, the starting state, and what a request actually does.",
  paneLabel: "Logic",
  file: "logic.ts",
  badge: "TypeScript",
  copy: "⧉ copy",
  copied: "logic.ts copied",
  /** Puts the playground's default init() / trigger() skeleton into an empty editor. */
  scaffold: "✦ Scaffold",
  scaffoldDone: "Skeleton inserted — fill in init() and trigger()",
  scaffoldBlocked: "The editor already has code",
  doneCount: (done: number, total: number) => `${done} of ${total} done`,
  /** Shown in the head instead of the rows once both parts are done. */
  summary: "✓ types · ✓ init() & trigger()",
  summaryTitle: "Both parts done — the rows are folded to give the editor room",
  /** The two parts of the job, as a one-line strip above the editor (mock). */
  rows: {
    types: {
      label: "Request & Response types",
      hint: "declared in model.cto",
      action: "‣",
    },
    pair: {
      label: "init() & trigger()",
      hint: "set the starting state, then respond to requests",
      action: "start writing",
    },
  },
  /** Same five states, same order, as the legacy logic panel's badge. */
  status: {
    dirty: "unsaved changes",
    compiling: "compiling…",
    failed: "compilation failed",
    compiled: "compiled",
    notCompiled: "not compiled yet",
    empty: "nothing to compile",
  },
  help: {
    checklistTitle: "BEFORE SIMULATE",
    why: {
      note:
        "Logic is optional — templates without it still render. With it, the contract responds to requests and keeps state between them.",
      links: [{ label: "Writing contract logic", href: URLS.logicDocs }],
    },
    how: [
      "Request and Response types define one run's in and out.",
      "init() returns the starting state, once.",
      "trigger() reads state + request and returns a response.",
    ],
  },
} as const;

/** Step "Text": text.md in the TemplateMark editor, wired to the app store. */
export const TEXT = {
  icon: "¶",
  title: "Write the agreement text",
  subtitle: "Plain markdown plus variables in double braces that pull values from your model.",
  paneLabel: "Text",
  file: "text.md",
  badge: "TemplateMark",
  copy: "⧉ copy",
  copied: "text.md copied",
  ok: "✓ renders",
  error: "✕ error",
  toolbarLabel: "Formatting",
  /** Buttons map onto the legacy markdown editor commands. */
  toolbar: [
    { key: "toggleBold", label: "B", title: "Bold", className: "nd-tb-bold" },
    { key: "toggleItalic", label: "I", title: "Italic", className: "nd-tb-italic" },
    { key: "toggleHeading1", label: "H1", title: "Heading 1", className: "" },
    { key: "toggleHeading2", label: "H2", title: "Heading 2", className: "" },
    { key: "toggleUnorderedList", label: "•", title: "Bulleted list", className: "" },
    { key: "insertLink", label: "↗", title: "Insert link", className: "" },
  ],
  help: {
    checklistTitle: "THIS STEP NEEDS",
    checks: { renders: "the text renders" },
    why: {
      note:
        "This is what a human signs. Every variable resolves against the model, so a typo surfaces here long before a run.",
      links: [{ label: "TemplateMark syntax", href: URLS.templateMark }],
    },
    how: [
      "Markdown handles headings, bold and lists.",
      "Double braces pull a value straight from the model.",
      "The preview re-renders on every change.",
    ],
  },
} as const;

/** Step 2: model.cto on the left, data.json on the right — both wired to the app store. */
export const MODEL_DATA = {
  icon: "⬡",
  title: "Define the model and fill in the data",
  subtitle:
    "Declare every value once as a Concerto concept on the left, then give it a concrete value on the right. Both feed the preview live.",
  format: "≡ format",
  copy: "⧉ copy",
  reset: "↺ reset",
  /** Accessible name of the × on a pane header. */
  closePane: (file: string) => `Close ${file}`,
  /** Label of the chip that brings a closed pane back. */
  reopenPane: (file: string) => `+ ${file}`,
  keepOneOpen: "Keep at least one panel open",
  model: {
    paneLabel: "Model",
    file: "model.cto",
    badge: "Concerto",
    badgeHref: URLS.concertoSite,
    badgeTitle: "Open the Concerto site",
    ok: "✓ parses",
    copied: "model.cto copied",
    formatFailed: "Fix Concerto syntax errors before formatting.",
  },
  data: {
    paneLabel: "Data",
    file: "data.json",
    badge: "instance",
    ok: "✓ valid against the model",
    /** Shown instead of the ✓ while the model itself does not parse. */
    notChecked: "○ not checked — fix the model first",
    formatFailed: "Fix JSON syntax errors before formatting.",
    resetDone: (sample: string) => `data.json reset to the ${sample} sample`,
    resetTitle: (sample: string) => `Restore the ${sample} sample data`,
    resetUnavailable: "No sample to reset to.",
  },
  /** Status of a pane whose file the app store rejected; the message itself is in the footer. */
  error: "✕ error",
  /** Content of the help rail for this step. */
  help: {
    checklistTitle: "THIS STEP NEEDS",
    checks: {
      modelParses: "the model parses",
      dataValid: "data matches model",
      /** Tag on the data check while the model does not parse. */
      needsModel: "fix model",
    },
    why: {
      note:
        "The model is the contract’s vocabulary: name a field once and the text and the logic can use it. The data is the instance you test with, checked against the model field by field.",
      links: [
        { label: "Concerto site", href: URLS.concertoSite },
        { label: "Concerto specification", href: URLS.concertoSpec },
      ],
    },
    how: [
      "A namespace + version names your model so it can be shared.",
      "Concepts declare the fields of the agreement, each with a type such as String, Integer or DateTime.",
      "The data gives those fields concrete values and is checked against the model field by field.",
      "Valid data is what the preview and the simulator run on.",
    ],
  },
} as const;

export const SIMULATE = {
  title: "Simulate",
} as const;

export const DEPLOY = {
  title: "Deploy",
  cards: ["Download PDF", "Share link", "Copy to clipboard"],
} as const;
