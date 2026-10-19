import { useState } from "react";
import { Button, Typography, message } from "antd";
import {
  CloudServerOutlined,
  CodeOutlined,
  CopyOutlined,
  FilePdfOutlined,
  FileZipOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import DOMPurify from "dompurify";
import useAppStore from "../../store/store";
import { compress } from "../../utils/compression/compression";
import { pendingLogic } from "../../editors/logicSource";
import { archiveFileName, buildExportArchive } from "../../utils/templateArchive";
import { canSaveToFolder, pickFolder, writeArchiveToFolder } from "../../utils/saveToFolder";
import { DEPLOY, type DeployCard } from "./constants";

const ICONS: Record<DeployCard["icon"], JSX.Element> = {
  pdf: <FilePdfOutlined />,
  link: <LinkOutlined />,
  copy: <CopyOutlined />,
  archive: <FileZipOutlined />,
  server: <CloudServerOutlined />,
  code: <CodeOutlined />,
  mcp: <RobotOutlined />,
  vscode: <FolderOpenOutlined />,
};

/** Saves bytes as a file download. */
const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const BLOCKS = "p,h1,h2,h3,h4,h5,h6,li,blockquote,pre,tr,div,ul,ol,table";
const CELLS = "td,th";

/**
 * Plain text of the rendered agreement, with a line break after each <br>
 * and a blank line between blocks. Built from the DOM rather than innerText,
 * which only keeps breaks on an element that is laid out.
 */
export const agreementText = (html: string): string => {
  const doc = new DOMParser().parseFromString(DOMPurify.sanitize(html), "text/html");
  doc.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  // Cells of a row are tab-separated, so "USD | 100" doesn't copy as "USD100".
  doc.querySelectorAll(CELLS).forEach((cell) => {
    if (cell.nextElementSibling) cell.append("\t");
  });
  doc.querySelectorAll(BLOCKS).forEach((block) => block.append("\n\n"));
  return (doc.body.textContent ?? "")
    .split("\n")
    // Trim spaces but keep every tab, so an empty edge cell still holds its column.
    .map((line) => line.split("\t").map((cell) => cell.replace(/\s+/g, " ").trim()).join("\t"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\n+|\n+$/g, "");
};

/** What an action reports, when the card's own `done` toast is not the right one. */
interface Outcome {
  success?: string;
  warning?: string;
  /** The user backed out (e.g. closed the folder picker): no toast at all. */
  cancelled?: boolean;
}

const copy = async (text: string) => {
  if (!navigator.clipboard) throw new Error("clipboard unavailable");
  await navigator.clipboard.writeText(text);
};

/**
 * Copies text that is still being produced. Safari only lets a page write to
 * the clipboard while handling the click, so the write starts now with a
 * ClipboardItem that resolves later; browsers without ClipboardItem wait for
 * the text and use writeText. A failure of `text` is rethrown as is.
 */
const copyWhenReady = async (text: Promise<string>) => {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    const item = new ClipboardItem({ "text/plain": text.then((t) => new Blob([t], { type: "text/plain" })) });
    try {
      await navigator.clipboard.write([item]);
      return;
    } catch (error) {
      await text; // surface the rendering error rather than the clipboard's
      throw error;
    }
  }
  await copy(await text);
};

/** Step 7: Deploy — what to do with the agreement and the template, one card per option. */
export const DeployView = () => {
  const [working, setWorking] = useState<string | null>(null);

  const runAction = async (card: DeployCard): Promise<Outcome | void> => {
    const { renderAgreement, requestJson, templateMarkdown, modelCto, data, editorLogicTs, sampleName } =
      useAppStore.getState();
    /*
     * PDF and copy render the current sources afresh: agreementHtml lags an
     * edit by the debounce and the render, and keeps the last good agreement
     * after an error, so it can be out of date.
     */
    const current = async () => {
      try {
        return await renderAgreement();
      } catch (error) {
        throw new Error(`${DEPLOY.renderError} (${error instanceof Error ? error.message : String(error)})`);
      }
    };
    // While the template has an error the last rendered agreement is stale; don't export it as current.
    // Export the logic as edited, not as last compiled; an empty editor means no logic.
    const logicTs = pendingLogic(editorLogicTs) ?? "";
    switch (card.action) {
      case "share": {
        /*
         * The link carries a pre-rendered agreement so it opens instantly.
         * It is rendered afresh from the sources going into the link, never
         * the cached agreementHtml, which can still hold text removed since;
         * when the sources don't render, the link carries none and the
         * recipient's playground renders it. The clipboard write starts
         * inside the click (see copyWhenReady).
         */
        const link = renderAgreement()
          .catch(() => undefined)
          .then((freshHtml) =>
            `${window.location.origin}/#data=${compress({
              templateMarkdown,
              modelCto,
              data,
              ...(freshHtml ? { agreementHtml: freshHtml } : {}),
              ...(logicTs.trim() ? { logicTs } : {}),
            })}`,
          );
        return copyWhenReady(link);
      }
      case "copy": {
        // No await before this: the clipboard write must start inside the click.
        return copyWhenReady(current().then(agreementText));
      }
      case "vscode": {
        const folderName = archiveFileName(sampleName).replace(/\.cta$/, "");
        const build = () => buildExportArchive({ templateMarkdown, modelCto, data, logicTs, requestJson }, sampleName);
        if (!canSaveToFolder()) {
          downloadBlob(new Blob([(await build()) as BlobPart], { type: "application/octet-stream" }), archiveFileName(sampleName));
          return { warning: DEPLOY.noFolderSupport };
        }
        /*
         * The picker needs the click's user activation, so it opens before
         * anything is awaited; the archive is built once a folder is chosen.
         * vscode.dev is not opened from here — after that work the browser
         * would block the pop-up — the card's own link opens it.
         */
        let parent;
        try {
          parent = await pickFolder();
        } catch (error) {
          // Closing the folder picker is not a failure.
          if (error instanceof DOMException && error.name === "AbortError") return { cancelled: true };
          throw error;
        }
        const saved = await writeArchiveToFolder(await build(), parent, folderName);
        return { success: DEPLOY.folderSaved(`${parent.name}/${saved.split("/").pop() ?? saved}`) };
      }
      case "archive": {
        const bytes = await buildExportArchive({ templateMarkdown, modelCto, data, logicTs, requestJson }, sampleName);
        return downloadBlob(new Blob([bytes as BlobPart], { type: "application/octet-stream" }), archiveFileName(sampleName));
      }
      case "pdf": {
        const html = await current();
        const { default: html2pdf } = await import("html2pdf.js");
        const page = document.createElement("div");
        page.style.cssText = "background:#fff;color:#000;padding:16px";
        page.innerHTML = DOMPurify.sanitize(html);
        await html2pdf()
          .set({
            margin: 10,
            filename: "agreement.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          } as const)
          .from(page)
          .save();
      }
    }
  };

  const run = async (card: DeployCard) => {
    setWorking(card.title);
    try {
      const outcome = await runAction(card);
      if (outcome?.cancelled) return;
      if (outcome?.warning) void message.warning(outcome.warning, 10);
      else if (outcome?.success) void message.success(outcome.success, 8);
      else if (card.done) void message.success(card.done);
    } catch (error) {
      void message.error(`${DEPLOY.failed(card.title)}${error instanceof Error ? ` — ${error.message}` : ""}`);
    } finally {
      setWorking(null);
    }
  };

  const renderCard = (card: DeployCard) => (
    <article key={card.title} className="nd-deploy-card" aria-label={card.title}>
      <div className="nd-deploy-card-head">
        <span className="nd-deploy-icon" aria-hidden="true">
          {ICONS[card.icon]}
        </span>
        <h3 className="nd-deploy-title">{card.title}</h3>
      </div>
      <p className="nd-deploy-desc">{card.description}</p>
      <ul className="nd-deploy-details">
        {card.details.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <div className="nd-deploy-action">
        {card.href ? (
          <Button
            block
            href={card.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${card.button} ↗ (opens in a new tab)`}
          >
            {card.button} ↗
          </Button>
        ) : (
          <Button
            block
            type="primary"
            loading={working === card.title}
            disabled={working !== null}
            onClick={() => void run(card)}
          >
            {card.button}
          </Button>
        )}
        {card.secondary && (
          <Button
            block
            style={{ marginTop: 8 }}
            href={card.secondary.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${card.secondary.label} ↗ (opens in a new tab)`}
          >
            {card.secondary.label} ↗
          </Button>
        )}
      </div>
    </article>
  );

  return (
    <div className="nd-view nd-view-export">
      <div className="nd-export-head">
        <h1>{DEPLOY.title}</h1>
        <Typography.Text type="secondary">{DEPLOY.subtitle}</Typography.Text>
      </div>
      {DEPLOY.groups.map((group) => (
        <section
          key={group.title}
          className={`nd-deploy-group nd-deploy-group-${group.accent}`}
          aria-label={group.title}
        >
          <div className="nd-deploy-group-head">
            <h2>{group.title}</h2>
            <span>{group.subtitle}</span>
          </div>
          <div className="nd-deploy-grid">{group.cards.map(renderCard)}</div>
        </section>
      ))}
    </div>
  );
};
