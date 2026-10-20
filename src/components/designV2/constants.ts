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
  /** Docs site: what a template is made of (text, model, logic). "How it works" on the hero opens it. */
  templateDocs: "https://docs.accordproject.org/docs/accordproject-template/",
  /** Docs site tutorial for developing templates in VS Code; the hero's note links to it. */
  vscodeTutorial: "https://docs.accordproject.org/docs/tutorial-vscode/",
  apapDeploy: "https://docs.accordproject.org/docs/ref-apap/#deploy-a-template",
  vscodeDev: "https://vscode.dev/",
  apapMcp: "https://docs.accordproject.org/docs/ref-apap/#mcp-support-experimental",
  templateLibrary: "https://templates.accordproject.org/",
} as const;

export const RAIL = {
  navLabel: "Playground navigation",
  menuButton: "Playground menu",
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
  stepperLabel: "Steps",
  /** Under a step the flow passes over (Simulate for a template without logic), and its tooltip. */
  skippedMeta: "no logic",
  skippedHint: "This template has no logic. Add some on the Logic step to simulate it.",
  links: {
    about: "About",
    community: "Community",
    issues: "Issues",
    documentation: "Documentation",
  },
} as const;

export const FOOTER = {
  noProblems: "✓ no problems",
  /** Problems pill while the app store reports an error; the full message follows it. */
  problem: "✕ error",
  problemLabel: "Problem",
  /** Problems pill on the Simulate step: "✕ 1 failed run · run #3" */
  failedRuns: (count: number, lastId: string) =>
    `✕ ${count} failed ${count === 1 ? "run" : "runs"} · run ${lastId}`,
  back: "← Back",
  next: "Next →",
  /** Toast when a move to Simulate is refused because the logic does not compile. */
  logicBlocked: "The logic doesn’t compile — fix the error on the Logic step before simulating.",
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
  /** The Write | Preview switch in the Text and Data step headers, and its accessible name. */
  write: "Write",
  preview: "Preview",
  toggleLabel: "Write or preview",
  title: "Preview",
  liveBadge: "live",
  pdf: "↓ PDF",
  markdown: "↓ Markdown",
  markdownFailed: "Couldn’t create the Markdown — try again.",
  /** File name of the PDF the preview's PDF button saves. */
  pdfFile: "agreement.pdf",
  pdfFailed: "Couldn’t create the PDF — try again.",
  /** Shown until the first render arrives. */
  rendering: "Rendering the agreement…",
  /** Shown when nothing has rendered and the last render failed; the footer carries the error. */
  failed: "The agreement can’t be rendered yet — the problem is shown at the bottom.",
} as const;

export const WELCOME = {
  /** Accessible name of the Accord Project wordmark in the hero. */
  logoAlt: "Accord Project",
  logoSrc: "/APLogo.png",
  titleLine: "Agreements for people,",
  titleAccent: "agents and systems.",
  subtitleLine1: "Write terms that people and agents can read, and that agents and systems can execute.",
  subtitleLine2: "Build, test and deploy a template in your browser.",
  /** Muted note under the buttons: what the playground is for, and where development continues. */
  ideNote:
    "A playground, not an IDE: it walks you through how a template is built and lets you prototype and experiment quickly. When a template is ready for more, download it from the Deploy step and keep developing in your own editor, such as VS Code, or with an AI coding agent.",
  /** Opens URLS.vscodeTutorial in a new tab. */
  ideNoteLink: "VS Code tutorial ↗",
  start: "Start building",
  /** Opens URLS.templateDocs in a new tab. */
  howItWorks: "How it works ↗",
} as const;

export const START = {
  title: "Choose a template",
  hint: "everything stays editable later",
  blankName: "Blank template",
  /** Primary button on every card: pick the template and open the first editor step. */
  open: "Start with this template →",
  /** Accessible name of a card's button, so each one is distinct: "Start with Counter Contract". */
  openLabel: (name: string) => `Start with ${name}`,
  /** Tag on the card whose template is currently loaded (shown after coming back from a later step). */
  current: "✓ current",
  /** Accessible name of the list of things a card's template demonstrates. */
  learnLabel: (name: string) => `What ${name} demonstrates`,
} as const;

export type StartAccent = "teal" | "amber" | "blue" | "ink";
/** Which line-art illustration (see SampleArt.tsx) a card shows. */
export type StartArt = "variables" | "clauses" | "logic" | "blank";

/** One card in the "Choose a template type" gallery. */
export interface StartSample {
  /** Short display name on the card. */
  name: string;
  /** NAME of the matching sample in src/samples, loaded when the user starts with this template. */
  sampleName: string;
  /** Colour of the card's spine and illustration. */
  accent: StartAccent;
  /** Illustration at the top of the card. */
  art: StartArt;
  /** One line under the name: what the template is, in plain words. */
  tagline: string;
  /**
   * Two or three short points on what the reader learns from this template —
   * the reason to pick it over the others. The gallery is a curated set, so
   * this matters more than a text preview. Empty on the blank card.
   */
  demonstrates: readonly string[];
}

/**
 * Gallery cards shown on the Start step: three real agreements, in the order
 * of a tour of what a template can do — text with variables, then text that
 * depends on the data, then logic that keeps score. The first two ship no
 * logic; the Logic step offers a skeleton for them.
 */
export const START_SAMPLES: readonly StartSample[] = [
  {
    name: "Consulting Agreement",
    sampleName: "Consulting Agreement",
    accent: "teal",
    art: "variables",
    tagline: "Agreement text with the details filled in.",
    demonstrates: [
      "Parties, fees and dates as named variables",
      "Each variable declared once in the data model",
      "Change the data and the agreement re-renders",
    ],
  },
  {
    name: "Residential Lease",
    sampleName: "Residential Lease",
    accent: "amber",
    art: "clauses",
    tagline: "Clauses that appear only when they apply.",
    demonstrates: [
      "A parking clause only when there is a space",
      "Pets allowed or not — one sentence each",
      "Rent formatted, deposit worked out from it",
    ],
  },
  {
    name: "Late Payment Penalty",
    sampleName: "Late Payment Penalty (with Logic)",
    accent: "blue",
    art: "logic",
    tagline: "Terms that compute and keep score.",
    demonstrates: [
      "A penalty worked out per day overdue",
      "Capped at a share of the invoice",
      "Remembers the running total between payments",
    ],
  },
];

/**
 * Fourth gallery card: the empty template, styled like the others so the
 * choice reads as one set of options. Not in START_SAMPLES because it ships
 * no logic, so it is not part of the "every card walks the same steps" rule.
 */
export const START_BLANK: StartSample = {
  name: START.blankName,
  sampleName: BLANK_SAMPLE_NAME,
  accent: "ink",
  art: "blank",
  tagline: "An empty text, model and data — write your own agreement from scratch.",
  demonstrates: [],
};

/**
 * NAME of the sample in src/samples to load for a card picked on the Start
 * step, or undefined when nothing (or an unknown name) is selected.
 */
export const sampleNameFor = (selectedTemplate: string | null): string | undefined => {
  if (selectedTemplate === START.blankName) return BLANK_SAMPLE_NAME;
  return START_SAMPLES.find((card) => card.name === selectedTemplate)?.sampleName;
};

/** Step "Logic": logic.ts in the TypeScript editor, compiled through the store when this step or Simulate opens. */
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
  copyFailed: "Couldn't copy — the clipboard is not available here",
  doneCount: (done: number, total: number) => `${done} of ${total} done`,
  chipsLabel: "Progress",
  /** Tag on the types chip: the request/response transactions found in model.cto, or that they are missing. */
  typesFound: (request: string, response: string) => `${request} → ${response}`,
  typesMissing: "not in model.cto",
  typesMissingHint: "Declare a request and a response transaction in model.cto",
  /** Shown in place of the editor while there is no logic; the button writes the model-based skeleton. */
  empty: {
    title: "This template has no logic",
    body:
      "It renders its text from the data alone, so Simulate is skipped. Add logic to give the contract state and let it respond to requests.",
    start: "Start from boilerplate",
  },
  /** The two parts of the job, as chips in the card head; the hints are their tooltips. */
  chips: {
    types: {
      label: "Request & Response types",
      hint: "declared in model.cto",
      action: "model.cto ‣",
    },
    pair: {
      label: "init() & trigger()",
      hint: "set the starting state, then respond to requests — compiled when you open this step or Simulate",
    },
  },
  /** Same states, same order, as the legacy logic panel's badge; there is no compile button, Simulate compiles. */
  status: {
    /** Editing shows no state text; the empty icon says enough until the next compile. */
    dirty: "",
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
        "This is what a human signs or an agent reads. Every variable resolves against the data model, so a typo surfaces here long before execution.",
      links: [{ label: "TemplateMark syntax", href: URLS.templateMark }],
    },
    how: [
      "Markdown handles headings, bold and lists.",
      "Double braces pull a value straight from the model.",
      "The preview re-renders on every change.",
    ],
  },
} as const;

/** Step "Data": model.cto on the left, data.json on the right — both wired to the app store. */
export const MODEL_DATA = {
  icon: "⬡",
  title: "Model the data",
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

/**
 * Step "Simulate". Plain words on purpose: the contract is "started" and
 * "sent a message", not initialised and sent a request — the request /
 * response vocabulary stays on the Logic step where the types are declared.
 */
export const SIMULATE = {
  title: "Simulate",
  restart: "↺ restart",
  restartHint: "Start the contract again and clear the runs",
  runsLabel: "Runs",
  /** "3 runs · 2 ok · 1 failed" — the pill next to the title. */
  stats: (runs: number, ok: number, failed: number) =>
    `${runs} ${runs === 1 ? "run" : "runs"} · ${ok} ok · ${failed} failed`,
  noRuns: "Nothing has happened yet — start the contract to get its opening state.",
  init: "▶ Start the contract",
  newRequest: "Send a message to the contract",
  json: "json",
  reuse: (id: string) => `reuse ${id} ▾`,
  reuseMenuLabel: "Reuse an earlier message",
  send: "▶ Send",
  sendHintNoInit: "Start the contract before sending a message",
  request: "Message",
  requestActions: "copy",
  copied: "copied",
  /** Tabs under the request — the same three the legacy ContractExecutionTabs shows. */
  resultLabel: "Result",
  response: "Response",
  errorTab: "Error",
  stateAfter: "State after",
  /** "Events (2)" */
  eventsTab: (count: number) => `Events (${count})`,
  /** "thrown in trigger() — state was left unchanged" */
  thrownIn: (method: string) => `thrown in ${method}() — state was left unchanged`,
  /** Second line of the error pane when the message never reached the logic. */
  notSent: "the message was not sent — fix the JSON and send again",
  openTrigger: "open trigger() ↗",
  stateUnchanged: "This run failed, so the state is the same as before it.",
  noState: "No state — init() did not return one.",
  rerun: "↻ re-run",
  noSelection: "Pick a run on the left to see what was sent and what came back.",
  status: { ok: "✓ ok", failed: "✕ failed" },
  summary: {
    init: "contract initialised",
    initFailed: "init() threw",
    triggerFailed: "trigger() threw",
    invalidRequest: "message is not valid JSON",
  },
  /**
   * The dialog shown instead of a runnable contract. The logic is compiled
   * before this step opens, so the only reason left is that none was written.
   */
  blocked: {
    title: "This template has no logic yet",
    body: "Simulate runs the contract’s logic against the messages you send. This template has none — open the Logic step and write init() and trigger(); a skeleton built from your data model is waiting there.",
    stay: "Stay here",
    openLogic: "Open the Logic step",
  },
} as const;

/** One card on the Deploy step. A card with an `href` links out; one without runs `action`. */
export interface DeployCard {
  title: string;
  /** Which icon (see DeployView.tsx) heads the card. */
  icon: "pdf" | "markdown" | "link" | "copy" | "archive" | "server" | "code" | "mcp" | "vscode";
  /** One line under the title: what the card does and where it leads. */
  description: string;
  /** Two or three short points: what you get, or what you need. */
  details: readonly string[];
  /** Label of the card's button. */
  button: string;
  /** Docs page opened in a new tab (the button then carries the ↗ glyph). */
  href?: string;
  /** Which in-app action the button runs when there is no `href`. */
  action?: "pdf" | "markdown" | "share" | "copy" | "archive" | "vscode";
  /** A second, link-only button under the main one. */
  secondary?: { label: string; href: string };
  /** Toast shown when the action succeeds. */
  done?: string;
}

/** A row of Deploy cards under its own heading. */
export interface DeployGroup {
  title: string;
  subtitle: string;
  /** Colour of the group's icon tiles. */
  accent: "teal" | "blue";
  cards: readonly DeployCard[];
}

export const DEPLOY = {
  title: "Deploy",
  subtitle: "Send the agreement to people, or run the template somewhere else.",
  groups: [
    {
      title: "Share the agreement",
      subtitle: "The rendered text, as a signer would read it.",
      accent: "teal",
      cards: [
        {
          title: "Download PDF",
          icon: "pdf",
          description: "Save the rendered agreement as a PDF to share or sign.",
          details: ["A4, black on white", "Uses the data from the Data step"],
          button: "Download PDF",
          action: "pdf",
          done: "PDF downloaded",
        },
        {
          title: "Download Markdown",
          icon: "markdown",
          description: "Save the rendered agreement as a Markdown file for docs, wikis or a pull request.",
          details: ["Headings, lists and emphasis kept", "Uses the data from the Data step"],
          button: "Download .md",
          action: "markdown",
          done: "Markdown downloaded",
        },
        {
          title: "Share link",
          icon: "link",
          description: "Copy a link that opens this template in the Playground.",
          details: ["Carries the text, model, data and logic", "Nothing is uploaded — it is all in the link"],
          button: "Copy link",
          action: "share",
          done: "Link copied",
        },
        {
          title: "Copy to clipboard",
          icon: "copy",
          description: "Copy the rendered agreement text.",
          details: ["Plain text, paragraphs kept", "Paste into an email or a document"],
          button: "Copy text",
          action: "copy",
          done: "Agreement text copied",
        },
      ],
    },
    {
      title: "Run the template elsewhere",
      subtitle: "The template itself — text, model and logic — for other tools and services.",
      accent: "blue",
      cards: [
        {
          title: "Download template archive",
          icon: "archive",
          description:
            "Save the template as a .cta archive you can version, publish or load anywhere Accord Project tooling runs.",
          details: ["Text, model, logic and sample data", "Re-import it here with “Upload a file”"],
          button: "Download .cta",
          action: "archive",
          done: "Template archive downloaded",
        },
        {
          title: "Open in vscode.dev",
          icon: "vscode",
          description:
            "Save the template as a folder on your computer and open it in VS Code for the Web to keep editing it there.",
          details: [
            "First save the folder, then open vscode.dev",
            "There, choose File › Open Folder and pick the saved folder",
            "Chrome or Edge — they can save folders",
          ],
          button: "1. Save as folder",
          action: "vscode",
          secondary: { label: "2. Open vscode.dev", href: URLS.vscodeDev },
        },
        {
          title: "Deploy to an APAP server",
          icon: "server",
          description:
            "Publish the template to an Agreement Protocol server so apps and services can create and trigger agreements over REST.",
          details: ["Upload the .cta archive to the server", "Create agreements and trigger them over REST"],
          button: "APAP deploy guide",
          href: URLS.apapDeploy,
        },
        {
          title: "Embed in your app",
          icon: "code",
          description: "Use the template engine from your own code to draft, validate and execute this template.",
          details: ["An npm package for Node.js and the browser", "The same engine this playground runs"],
          button: "Template engine docs",
          href: URLS.engineDocs,
        },
        {
          title: "Deploy to an MCP server",
          icon: "mcp",
          description:
            "Expose the template to AI assistants (Claude, Cursor, …) through the Model Context Protocol endpoint of an APAP server.",
          details: ["Agents can draft and trigger agreements", "Experimental — part of the APAP server"],
          button: "MCP support docs",
          href: URLS.apapMcp,
        },
      ],
    },
  ] satisfies readonly DeployGroup[],
  failed: (title: string) => `${title} failed`,
  /** Toasts for the vscode.dev card. */
  folderSaved: (folder: string) =>
    `Saved the template to “${folder}”. Now open vscode.dev, choose File › Open Folder and pick it.`,
  noFolderSupport:
    "This browser can’t save folders, so the template was downloaded as a .cta (a zip). Unzip it, then open the folder in vscode.dev from Chrome or Edge, or in desktop VS Code.",
  renderError: "The agreement doesn’t render with the current text, model and data — fix the error and try again.",
} as const;

/** Every Deploy card, in display order. */
export const DEPLOY_CARDS: readonly DeployCard[] = DEPLOY.groups.flatMap((g): readonly DeployCard[] => g.cards);

/** The three ways to bring in a template, beside the gallery cards on the Template step. */
export const IMPORT = {
  title: "Or bring your own",
  groupLabel: "Import a template",
  library: {
    button: "Template library",
    hint: "Browse templates.accordproject.org",
    modalTitle: "Import from the Accord Project template library",
    search: "Search by name or description",
    typeLabel: "Type",
    typeAll: "All types",
    types: ["Contract", "Clause"] as const,
    categories: "Categories",
    showArchived: "Show archived templates",
    clear: "Clear",
    /** "12 templates shown" */
    count: (n: number) => `${n} ${n === 1 ? "template" : "templates"} shown`,
    compatibleNote: "Only templates that run in the playground are listed (TypeScript templates, Cicero 2.0 and later).",
    untagged: "Other",
    archived: "Archived",
    loading: "Loading the library…",
    empty: "No templates match.",
    loadFailed: (reason: string) => `The library could not be loaded: ${reason}`,
    pick: (name: string, version: string) => `Import ${name} ${version}`,
    use: "Import",
  },
  upload: {
    button: "Upload a file",
    hint: "A .cta template archive (Cicero 2.0 or later)",
    inputLabel: "Template archive (.cta)",
    accept: ".cta,.zip",
  },
  url: {
    button: "From a URL",
    hint: "A .cta link, e.g. from another library",
    modalTitle: "Import from a URL",
    label: "Archive URL",
    placeholder: "https://example.org/archives/my-template@1.0.0.cta",
    submit: "Import",
    cancel: "Cancel",
  },
  imported: (name: string) => `Imported ${name}`,
  failed: (reason: string) => `Import failed: ${reason}`,
} as const;
