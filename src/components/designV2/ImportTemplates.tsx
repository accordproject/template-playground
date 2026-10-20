import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Checkbox, Empty, Input, List, Modal, Select, Space, Spin, Tag, Typography, message } from "antd";
import useAppStore from "../../store/store";
import useDesignV2Store from "../../store/designV2Store";
import { readTemplateArchive, type ImportedTemplate } from "../../utils/templateArchive";
import {
  EMPTY_FILTER,
  LIBRARIES,
  archiveUrl,
  fetchArchive,
  fetchLibraryIndex,
  filterTemplates,
  groupTemplates,
  libraryTags,
  type LibraryFilter,
  type LibraryTemplate,
} from "../../utils/templateLibrary";
import { IMPORT } from "./constants";

const errorText = (error: unknown) => (error instanceof Error ? error.message : "unknown error");

/**
 * Imports a template the way "Start with this template" picks a card: load it
 * into the app store, remember it as the selection and open the next step.
 * `load` fetches and parses; any failure there is shown as a toast and
 * nothing is changed. Returns whether the import succeeded.
 */
const useImportTemplate = () => {
  const loadImportedTemplate = useAppStore((s) => s.loadImportedTemplate);
  const selectTemplate = useDesignV2Store((s) => s.selectTemplate);
  const goNext = useDesignV2Store((s) => s.goNext);
  const [busy, setBusy] = useState(false);
  // Bumped by cancel(): an import that finishes after that must not touch the store or navigate.
  const generation = useRef(0);
  const cancel = useCallback(() => {
    generation.current += 1;
    setBusy(false);
  }, []);
  useEffect(() => cancel, [cancel]);

  const run = useCallback(
    async (load: () => Promise<ImportedTemplate>): Promise<boolean> => {
      const mine = ++generation.current;
      setBusy(true);
      try {
        const imported = await load();
        if (mine !== generation.current) return false;
        /*
         * loadImportedTemplate replaces the sources before its first await, so
         * the selection is set with them: past this point the import is
         * committed, and closing the modal while the template renders or
         * compiles only skips the toasts and the move to the next step.
         */
        selectTemplate(imported.name);
        await loadImportedTemplate(imported);
        if (mine !== generation.current) return true;
        for (const warning of imported.warnings) void message.warning(warning, 8);
        void message.success(IMPORT.imported(imported.name));
        goNext();
        return true;
      } catch (error) {
        if (mine === generation.current) void message.error(IMPORT.failed(errorText(error)));
        return false;
      } finally {
        if (mine === generation.current) setBusy(false);
      }
    },
    [loadImportedTemplate, selectTemplate, goNext]
  );
  return { run, busy, cancel };
};

interface LibraryModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Browse the first configured library the way templates.accordproject.org
 * does — search, type, categories and archived, grouped by category — and
 * import one of its templates. Only templates this playground can run are
 * listed.
 */
const LibraryModal = ({ open, onClose }: LibraryModalProps) => {
  const library = LIBRARIES[0];
  const { run, busy, cancel } = useImportTemplate();
  const close = () => {
    cancel();
    onClose();
  };
  const [templates, setTemplates] = useState<LibraryTemplate[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LibraryFilter>(EMPTY_FILTER);
  const update = (patch: Partial<LibraryFilter>) => setFilter((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (!open || templates) return;
    let cancelled = false;
    setLoadError(null);
    fetchLibraryIndex(library)
      .then((list) => !cancelled && setTemplates(list))
      .catch((error: unknown) => !cancelled && setLoadError(errorText(error)));
    return () => {
      cancelled = true;
    };
  }, [open, templates, library]);

  const tags = useMemo(() => libraryTags((templates ?? []).filter((t) => !t.archived)), [templates]);
  const shown = useMemo(() => filterTemplates(templates ?? [], filter), [templates, filter]);
  const groups = useMemo(
    () => groupTemplates(shown, { untagged: IMPORT.library.untagged, archived: IMPORT.library.archived }, filter.tags),
    [shown, filter.tags]
  );

  const importOne = async (template: LibraryTemplate) => {
    const ok = await run(async () =>
      readTemplateArchive(await fetchArchive(archiveUrl(library, template)), template.displayName)
    );
    if (ok) onClose();
  };

  const renderRow = (template: LibraryTemplate) => (
    <List.Item
      key={template.name}
      actions={[
        <Button
          key="import"
          size="small"
          type="primary"
          disabled={busy}
          aria-label={IMPORT.library.pick(template.displayName, template.version)}
          onClick={() => void importOne(template)}
        >
          {IMPORT.library.use}
        </Button>,
      ]}
    >
      <List.Item.Meta
        title={
          <Space size={6} wrap>
            <Typography.Text strong>{template.displayName}</Typography.Text>
            <Typography.Text type="secondary">{template.version}</Typography.Text>
            <Tag color={template.type === "Clause" ? "blue" : "cyan"}>{template.type}</Tag>
            {template.tags.map((tag) => (
              <Tag key={tag} bordered={false}>
                {tag}
              </Tag>
            ))}
          </Space>
        }
        description={template.description}
      />
    </List.Item>
  );

  return (
    <Modal open={open} onCancel={close} footer={null} title={IMPORT.library.modalTitle} width={860} destroyOnClose>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Input.Search
          allowClear
          placeholder={IMPORT.library.search}
          aria-label={IMPORT.library.search}
          value={filter.query}
          onChange={(e) => update({ query: e.target.value })}
        />
        <Space wrap size={12}>
          <Select
            aria-label={IMPORT.library.typeLabel}
            style={{ minWidth: 140 }}
            value={filter.type}
            onChange={(type: LibraryFilter["type"]) => update({ type })}
            options={[
              { value: "", label: IMPORT.library.typeAll },
              ...IMPORT.library.types.map((t) => ({ value: t, label: t })),
            ]}
          />
          <Checkbox checked={filter.showArchived} onChange={(e) => update({ showArchived: e.target.checked })}>
            {IMPORT.library.showArchived}
          </Checkbox>
          <Button onClick={() => setFilter(EMPTY_FILTER)}>{IMPORT.library.clear}</Button>
          {templates && <Typography.Text type="secondary">{IMPORT.library.count(shown.length)}</Typography.Text>}
        </Space>
        {tags.length > 0 && (
          <Space wrap size={[8, 8]} align="start">
            <Typography.Text strong id="nd-library-categories">
              {IMPORT.library.categories}:
            </Typography.Text>
            {/* Real checkboxes: reachable with Tab, toggled with Space, and announced as checked. */}
            <div role="group" aria-labelledby="nd-library-categories">
              <Checkbox.Group
                value={filter.tags}
                onChange={(values) => update({ tags: values as string[] })}
                options={tags.map((tag) => ({ label: tag, value: tag }))}
              />
            </div>
          </Space>
        )}
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {IMPORT.library.compatibleNote}
        </Typography.Text>
        {loadError ? (
          <Typography.Text type="danger">{IMPORT.library.loadFailed(loadError)}</Typography.Text>
        ) : !templates ? (
          <Space>
            <Spin size="small" />
            <Typography.Text type="secondary">{IMPORT.library.loading}</Typography.Text>
          </Space>
        ) : groups.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={IMPORT.library.empty} />
        ) : (
          <div style={{ maxHeight: "52vh", overflowY: "auto", paddingRight: 4 }}>
            {groups.map((group) => (
              <section key={group.key} aria-label={group.title}>
                <Typography.Title level={5} style={{ textTransform: "capitalize", margin: "12px 0 4px" }}>
                  {group.title} <Typography.Text type="secondary">({group.templates.length})</Typography.Text>
                </Typography.Title>
                <List size="small" dataSource={group.templates} renderItem={renderRow} />
              </section>
            ))}
          </div>
        )}
      </Space>
    </Modal>
  );
};

interface UrlModalProps {
  open: boolean;
  onClose: () => void;
}

/** Import a `.cta` from any URL — the entry point for third-party libraries. */
const UrlModal = ({ open, onClose }: UrlModalProps) => {
  const { run, busy, cancel } = useImportTemplate();
  const [url, setUrl] = useState("");
  const close = () => {
    cancel();
    onClose();
  };

  const submit = async () => {
    const target = url.trim();
    if (!target) return;
    const rawName = target.split(/[?#]/)[0].split("/").pop() ?? "";
    let decoded = rawName;
    try {
      decoded = decodeURIComponent(rawName);
    } catch {
      // keep the literal name; it is only a display fallback
    }
    const fileName = decoded.replace(/\.(cta|zip)$/i, "");
    const ok = await run(async () => readTemplateArchive(await fetchArchive(target), fileName || "template"));
    if (ok) onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={close}
      title={IMPORT.url.modalTitle}
      okText={IMPORT.url.submit}
      cancelText={IMPORT.url.cancel}
      okButtonProps={{ disabled: !url.trim(), loading: busy }}
      onOk={() => void submit()}
      destroyOnClose
    >
      <Input
        type="url"
        value={url}
        placeholder={IMPORT.url.placeholder}
        aria-label={IMPORT.url.label}
        onChange={(e) => setUrl(e.target.value)}
        onPressEnter={() => void submit()}
      />
    </Modal>
  );
};

/**
 * Three ways to bring in a template, as a row under the gallery cards:
 * the Accord Project library, a file from disk and a URL. Each behaves like
 * "Start with this template".
 */
const ImportTemplates = () => {
  const { run, busy } = useImportTemplate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    void run(async () => readTemplateArchive(await file.arrayBuffer(), file.name.replace(/\.(cta|zip)$/i, "")));
  };

  return (
    <Space direction="vertical" size={8} role="group" aria-label={IMPORT.groupLabel}>
      <Typography.Text strong>{IMPORT.title}</Typography.Text>
      <Space size={12} wrap>
        <Button disabled={busy} onClick={() => setLibraryOpen(true)}>
          {IMPORT.library.button}
        </Button>
        <Button disabled={busy} onClick={() => fileInput.current?.click()}>
          {IMPORT.upload.button}
        </Button>
        <Button disabled={busy} onClick={() => setUrlOpen(true)}>
          {IMPORT.url.button}
        </Button>
        <Typography.Text type="secondary">{IMPORT.upload.hint}</Typography.Text>
      </Space>
      <input
        ref={fileInput}
        type="file"
        hidden
        accept={IMPORT.upload.accept}
        aria-label={IMPORT.upload.inputLabel}
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <LibraryModal open={libraryOpen} onClose={() => setLibraryOpen(false)} />
      <UrlModal open={urlOpen} onClose={() => setUrlOpen(false)} />
    </Space>
  );
};

export default ImportTemplates;
