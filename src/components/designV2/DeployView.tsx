import { useState } from "react";
import { Button, Typography, message } from "antd";
import {
  CloudServerOutlined,
  CodeOutlined,
  CopyOutlined,
  FilePdfOutlined,
  FileMarkdownOutlined,
  FileZipOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import useAppStore, { SourcesChangedError, currentLogicEditRevision } from "../../store/store";
import { saveAgreementPdf } from "../../utils/agreementPdf";
import { pendingLogic } from "../../editors/logicSource";
import { archiveFileName, buildExportArchive, exportTemplateFiles } from "../../utils/templateArchive";
import { canSaveToFolder, pickFolder, writeTemplateFiles } from "../../utils/saveToFolder";
import { downloadBlob, downloadMarkdown } from "../../utils/download";
import { DEPLOY, type DeployCard } from "./constants";

const ICONS: Record<DeployCard["icon"], JSX.Element> = {
  pdf: <FilePdfOutlined />,
  markdown: <FileMarkdownOutlined />,
  link: <LinkOutlined />,
  copy: <CopyOutlined />,
  archive: <FileZipOutlined />,
  server: <CloudServerOutlined />,
  code: <CodeOutlined />,
  mcp: <RobotOutlined />,
  vscode: <FolderOpenOutlined />,
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
    const { renderAgreement, generateShareableLink, requestJson, templateMarkdown, modelCto, data, editorLogicTs, sampleName } =
      useAppStore.getState();
    /*
     * PDF, Markdown and copy render the current sources afresh: agreementHtml lags an
     * edit by the debounce and the render, and keeps the last good agreement
     * after an error, so it can be out of date.
     */
    const current = async (format?: "markdown" | "text") => {
      try {
        return await renderAgreement(format);
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
         * recipient's playground renders it. If they changed while rendering
         * (even back again), the sources captured for the link are stale, so
         * copying fails instead; the same goes for the logic, which the link
         * carries as edited. Those checks also mean the store still holds the
         * sources captured at the click when the link is built. The clipboard
         * write starts inside the click (see copyWhenReady).
         */
        const logicRevision = currentLogicEditRevision();
        const link = renderAgreement()
          .catch((error: unknown) => {
            if (error instanceof SourcesChangedError) throw error;
            return undefined;
          })
          .then((freshHtml) => {
            if (currentLogicEditRevision() !== logicRevision) throw new SourcesChangedError();
            return generateShareableLink({ agreementHtml: freshHtml || undefined, logicTs });
          });
        return copyWhenReady(link);
      }
      case "copy": {
        // No await before this: the clipboard write must start inside the click.
        return copyWhenReady(current("text"));
      }
      case "vscode": {
        const folderName = archiveFileName(sampleName).replace(/\.cta$/, "");
        const content = { templateMarkdown, modelCto, data, logicTs, requestJson };
        if (!canSaveToFolder()) {
          downloadBlob(
            new Blob([(await buildExportArchive(content, sampleName)) as BlobPart], { type: "application/octet-stream" }),
            archiveFileName(sampleName),
          );
          return { warning: DEPLOY.noFolderSupport };
        }
        /*
         * The picker needs the click's user activation, so it opens before
         * anything is awaited; the template's files are built once a folder is chosen.
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
        const saved = await writeTemplateFiles(await exportTemplateFiles(content, sampleName), parent, folderName);
        return { success: DEPLOY.folderSaved(`${parent.name}/${saved.split("/").pop() ?? saved}`) };
      }
      case "archive": {
        const bytes = await buildExportArchive({ templateMarkdown, modelCto, data, logicTs, requestJson }, sampleName);
        return downloadBlob(new Blob([bytes as BlobPart], { type: "application/octet-stream" }), archiveFileName(sampleName));
      }
      case "markdown": {
        return downloadMarkdown(await current("markdown"));
      }
      case "pdf": {
        return saveAgreementPdf(await current());
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
