/**
 * Fetching templates from the Accord Project template library and from
 * arbitrary URLs. A "library" is a base URL serving `template-library.json`
 * (name@version → metadata) and `archives/<name>@<version>.cta`; the Accord
 * Project one is the first entry in LIBRARIES, and adding another is one line.
 */
import { ciceroVersion } from "./cicero";

export interface TemplateLibrary {
  id: string;
  label: string;
  /** Base URL, no trailing slash. */
  baseUrl: string;
}

export const LIBRARIES: readonly TemplateLibrary[] = [
  { id: "accord", label: "Accord Project template library", baseUrl: "https://templates.accordproject.org" },
];

export interface LibraryTemplate {
  name: string;
  /** Human name, e.g. "Late Delivery and Penalty"; falls back to name. */
  displayName: string;
  version: string;
  description: string;
  /** The library's two template types. */
  type: "Contract" | "Clause";
  /** Categories, e.g. finance or shipping; the dialog groups by these. */
  tags: string[];
  /** Kept for reference but no longer maintained; hidden unless asked for. */
  archived: boolean;
  /** Cicero range the template targets, e.g. "^2.0.0". */
  ciceroVersion: string;
  /** Archive URL as published in the index, when it gives one. */
  url?: string;
}

export const archiveUrl = (library: TemplateLibrary, template: Pick<LibraryTemplate, "name" | "version" | "url">): string =>
  template.url ?? `${library.baseUrl}/archives/${template.name}@${template.version}.cta`;

interface IndexEntry {
  name?: unknown;
  displayName?: unknown;
  version?: unknown;
  description?: unknown;
  type?: unknown;
  tags?: unknown;
  archived?: unknown;
  ciceroVersion?: unknown;
  url?: unknown;
}

/**
 * A library's templates that run in this playground, by cicero-core's own
 * TemplateLibrary filters: the versions this Cicero accepts
 * (filterTemplateIndexCiceroVersion, see ciceroAccepts), then the newest of
 * each template (filterTemplateIndexLatestVersion; the hosted library lists
 * one row per template too). Sorted by display name.
 */
export const parseLibraryIndex = async (index: Record<string, IndexEntry>): Promise<LibraryTemplate[]> => {
  const { TemplateLibrary } = await import("@accordproject/cicero-core");
  const compatible = TemplateLibrary.filterTemplateIndexCiceroVersion(index, await ciceroVersion()) as Record<string, IndexEntry>;
  const latest = TemplateLibrary.filterTemplateIndexLatestVersion(compatible) as Record<string, IndexEntry>;
  const templates: LibraryTemplate[] = [];
  for (const e of Object.values(latest)) {
    if (typeof e.name !== "string" || typeof e.version !== "string") continue;
    templates.push({
      name: e.name,
      displayName: typeof e.displayName === "string" && e.displayName ? e.displayName : e.name,
      version: e.version,
      description: typeof e.description === "string" ? e.description : "",
      type: e.type === 1 ? "Clause" : "Contract",
      tags: Array.isArray(e.tags) ? e.tags.filter((t): t is string => typeof t === "string") : [],
      archived: e.archived === true,
      ciceroVersion: typeof e.ciceroVersion === "string" ? e.ciceroVersion : "",
      url: typeof e.url === "string" && /^https:\/\//.test(e.url) ? e.url : undefined,
    });
  }
  return templates.sort((a, b) => a.displayName.localeCompare(b.displayName));
};

/** Lists the templates of a library that run in this playground. */
export const fetchLibraryIndex = async (library: TemplateLibrary): Promise<LibraryTemplate[]> => {
  const response = await fetch(`${library.baseUrl}/template-library.json`);
  if (!response.ok) throw new Error(`The library answered ${response.status}.`);
  return parseLibraryIndex((await response.json()) as Record<string, IndexEntry>);
};

export interface LibraryFilter {
  query: string;
  type: "" | LibraryTemplate["type"];
  /** Selected categories; empty means all. */
  tags: string[];
  showArchived: boolean;
}

export const EMPTY_FILTER: LibraryFilter = { query: "", type: "", tags: [], showArchived: false };

/** The same filters as templates.accordproject.org: text, type, category and archived. */
export const filterTemplates = (templates: LibraryTemplate[], filter: LibraryFilter): LibraryTemplate[] => {
  const q = filter.query.trim().toLowerCase();
  return templates.filter(
    (t) =>
      (filter.showArchived || !t.archived) &&
      (!filter.type || t.type === filter.type) &&
      (filter.tags.length === 0 || t.tags.some((tag) => filter.tags.includes(tag))) &&
      (!q || `${t.displayName} ${t.name} ${t.description}`.toLowerCase().includes(q))
  );
};

/** Every category used in the library, most used first (the hosted site's order). */
export const libraryTags = (templates: LibraryTemplate[]): string[] => {
  const counts = new Map<string, number>();
  for (const t of templates) for (const tag of t.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag);
};

export interface TemplateGroup {
  key: string;
  title: string;
  templates: LibraryTemplate[];
}

/**
 * Groups as the hosted site does: one group per category (a template with
 * two categories is listed under both), then templates without one, then
 * archived templates in a group of their own.
 */
export const groupTemplates = (
  templates: LibraryTemplate[],
  labels: { untagged: string; archived: string },
  only: string[] = []
): TemplateGroup[] => {
  const current = templates.filter((t) => !t.archived);
  const tags = libraryTags(current).filter((tag) => only.length === 0 || only.includes(tag));
  const groups: TemplateGroup[] = tags.map((tag) => ({
    key: `tag:${tag}`,
    title: tag,
    templates: current.filter((t) => t.tags.includes(tag)),
  }));
  const untagged = current.filter((t) => t.tags.length === 0);
  if (untagged.length) groups.push({ key: "untagged", title: labels.untagged, templates: untagged });
  const archived = templates.filter((t) => t.archived);
  if (archived.length) groups.push({ key: "archived", title: labels.archived, templates: archived });
  return groups;
};

/** Downloads a `.cta` from a URL. Only http(s) is accepted. */
export const fetchArchive = async (url: string): Promise<Uint8Array> => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("That is not a valid URL.");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only http and https URLs can be imported.");
  }
  let response: Response;
  try {
    response = await fetch(parsed.href);
  } catch {
    throw new Error("The archive could not be downloaded — the server may block requests from other sites (CORS).");
  }
  if (!response.ok) throw new Error(`The server answered ${response.status}.`);
  return new Uint8Array(await response.arrayBuffer());
};
