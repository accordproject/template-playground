/**
 * User-facing strings, URLs and routes for the design-v2 layout.
 * Components import from here instead of embedding literals, so copy can be
 * reviewed and changed in one place (and later localised).
 */

export const URLS = {
  discord: "https://discord.com/invite/Zm99SKhhtA",
  github: "https://github.com/accordproject/template-playground",
  readme: "https://github.com/accordproject/template-playground/blob/main/README.md",
  issues: "https://github.com/accordproject/template-playground/issues",
  engineDocs: "https://github.com/accordproject/template-engine/blob/main/README.md",
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
  subtitleLine2: "Seven steps, no setup.",
  start: "Start building",
  howItWorks: "How it works ↗",
} as const;

export const START = {
  title: "Choose a template type",
  hint: "everything stays editable later",
  blank: "+ Blank",
  draftWithAi: "✦ Draft with AI",
  includeLogic: "include logic",
  includeLogicHint: (dataStep: number, logicStep: number) => `steps ${dataStep} & ${logicStep}`,
  sampleCardLabel: (index: number) => `Template ${index}`,
  sampleCount: 3,
} as const;

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
    model: { icon: "◇", title: "Define the data model", file: "model.cto", badge: "Concerto" },
    data: { icon: "{}", title: "Fill in the data", file: "data.json", badge: "instance" },
    logic: { icon: "ƒ", title: "Add the logic", file: "logic.ts", badge: "TypeScript" },
  } satisfies Record<string, EditorMeta>,
} as const;

export const SIMULATE = {
  title: "Simulate",
} as const;

export const DEPLOY = {
  title: "Deploy",
  cards: ["Download PDF", "Share link", "Copy to clipboard"],
} as const;
