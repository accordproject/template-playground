# Design: Importing templates (#986)

**Issue:** [accordproject/template-playground#986](https://github.com/accordproject/template-playground/issues/986)
**Area:** Design v2 — Template step (`src/components/designV2`)
**Status:** Proposal / implementation plan

## 1. Problem

The Design v2 "Choose a template" step (`StartView` in
`src/components/designV2/views.tsx`) only offers the three bundled
samples defined in `START_SAMPLES` (`src/components/designV2/constants.ts`)
plus "+ Start blank". There is no way to bring in a template from
outside the app.

The issue asks for three additional entry points on that step:

1. **Import from the Accord Project Template Library** — browse/search
   https://templates.accordproject.org/ and load a template by name + version.
2. **Upload from disk** — a `.cta` archive (and ideally a template
   directory/zip).
3. **Import from an external library** — a generic "load from URL"
   (`.cta` URL, or a library index), designed so a named external
   library can be added later without code changes.

## 2. Current architecture (what exists today)

| Concern | File | Notes |
|---|---|---|
| Gallery UI | `src/components/designV2/views.tsx` (`StartView`, `SampleCard`) | Renders `START_SAMPLES` as cards; "+ Start blank" button |
| Gallery data | `src/components/designV2/constants.ts` (`START_SAMPLES`, `sampleNameFor`) | Hardcoded array of `{ name, sampleName, accent, art, tagline, demonstrates }` |
| Picking a card | `src/components/designV2/usePickTemplate.ts` | `selectTemplate(name)` in the v2 store, then `loadSample(sampleName)` in the app store |
| Loading a sample | `src/store/store.ts` → `loadSample(name)` | Looks up `name` in the static `SAMPLES` array (`src/samples/*`) and copies its `TEMPLATE`/`MODEL`/`DATA`/`LOGIC` straight into store fields |
| Building an archive (existing, but the *reverse* direction) | `src/store/store.ts` → `buildTemplateFromMemory()` | Zips the *current* `templateMarkdown` + `modelCto` + `logicTs` in-memory with JSZip, injects `BUNDLED_MODELS` for offline resolution, calls `Template.fromArchive(buffer, { offline: true })` from `@accordproject/cicero-core`, stores the resulting `Template` in `templateObject`. Used before compiling logic. |

**The gap:** nothing currently goes from a real `.cta`/archive *into*
the store's editable fields. `loadSample` only knows about the
bundled, in-memory `SAMPLES` array.

### 2.1 Relevant `@accordproject/cicero-core` API (confirmed against the installed `^1.0.1`)

`Template.fromArchive(buffer, options)` returns a `Template` instance
with everything needed to repopulate the editors:

- `template.getTemplate()` → `string` — the TemplateMark grammar (→ `text.md` content, maps to `templateMarkdown`).
- `template.getModelManager().getModels()` → `Array<{ name, content }>`-shaped models (via concerto-core `ModelManager`) — the `.cto` model file(s) (→ `modelCto`).
- `template.getScriptManager().getScripts()` → map of scripts, each with `.getIdentifier()`, `.getLanguage()`, `.getContents()` — the `logic/*.ts` source(s) (→ `logicTs`). Note this is the *source*, not `compiledLogicJs`, matching what the editor needs.
- `template.getMetadata().getSamples()` → `{ [locale]: string }` sample text, if the archive shipped one.
- `template.getMetadata().getRequest()` → sample request JSON, if the archive shipped one.
- `template.getMetadata().getName() / getVersion() / getDisplayName()` — for labeling the imported template in the UI (the "✓ current" badge, sample name shown elsewhere).
- `template.validate({ offline: true })` — throws with details on a malformed template; use this to produce a clean error instead of a crash.

This is the mirror image of what `buildTemplateFromMemory` already
does, so the same import (`@accordproject/cicero-core`), the same
`{ offline: true }` option, and the same `BUNDLED_MODELS` injection
pattern (for resolving external model imports without a network call)
apply here.

## 3. Proposed design

### 3.1 One shared core: `loadFromArchive`

Add a single store action that every entry point funnels through, so
upload / URL / library-browse all share one tested code path:

```ts
// src/store/store.ts

/**
 * Parses a .cta archive (or equivalent zip of a template directory)
 * and replaces the current template/model/logic/data with its contents,
 * the same way loadSample does for a bundled sample.
 */
loadFromArchive: (buffer: Uint8Array, label: string) => Promise<void>;
```

Implementation sketch:

```ts
loadFromArchive: async (buffer, label) => {
  set({ error: undefined });
  try {
    const { Template } = await import("@accordproject/cicero-core");
    const { Buffer } = await import("buffer");

    const template = await Template.fromArchive(Buffer.from(buffer), {
      offline: true,
    });
    template.validate({ offline: true }); // throws with a useful message on malformed input

    const templateMarkdown = template.getTemplate() ?? "";
    const modelCto = template
      .getModelManager()
      .getModels()
      .map((m) => m.content)
      .join("\n\n");
    const scripts = template.getScriptManager().getScripts();
    const logicTs = scripts.length ? scripts[0].getContents() : "";

    const samples = template.getMetadata().getSamples();
    const sampleText = samples?.en ?? Object.values(samples ?? {})[0] ?? "";
    const request = template.getMetadata().getRequest();
    const requestJson = request
      ? JSON.stringify(request, null, 2)
      : '{\n  "$class": "..."\n}'; // same fallback loadSample uses

    const hasLogic = !!logicTs && get().isLogicFeatureEnabled;

    set(() => ({
      sampleName: template.getMetadata().getDisplayName() || label,
      agreementHtml: undefined,
      error: undefined,
      templateMarkdown,
      editorValue: templateMarkdown,
      modelCto,
      editorModelCto: modelCto,
      data: sampleText,
      editorAgreementData: sampleText,
      requestJson,
      logicTs,
      editorLogicTs: logicTs,
      compiledLogicJs: null,
      compilationErrors: [],
      isCompiling: false,
      executionState: "",
      executionEvents: "",
      executionResponse: "",
      executionHistory: [],
      isLogicPanelVisible: hasLogic,
      isContractRunnerVisible: hasLogic,
      isPreviewVisible: !hasLogic,
    }));

    savePanelState({
      ...get(),
      isLogicPanelVisible: hasLogic,
      isContractRunnerVisible: hasLogic,
      isPreviewVisible: !hasLogic,
    });
  } catch (err) {
    set({
      error:
        err instanceof Error
          ? `Couldn't import "${label}": ${err.message}`
          : `Couldn't import "${label}".`,
    });
    throw err; // let the calling UI decide how to surface this too
  }
},
```

Notes:
- Mirrors `loadSample`'s field list exactly, so every later step
  (Text/Model/Logic/Simulate) behaves identically regardless of
  where the template came from.
- Errors are caught and turned into the store's existing `error`
  field (already rendered by the Footer's error pill) rather than
  throwing into the UI — but it's re-thrown too, so a calling modal
  can also keep its own "still loading" state in sync.
- `sample` model handling assumes one primary model; if a template
  ships multiple `.cto` files, concatenation is fine since the editor
  treats `modelCto` as a single blob today (matches current
  single-file assumption already made by `SAMPLES`).

### 3.2 v2 store: representing a non-gallery "current" template

`selectedTemplate` in the v2 store today is expected to match a
`START_SAMPLES[].name`, which is how `StartView`/`SampleCard` render
the "✓ current" badge. An imported template isn't one of those cards,
so:

- Extend `selectTemplate` calls to accept an arbitrary label (already
  just a `string`, so no type change needed).
- In `StartView`, when `selectedTemplate` doesn't match any
  `START_SAMPLES[].name` or `START.blankName`, show a small
  "Imported: `<label>`" chip near the header instead of highlighting
  a card — so the user still gets confirmation of what's loaded.

### 3.3 UI: three new entry points in `StartView`

Add a row of secondary entry points under the existing card grid
(kept visually secondary to the curated cards, per the issue's
"additional entry points... alongside the cards" framing):

```
[+ Start blank]                                   (existing)
[Upload a .cta file]  [Load from a URL]  [Browse the template library]
```

Each opens its own small `Modal` (Antd is already used elsewhere in
this codebase, e.g. help rail / preview drawer patterns):

**a) Upload from disk**
- Hidden `<input type="file" accept=".cta,.zip">` triggered by the
  button.
- `file.arrayBuffer()` → `Uint8Array` → `loadFromArchive(bytes, file.name)` → on success `goNext()`, same as `usePickTemplate`.
- "ideally a template directory/zip": a plain zip of a template
  folder (`text/`, `model/`, `logic/`, `package.json`) has the same
  layout as a `.cta`; confirm during implementation whether
  `Template.fromArchive` accepts it directly or needs re-zipping
  through JSZip first (the archive format is a zip either way — the
  difference is mainly the file extension convention).

**b) Load from URL**
- Modal with a single URL input + "Load" button.
- `fetch(url)` → `.arrayBuffer()` → `loadFromArchive`.
- Distinguish two failure modes in the modal's error text:
  - **CORS/network failure** — the app has no server-side proxy, so
    a third-party host must itself allow cross-origin GETs; tell the
    user this plainly rather than showing a generic error.
  - **Fetched but invalid** — surface the message from
    `loadFromArchive`'s thrown error (from `template.validate()`).
- This modal is intentionally generic (URL in, template loaded) —
  see 3.4, it's reused by the library browser rather than duplicated.

**c) Browse the Accord Project Template Library**
- Modal with a search box and a list (name, version, short
  description) fetched from the template library's index — see 3.5
  for the open question on where that index comes from.
- Selecting a template + version resolves to a `.cta` download URL,
  then delegates to the same code path as 3.4 (b) — this modal never
  fetches/parses a `.cta` itself, it only resolves *which* URL to
  load, per the issue's "design the entry point so a named external
  library can be added later" requirement.

### 3.4 Designing for future external libraries

To satisfy "design the entry point so a named external library can
be added later without code changes," keep the URL-loading path
(3.3b) as the single choke point every "library" resolves to:

```ts
// src/components/designV2/templateLibraries.ts
export interface TemplateLibrary {
  id: string;
  label: string;
  /** Returns a searchable list of entries for this library. */
  search: (query: string) => Promise<LibraryEntry[]>;
  /** Resolves one entry to a downloadable .cta URL. */
  resolveUrl: (entry: LibraryEntry) => string;
}

export interface LibraryEntry {
  name: string;
  version: string;
  description?: string;
}
```

- `templates.accordproject.org` becomes the first entry in a
  `TEMPLATE_LIBRARIES: TemplateLibrary[]` array.
- The library-browser modal takes a `TemplateLibrary` as a prop and
  is otherwise generic; adding a second named library later is
  registering one more object in that array plus a picker if there's
  more than one, not new fetch/parse code.

### 3.5 Open question: the Accord Project library index

`templates.accordproject.org` is generated from the
[`cicero-template-library`](https://github.com/accordproject/cicero-template-library)
repo. Before building 3.3(c), confirm one concrete, CORS-fetchable
source of truth for "list of templates + versions + `.cta` URLs":

- Check whether `templates.accordproject.org` publishes a generated
  JSON/sitemap index (fastest path if it exists).
- Fall back to the GitHub API against `cicero-template-library` (list
  directory contents / releases) if not — GitHub's API allows CORS
  from the browser, so no proxy needed either way.
- Whichever is chosen, isolate it behind the `search`/`resolveUrl`
  functions in 3.4 so the rest of the UI doesn't care.

This is called out explicitly because it's the one sub-feature that
depends on an external, unconfirmed contract — worth a short spike
before committing to the modal's exact shape.

## 4. Suggested PR sequence

1. **`loadFromArchive` core** (§3.1) + unit tests: build a known-good
   `.cta` via the existing `buildTemplateFromMemory` path (or a fixed
   test fixture) and round-trip it through `loadFromArchive`,
   asserting the store fields match. Also test the error path with a
   deliberately malformed buffer.
2. **Upload from disk** (§3.3a) wired to the core action — fully
   local, no network/CORS unknowns, smallest reviewable UI change.
3. **Load from URL** (§3.3b) — reuses the core action; the new
   surface area is just the modal + `fetch` + the two error-message
   branches.
4. **Template library browser** (§3.3c, §3.4) — after the §3.5 spike
   confirms the index source; this one modal produces a URL and
   defers to step 3's loading path rather than re-implementing it.

Each PR is independently reviewable and mergeable, and steps 2–4 all
depend only on step 1, not on each other.

## 5. Testing notes

- `loadFromArchive`: unit tests in `src/store` mirroring the existing
  `loadSample` tests, plus a malformed-archive case.
- Upload/URL modals: component tests following the existing pattern
  in `src/tests/components/designV2/StartView.test.tsx`.
- E2E: extend `e2e/template-workflow.spec.ts` with one flow that
  uploads a small fixture `.cta` and asserts the Text/Model/Logic
  steps reflect its contents.
- Manual: verify the "✓ current" / "Imported: …" chip behavior (§3.2)
  when navigating back to the Template step after an import.
