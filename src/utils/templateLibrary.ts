/**
 * Fetching templates from the Accord Project template library and from
 * arbitrary URLs. A "library" is a base URL serving `template-library.json`
 * (name@version → metadata) and `archives/<name>@<version>.cta`; the Accord
 * Project one is the first entry in LIBRARIES, and adding another is one line.
 */
import { ciceroAccepts, ciceroVersion } from "./cicero";

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

type Index = Record<string, IndexEntry>;

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
export const parseLibraryIndex = async (index: Index): Promise<LibraryTemplate[]> =>
  sortByName(Object.values(await newestOf(await compatibleEntries(index))));

/** The index entries this Cicero accepts, keyed name@version, without entries that lack either. */
const compatibleEntries = async (index: Index): Promise<Index> => {
  const { TemplateLibrary } = await import("@accordproject/cicero-core");
  const compatible = TemplateLibrary.filterTemplateIndexCiceroVersion(index, await ciceroVersion()) as Index;
  return Object.fromEntries(
    Object.entries(compatible).filter(([, e]) => typeof e.name === "string" && typeof e.version === "string")
  );
};

/** The newest version of each template, keyed name@version as in the index. */
const newestOf = async (entries: Index): Promise<Record<string, LibraryTemplate>> => {
  const { TemplateLibrary } = await import("@accordproject/cicero-core");
  const latest = TemplateLibrary.filterTemplateIndexLatestVersion(entries) as Index;
  return Object.fromEntries(Object.entries(latest).map(([key, e]) => [key, toTemplate(e)]));
};

const sortByName = (templates: LibraryTemplate[]): LibraryTemplate[] =>
  templates.sort((a, b) => a.displayName.localeCompare(b.displayName));

/** An index entry that compatibleEntries kept (so name and version are strings) as a LibraryTemplate. */
const toTemplate = (e: IndexEntry): LibraryTemplate => {
  if (typeof e.name !== "string" || typeof e.version !== "string") throw new Error("index entry without name or version");
  return {
    name: e.name,
    displayName: typeof e.displayName === "string" && e.displayName ? e.displayName : e.name,
    version: e.version,
    description: typeof e.description === "string" ? e.description : "",
    type: e.type === 1 ? "Clause" : "Contract",
    tags: Array.isArray(e.tags) ? e.tags.filter((t): t is string => typeof t === "string") : [],
    archived: e.archived === true,
    ciceroVersion: typeof e.ciceroVersion === "string" ? e.ciceroVersion : "",
    url: typeof e.url === "string" && /^https:\/\//.test(e.url) ? e.url : undefined,
  };
};

/** The Cicero range an archive's package.json targets (accordproject.cicero), if it names one. */
export const archiveCiceroRange = async (bytes: Uint8Array): Promise<unknown> => {
  const { default: JSZip } = await import("jszip");
  const pkg = await (await JSZip.loadAsync(bytes)).file("package.json")?.async("string");
  if (!pkg) return undefined;
  const { accordproject } = JSON.parse(pkg) as { accordproject?: { cicero?: unknown } };
  return accordproject?.cicero;
};

/**
 * Whether Cicero accepts the archive itself. The index can disagree with it:
 * many Accord Project templates are indexed as Cicero ^2.0.0 while their
 * archives still target ^1.0.0, which Cicero refuses to load. An archive that
 * can't be downloaded or read stays listed, so importing it reports why.
 */
const archiveAccepted = async (library: TemplateLibrary, template: LibraryTemplate): Promise<boolean> => {
  let range: unknown;
  try {
    range = await archiveCiceroRange(await fetchArchive(archiveUrl(library, template)));
  } catch {
    return true;
  }
  return ciceroAccepts(range);
};

/**
 * Lists the templates of a library that run in this playground, checking
 * archives as well as the index: the newest version of each template whose
 * archive Cicero accepts. When the newest archive is refused, the next newest
 * is tried, and so on; a template with no accepted archive is not listed.
 */
export const fetchLibraryIndex = async (library: TemplateLibrary): Promise<LibraryTemplate[]> => {
  const response = await fetch(`${library.baseUrl}/template-library.json`);
  if (!response.ok) throw new Error(`The library answered ${response.status}.`);
  let candidates = await compatibleEntries((await response.json()) as Index);
  const listed: LibraryTemplate[] = [];
  while (Object.keys(candidates).length) {
    const newest = Object.entries(await newestOf(candidates));
    const accepted = await Promise.all(newest.map(([, t]) => archiveAccepted(library, t)));
    const settled = new Set(newest.filter((_, i) => accepted[i]).map(([, t]) => t.name));
    const refused = new Set(newest.filter((_, i) => !accepted[i]).map(([key]) => key));
    listed.push(...newest.filter((_, i) => accepted[i]).map(([, t]) => t));
    candidates = Object.fromEntries(
      Object.entries(candidates).filter(([key, e]) => !refused.has(key) && !settled.has(e.name as string))
    );
  }
  return sortByName(listed);
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

/** Maximum allowed size for a downloaded template archive (25 MB). */
export const MAX_ARCHIVE_DOWNLOAD_BYTES = 25 * 1024 * 1024;

/** Default timeout for remote template archive downloads (15 seconds). */
export const ARCHIVE_DOWNLOAD_TIMEOUT_MS = 15_000;

export interface FetchArchiveOptions {
  timeoutMs?: number;
  maxBytes?: number;
  signal?: AbortSignal;
}

/**
 * Downloads a `.cta` from a URL with timeout and byte-limit defenses.
 * Accepts https URLs only.
 */
export const fetchArchive = async (
  url: string,
  options: FetchArchiveOptions = {},
): Promise<Uint8Array> => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("That is not a valid URL.");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Only https URLs can be imported.");
  }

  const timeoutMs = options.timeoutMs ?? ARCHIVE_DOWNLOAD_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? MAX_ARCHIVE_DOWNLOAD_BYTES;

  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  let unhookSignal: (() => void) | undefined;
  if (options.signal) {
    if (options.signal.aborted) {
      clearTimeout(timer);
      throw new Error("The download was cancelled.");
    }
    const onAbort = () => controller.abort();
    options.signal.addEventListener("abort", onAbort, { once: true });
    unhookSignal = () => options.signal?.removeEventListener("abort", onAbort);
  }

  try {
    let response: Response;
    try {
      response = await fetch(parsed.href, { signal: controller.signal });
    } catch (error: unknown) {
      if (timedOut) {
        throw new Error(`The archive download timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
      }
      if (options.signal?.aborted) {
        throw new Error("The download was cancelled.");
      }
      throw new Error("The archive could not be downloaded — the server may block requests from other sites (CORS).");
    }

    if (!response.ok) {
      throw new Error(`The server answered ${response.status}.`);
    }

    const contentLengthHeader = response.headers?.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      if (!Number.isNaN(contentLength) && contentLength > maxBytes) {
        throw new Error(`The template archive exceeds the maximum allowed size of ${maxBytes / (1024 * 1024)} MB.`);
      }
    }

    if (response.body && typeof response.body.getReader === "function") {
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      let done = false;

      while (!done) {
        let chunk: ReadableStreamReadResult<Uint8Array>;
        try {
          chunk = await reader.read();
        } catch (error: unknown) {
          if (timedOut) {
            throw new Error(`The archive download timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
          }
          if (options.signal?.aborted) {
            throw new Error("The download was cancelled.");
          }
          throw error;
        }

        done = chunk.done;
        if (done) break;
        if (chunk.value) {
          totalBytes += chunk.value.byteLength;
          if (totalBytes > maxBytes) {
            void reader.cancel();
            throw new Error(`The template archive exceeds the maximum allowed size of ${maxBytes / (1024 * 1024)} MB.`);
          }
          chunks.push(chunk.value);
        }
      }

      const result = new Uint8Array(totalBytes);
      let offset = 0;
      for (const c of chunks) {
        result.set(c, offset);
        offset += c.byteLength;
      }
      return result;
    }

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > maxBytes) {
      throw new Error(`The template archive exceeds the maximum allowed size of ${maxBytes / (1024 * 1024)} MB.`);
    }
    return new Uint8Array(arrayBuffer);
  } finally {
    clearTimeout(timer);
    unhookSignal?.();
  }
};
