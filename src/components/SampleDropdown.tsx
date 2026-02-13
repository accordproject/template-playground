import { Button, Dropdown, Space, message, MenuProps, Modal } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import useAppStore from "../store/store";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

function SampleDropdown({
  setLoading,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}): JSX.Element {
  const { samples, loadSample, backgroundColor, textColor } = useStoreWithEqualityFn(
    useAppStore,
    (state) => ({
      samples: state.samples,
      loadSample: state.loadSample as (key: string) => Promise<void>,
      backgroundColor: state.backgroundColor,
      textColor: state.textColor,
    }),
    shallow
  );

  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  useEffect(() => {
    const isDarkMode = backgroundColor !== '#ffffff';
    const style = document.createElement("style");
    style.innerHTML = `
      .sample-switch-confirm .ant-modal-content {
        background-color: ${backgroundColor} !important;
        color: ${textColor} !important;
      }
      .sample-switch-confirm .ant-modal-header {
        background-color: ${backgroundColor} !important;
      }
      .sample-switch-confirm .ant-modal-title {
        color: ${textColor} !important;
      }
      .sample-switch-confirm .ant-btn-default {
        background-color: ${isDarkMode ? '#374151' : '#e5e7eb'} !important;
        color: ${textColor} !important;
        border-color: ${isDarkMode ? '#4b5563' : '#d1d5db'} !important;
      }
      .sample-switch-confirm .ant-btn-default:hover {
        background-color: ${isDarkMode ? '#4b5563' : '#d1d5db'} !important;
        border-color: ${isDarkMode ? '#6b7280' : '#9ca3af'} !important;
      }
      .sample-switch-confirm .ant-btn-primary {
        background-color: ${isDarkMode ? '#dc2626' : '#ef4444'} !important;
        border-color: ${isDarkMode ? '#dc2626' : '#ef4444'} !important;
      }
      .sample-switch-confirm .ant-btn-primary:hover {
        background-color: ${isDarkMode ? '#b91c1c' : '#dc2626'} !important;
        border-color: ${isDarkMode ? '#b91c1c' : '#dc2626'} !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [backgroundColor, textColor]);

  const items: MenuProps["items"] = useMemo(
    () =>
      samples?.map((s) => ({
        label: s.NAME,
        key: s.NAME,
      })) || [],
    [samples]
  );

  const hasUnsavedChanges = () => {
    const state = useAppStore.getState();
    return (
      state.editorValue.trim() !== state.templateMarkdown.trim() ||
      state.editorModelCto.trim() !== state.modelCto.trim() ||
      state.editorAgreementData.trim() !== state.data.trim()
    );
  };

  const proceedWithLoad = useCallback(
    async (key: string) => {
      setLoading(true);
      try {
        await loadSample(key);
        void message.info(`Loaded ${key} sample`);
        setSelectedSample(key);
      } catch (error) {
        void message.error("Failed to load sample");
      } finally {
        setLoading(false);
      }
    },
    [loadSample, setLoading]
  );

  const handleMenuClick = useCallback(
    async (e: { key: string }) => {
      if (e.key) {
        if (hasUnsavedChanges()) {
          Modal.confirm({
            title: <span style={{ color: textColor }}>Unsaved Changes</span>,
            content: (
              <div>
                <p style={{ color: textColor }}>You have unsaved changes that will be lost if you switch templates. Do you want to continue?</p>
              </div>
            ),
            okText: 'Continue',
            cancelText: 'Cancel',
            icon: null,
            rootClassName: "sample-switch-confirm",
            onOk: () => {
              void proceedWithLoad(e.key);
            },
          });
        } else {
          await proceedWithLoad(e.key);
        }
      }
    },
    [proceedWithLoad, textColor]
  );
  
  
  return (
    <Space>
      <Dropdown menu={{ items, onClick: (e) => void handleMenuClick(e) }} trigger={["click"]}>
        <div className="samples-element">
          <Button aria-label="Load sample dropdown">
            {selectedSample ? selectedSample : "Load Sample"} <DownOutlined />
          </Button>
        </div>
      </Dropdown>
    </Space>
  );
}

export default SampleDropdown;
