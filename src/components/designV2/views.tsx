import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Modal, Upload, Input, Space, Typography, Tag, List, Alert } from "antd";
import {
  UploadOutlined,
  LinkOutlined,
  BookOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { ModelDataView } from "./ModelDataView";
import { TextView } from "./TextView";
import { LogicView } from "./LogicView";
import SimulateView from "./SimulateView";
import SampleArt from "./SampleArt";
import useAppStore from "../../store/store";
import useDesignV2Store from "../../store/designV2Store";
import { usePickTemplate } from "./usePickTemplate";
import { ACCORD_PROJECT_LIBRARY, type LibraryEntry } from "./templateLibraries";
import { STEP_KEY, type DesignV2View } from "../../types/designV2.types";
import {
  ROUTES,
  WELCOME,
  START,
  START_SAMPLES,
  DEPLOY,
  type StartSample,
} from "./constants";

/*
 * Welcome hero, template gallery and the Deploy placeholder. Each is swapped
 * in by DesignV2Layout based on `view`; the editor steps live in their own files.
 */

interface WelcomeViewProps {
  onStart: () => void;
}

/**
 * Dark hero card: Accord Project wordmark, headline and the two CTAs.
 */
export const WelcomeView = ({ onStart }: WelcomeViewProps) => {
  const navigate = useNavigate();
  return (
  <div className="nd-view nd-view-welcome">
    <div className="nd-hero">
      <div className="nd-hero-grid" />
      <img className="nd-hero-logo" src={WELCOME.logoSrc} alt={WELCOME.logoAlt} />
      <div className="nd-spacer" />
      <h1 className="nd-hero-title">
        {WELCOME.titleLine}
        <br />
        <span className="nd-hero-title-accent">{WELCOME.titleAccent}</span>
      </h1>
      <p className="nd-hero-sub">
        {WELCOME.subtitleLine1}
        <br />
        {WELCOME.subtitleLine2}
      </p>
      <div className="nd-hero-actions">
        <Button type="primary" size="large" shape="round" onClick={onStart}>
          {WELCOME.start} →
        </Button>
        <Button ghost size="large" shape="round" onClick={() => navigate(ROUTES.learnIntro)}>{WELCOME.howItWorks}</Button>
      </div>
      <div className="nd-spacer" />
    </div>
  </div>
  );
};

interface SampleCardProps {
  sample: StartSample;
  /** The card's template is the one currently loaded (e.g. after Back from a later step). */
  current: boolean;
  onOpen: () => void;
}

/**
 * One gallery card: an illustration on top; name, tagline, a short list
 * of what the template demonstrates and its own "Start with this template"
 * button underneath. Nothing else on the card is clickable — picking and
 * opening a template is one click.
 */
const SampleCard = ({ sample, current, onOpen }: SampleCardProps) => {
  const classes = [
    "nd-sample-card",
    `nd-sample-card-${sample.accent}`,
    current ? "nd-sample-card-current" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={classes} aria-current={current ? "true" : undefined} aria-label={sample.name}>
      <div className="nd-sample-art">
        <SampleArt kind={sample.art} />
      </div>
      <div className="nd-sample-foot">
        <div className="nd-sample-foot-row">
          <span className="nd-sample-name">{sample.name}</span>
          {current && <span className="nd-sample-current">{START.current}</span>}
        </div>
        <p className="nd-sample-tagline">{sample.tagline}</p>
        <ul className="nd-sample-learn" aria-label={START.learnLabel(sample.name)}>
          {sample.demonstrates.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <Button
          type="primary"
          block
          className="nd-sample-open"
          aria-label={START.openLabel(sample.name)}
          onClick={onOpen}
        >
          {START.open}
        </Button>
      </div>
    </article>
  );
};

/**
 * "Choose a template" gallery: a curated set of cards, each opening the flow
 * on its template in one click. "+ Start blank" does the same with the empty template.
 * Also offers entry points to upload a .cta, load from a URL, or browse the template library.
 */
export const StartView = () => {
  const selectedTemplate = useDesignV2Store((s) => s.selectedTemplate);
  const selectTemplate = useDesignV2Store((s) => s.selectTemplate);
  const goNext = useDesignV2Store((s) => s.goNext);
  const loadFromArchive = useAppStore((s) => s.loadFromArchive);
  const pick = usePickTemplate();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [libraryEntries, setLibraryEntries] = useState<LibraryEntry[]>([]);

  const open = (name: string) => {
    pick(name);
    goNext();
  };

  const isGalleryTemplate = (name: string) =>
    START_SAMPLES.some((s) => s.name === name) || name === START.blankName;

  const handleUrlLoad = async () => {
    if (!urlInput.trim()) return;
    setUrlLoading(true);
    setUrlError(null);
    try {
      const res = await fetch(urlInput.trim());
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }
      const buf = await res.arrayBuffer();
      const filename = urlInput.split("/").pop() || "url-template.cta";
      await loadFromArchive(new Uint8Array(buf), filename);
      selectTemplate(filename);
      setIsUrlModalOpen(false);
      setUrlInput("");
      goNext();
    } catch (err) {
      let msg = err instanceof Error ? err.message : "Failed to load template from URL";
      if (err instanceof TypeError && err.message.includes("fetch")) {
        msg = `CORS or network error fetching URL: ${urlInput}. Ensure the server allows cross-origin requests.`;
      }
      setUrlError(msg);
    } finally {
      setUrlLoading(false);
    }
  };

  const handleLibrarySearch = useCallback(async (query: string) => {
    setLibraryLoading(true);
    setLibraryError(null);
    try {
      const results = await ACCORD_PROJECT_LIBRARY.search(query);
      setLibraryEntries(results);
    } catch (err) {
      setLibraryError("Failed to search template library.");
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLibraryModalOpen) {
      void handleLibrarySearch(searchQuery);
    }
  }, [isLibraryModalOpen, searchQuery, handleLibrarySearch]);

  const handleLibraryImport = async (entry: LibraryEntry) => {
    setLoadingItem(entry.name);
    setLibraryError(null);
    try {
      const url = ACCORD_PROJECT_LIBRARY.resolveUrl(entry);
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to download template archive (${res.status})`);
      }
      const buf = await res.arrayBuffer();
      const label = `${entry.name}@${entry.version}`;
      await loadFromArchive(new Uint8Array(buf), label);
      selectTemplate(label);
      setIsLibraryModalOpen(false);
      goNext();
    } catch (err) {
      setLibraryError(
        err instanceof Error ? err.message : "Failed to import template from library"
      );
    } finally {
      setLoadingItem(null);
    }
  };

  return (
    <div className="nd-view nd-view-start">
      <div className="nd-start-head">
        <span className="nd-start-title">{START.title}</span>
        <span className="nd-start-hint">{START.hint}</span>
        {selectedTemplate && !isGalleryTemplate(selectedTemplate) && (
          <Tag color="blue" style={{ marginLeft: 12 }}>
            {START.importedPrefix}{selectedTemplate}
          </Tag>
        )}
        <div className="nd-spacer" />
        <Space wrap>
          <Button type="dashed" size="small" onClick={() => open(START.blankName)}>
            {START.blank}
          </Button>
          <Button icon={<UploadOutlined />} size="small" onClick={() => setIsUploadModalOpen(true)}>
            {START.uploadCta}
          </Button>
          <Button icon={<LinkOutlined />} size="small" onClick={() => setIsUrlModalOpen(true)}>
            {START.loadUrl}
          </Button>
          <Button icon={<BookOutlined />} size="small" onClick={() => setIsLibraryModalOpen(true)}>
            {START.browseLibrary}
          </Button>
        </Space>
      </div>

      <div className="nd-sample-grid">
        {START_SAMPLES.map((sample) => (
          <SampleCard
            key={sample.name}
            sample={sample}
            current={selectedTemplate === sample.name}
            onOpen={() => open(sample.name)}
          />
        ))}
      </div>

      {/* Modal 1: Upload .cta file */}
      <Modal
        title={START.uploadModalTitle}
        open={isUploadModalOpen}
        onCancel={() => {
          setIsUploadModalOpen(false);
          setUploadError(null);
        }}
        footer={null}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <Typography.Text type="secondary">
            Select a .cta archive or template directory zip file from your computer.
          </Typography.Text>
          {uploadError && <Alert type="error" message={uploadError} showIcon />}
          <Upload
            accept=".cta,.zip"
            customRequest={(options) => {
              void (async () => {
                const { file, onSuccess, onError } = options;
                try {
                  setUploadError(null);
                  const f = file as File;
                  const arrayBuffer = await f.arrayBuffer();
                  const bytes = new Uint8Array(arrayBuffer);
                  await loadFromArchive(bytes, f.name);
                  selectTemplate(f.name);
                  setIsUploadModalOpen(false);
                  onSuccess?.("ok");
                  goNext();
                } catch (err) {
                  const msg =
                    err instanceof Error ? err.message : "Failed to import template archive";
                  setUploadError(msg);
                  onError?.(err as Error);
                }
              })();
            }}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />} type="primary">
              Choose .cta File
            </Button>
          </Upload>
        </Space>
      </Modal>

      {/* Modal 2: Load from URL */}
      <Modal
        title={START.urlModalTitle}
        open={isUrlModalOpen}
        onCancel={() => {
          setIsUrlModalOpen(false);
          setUrlError(null);
        }}
        onOk={() => {
          void handleUrlLoad();
        }}
        confirmLoading={urlLoading}
        okText="Load Template"
      >
        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <Typography.Text type="secondary">
            Enter a direct URL to a .cta template archive.
          </Typography.Text>
          {urlError && <Alert type="error" message={urlError} showIcon />}
          <Input
            placeholder="https://example.com/template.cta"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            prefix={<LinkOutlined />}
            onPressEnter={() => {
              void handleUrlLoad();
            }}
          />
        </Space>
      </Modal>

      {/* Modal 3: Browse template library */}
      <Modal
        title={START.libraryModalTitle}
        open={isLibraryModalOpen}
        onCancel={() => setIsLibraryModalOpen(false)}
        footer={null}
        width={600}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <Input
            placeholder="Search template library..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            allowClear
          />
          {libraryError && <Alert type="error" message={libraryError} showIcon />}
          <List
            loading={libraryLoading}
            dataSource={libraryEntries}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    key="import"
                    type="primary"
                    size="small"
                    loading={loadingItem === item.name}
                    onClick={() => {
                      void handleLibraryImport(item);
                    }}
                  >
                    Import
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      {item.name} <Tag>{item.version}</Tag>
                    </Space>
                  }
                  description={item.description}
                />
              </List.Item>
            )}
          />
        </Space>
      </Modal>
    </div>
  );
};

/** Step 7: Deploy — placeholder until the deploy flow is designed. */
export const DeployView = () => (
  <div className="nd-view nd-view-export">
    <div className="nd-export-head">
      <h1>{DEPLOY.title}</h1>
    </div>
    <div className="nd-export-grid">
      {DEPLOY.cards.map((label) => (
        <div key={label} className="nd-card nd-export-card">
          <span className="nd-export-label">{label}</span>
        </div>
      ))}
    </div>
  </div>
);

interface ViewSwitchProps {
  view: DesignV2View;
  onStart: () => void;
}

export const ViewSwitch = ({ view, onStart }: ViewSwitchProps) => {
  if (view === "welcome") return <WelcomeView onStart={onStart} />;
  const key = STEP_KEY[view];
  if (key === "template") return <StartView />;
  if (key === "modelData") return <ModelDataView />;
  if (key === "text") return <TextView />;
  if (key === "logic") return <LogicView />;
  if (key === "simulate") return <SimulateView />;
  return <DeployView />;
};
