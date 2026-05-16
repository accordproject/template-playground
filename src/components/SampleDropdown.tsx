import { Button, Dropdown, Space, message, Modal, Menu, Tag, Typography } from "antd";
import type { MenuProps } from "antd";
import { DownOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useCallback, useMemo, useState } from "react";
import useAppStore from "../store/store";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

const { Text, Paragraph } = Typography;

function SampleDropdown({
  setLoading,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const { samples, loadSample, sampleName, editorValue, editorModelCto, editorAgreementData } =
    useStoreWithEqualityFn(
      useAppStore,
      (state) => ({
        samples: state.samples,
        loadSample: state.loadSample as (key: string) => Promise<void>,
        sampleName: state.sampleName,
        editorValue: state.editorValue,
        editorModelCto: state.editorModelCto,
        editorAgreementData: state.editorAgreementData,
      }),
      shallow
    );

  const performLoadSample = useCallback(
    async (key: string) => {
      setLoading(true);
      try {
        await loadSample(key);
        void message.info(`Loaded ${key} sample`);
      } catch (error) {
        void message.error("Failed to load sample");
      } finally {
        setLoading(false);
      }
    },
    [loadSample, setLoading]
  );

  const handleMenuClick: MenuProps["onClick"] = useCallback(
    (info) => {
      const { key } = info as { key: string };
      setOpen(false);
      if (key) {
        const currentSample = samples.find((s) => s.NAME === sampleName);
        const hasUnsavedChanges =
          !currentSample ||
          editorValue !== currentSample.TEMPLATE ||
          editorModelCto !== currentSample.MODEL ||
          editorAgreementData !== JSON.stringify(currentSample.DATA, null, 2);

        if (hasUnsavedChanges) {
          Modal.confirm({
            title: "Load Sample Template",
            icon: <ExclamationCircleOutlined />,
            content:
              "Loading a new sample will replace your current Concerto Model, TemplateMark, and JSON Data. Any unsaved changes will be lost. Do you want to continue?",
            okText: "Continue",
            cancelText: "Cancel",
            maskClosable: true,
            onOk: () => performLoadSample(key),
          });
        } else {
          void performLoadSample(key);
        }
      }
    },
    [performLoadSample, samples, sampleName, editorValue, editorModelCto, editorAgreementData]
  );

  const items: MenuProps["items"] = useMemo(
    () =>
      samples?.map((s) => ({
        key: s.NAME,
        label: (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "8px 0", whiteSpace: "normal" }}>
            <Text strong>{s.NAME}</Text>
            {s.DESCRIPTION && (
              <Paragraph
                type="secondary"
                style={{ fontSize: "12px", marginBottom: 0, lineHeight: "1.4" }}
                ellipsis={{ rows: 2 }}
              >
                {s.DESCRIPTION}
              </Paragraph>
            )}
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
              {s.DIFFICULTY && (
                <Tag
                  color={
                    s.DIFFICULTY === "Easy"
                      ? "green"
                      : s.DIFFICULTY === "Medium"
                      ? "orange"
                      : "red"
                  }
                  style={{ fontSize: "10px", lineHeight: "16px" }}
                >
                  {s.DIFFICULTY}
                </Tag>
              )}
              {s.TAGS?.map((tag) => (
                <Tag
                  key={tag}
                  style={{ fontSize: "10px", lineHeight: "16px", marginInlineEnd: 0 }}
                >
                  {tag}
                </Tag>
              ))}
            </div>
          </div>
        ),
      })) || [],
    [samples]
  );

  return (
    <Space>
      <Dropdown
        trigger={["click"]}
        open={open}
        onOpenChange={setOpen}
        dropdownRender={() => (
          <div style={{ 
            backgroundColor: 'var(--ant-color-bg-elevated, #fff)', 
            borderRadius: '8px', 
            boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)' 
          }}>
            <Menu
              items={items}
              onClick={handleMenuClick}
              style={{ 
                width: 320, 
                maxHeight: "500px", 
                overflowY: "auto",
                border: 'none',
                boxShadow: 'none'
              }}
            />
          </div>
        )}
      >
        <div className="samples-element">
          <Button aria-label="Load sample dropdown">
            {sampleName ? sampleName : "Load Sample"} <DownOutlined />
          </Button>
        </div>
      </Dropdown>
    </Space>
  );
}

export default SampleDropdown;
