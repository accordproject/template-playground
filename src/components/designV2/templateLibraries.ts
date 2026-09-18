export interface LibraryEntry {
  name: string;
  version: string;
  description?: string;
  url?: string;
}

export interface TemplateLibrary {
  id: string;
  label: string;
  /** Returns a searchable list of entries for this library. */
  search: (query: string) => Promise<LibraryEntry[]>;
  /** Resolves one entry to a downloadable .cta URL. */
  resolveUrl: (entry: LibraryEntry) => string;
}

export const BUILTIN_LIBRARY_ENTRIES: LibraryEntry[] = [
  {
    name: "helloworld",
    version: "0.13.0",
    description: "A simple hello world contract template.",
  },
  {
    name: "acceptance-of-delivery",
    version: "0.13.0",
    description: "Acceptance of delivery contract template.",
  },
  {
    name: "latedeliveryandpenalty",
    version: "0.16.0",
    description: "Late delivery and penalty contract clause.",
  },
  {
    name: "per-item-fine",
    version: "0.3.0",
    description: "Per-item fine clause for delayed items.",
  },
  {
    name: "copyright-license",
    version: "0.13.0",
    description: "Standard copyright license agreement.",
  },
];

export const ACCORD_PROJECT_LIBRARY: TemplateLibrary = {
  id: "accordproject",
  label: "Accord Project Template Library",
  search: (query: string) => {
    const q = query.toLowerCase().trim();
    const results = !q
      ? BUILTIN_LIBRARY_ENTRIES
      : BUILTIN_LIBRARY_ENTRIES.filter(
          (entry) =>
            entry.name.toLowerCase().includes(q) ||
            (entry.description && entry.description.toLowerCase().includes(q))
        );
    return Promise.resolve(results);
  },
  resolveUrl: (entry: LibraryEntry) => {
    if (entry.url) return entry.url;
    return `https://templates.accordproject.org/archives/${entry.name}@${entry.version}.cta`;
  },
};

export const TEMPLATE_LIBRARIES: TemplateLibrary[] = [ACCORD_PROJECT_LIBRARY];
