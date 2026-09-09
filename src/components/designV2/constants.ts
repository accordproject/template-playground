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
  concertoTypes: "https://concerto.accordproject.org/docs/design/specification/model-properties",
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
  scaffoldFromModel: "✦ Scaffold from model",
  format: "≡ format",
  copy: "⧉ copy",
  statusOk: "✓ ok",
  meta: {
    text: { icon: "¶", title: "Write the contract text", file: "text.md", badge: "TemplateMark" },
    logic: { icon: "ƒ", title: "Add the logic", file: "logic.ts", badge: "TypeScript" },
  } satisfies Record<string, EditorMeta>,
} as const;

/** Step 3: model.cto on the left, data.json on the right — both wired to the app store. */
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
  /** Prefix in front of a rebuild error shown in a status bar. */
  errorPrefix: "✕",
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
        { label: "Concerto types cheat sheet", href: URLS.concertoTypes },
        { label: "What @template does", href: URLS.engineDocs },
      ],
    },
    how: [
      "A namespace + version names your model so it can be shared.",
      "The concept marked @template is the template model: its fields are the variables the text refers to with {{ }}.",
      "$class in the data points at that concept, and every required field is checked against its type.",
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
