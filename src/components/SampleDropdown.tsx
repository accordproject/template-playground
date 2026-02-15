import { Button, Dropdown, Space, message, MenuProps, Modal } from "antd";
import { DownOutlined, SaveOutlined, DeleteOutlined, FolderOutlined } from "@ant-design/icons";
import { useCallback, useMemo, useState, useEffect } from "react";
import useAppStore from "../store/store";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

function SampleDropdown({
  setLoading,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}): JSX.Element {
  const {
    samples,
    loadSample,
    customSamples,
    loadCustomSample,
    deleteCustomSample,
    refreshCustomSamples,
    setSaveModalOpen
  } = useStoreWithEqualityFn(
    useAppStore,
    (state) => ({
      samples: state.samples,
      loadSample: state.loadSample as (key: string) => Promise<void>,
      customSamples: state.customSamples,
      loadCustomSample: state.loadCustomSample,
      deleteCustomSample: state.deleteCustomSample,
      refreshCustomSamples: state.refreshCustomSamples,
      setSaveModalOpen: state.setSaveModalOpen,
    }),
    shallow
  );

  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  // Refresh custom samples on mount and when they change
  useEffect(() => {
    refreshCustomSamples();
  }, [refreshCustomSamples]);

  const handleDeleteCustomSample = useCallback(
    (id: string, name: string, e: React.MouseEvent) => {
      e.stopPropagation();

      Modal.confirm({
        title: 'Delete Custom Sample',
        content: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
        okText: 'Delete',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk() {
          deleteCustomSample(id);
          void message.success(`Deleted "${name}"`);
          setSelectedSample(null);
        },
      });
    },
    [deleteCustomSample]
  );

  const items: MenuProps["items"] = useMemo(() => {
    const builtInItems = samples?.map((s) => ({
      label: s.NAME,
      key: `builtin-${s.NAME}`,
      icon: <FolderOutlined />,
    })) || [];

    const customItems = customSamples?.map((s) => ({
      label: (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span>{s.name}</span>
          <DeleteOutlined
            onClick={(e) => handleDeleteCustomSample(s.id, s.name, e)}
            style={{ color: '#ff4d4f', marginLeft: 8 }}
          />
        </div>
      ),
      key: `custom-${s.id}`,
      icon: <FolderOutlined style={{ color: '#19c6c8' }} />,
    })) || [];

    const menuItems: MenuProps["items"] = [];

    // Add built-in samples section
    if (builtInItems.length > 0) {
      menuItems.push({
        type: 'group',
        label: 'Built-in Samples',
        children: builtInItems,
      });
    }

    // Add custom samples section
    if (customItems.length > 0) {
      menuItems.push({
        type: 'group',
        label: 'Custom Samples',
        children: customItems,
      });
    }

    // Add "Save Current" button
    menuItems.push(
      {
        type: 'divider',
      },
      {
        label: 'Save Current as Sample',
        key: 'save-current',
        icon: <SaveOutlined style={{ color: '#19c6c8' }} />,
      }
    );

    return menuItems;
  }, [samples, customSamples, handleDeleteCustomSample]);

  const handleMenuClick = useCallback(
    async (e: { key: string }) => {
      if (e.key === 'save-current') {
        setSaveModalOpen(true);
        return;
      }

      const [type, ...keyParts] = e.key.split('-');
      const key = keyParts.join('-');

      if (type === 'builtin') {
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
      } else if (type === 'custom') {
        setLoading(true);
        try {
          await loadCustomSample(key);
          const sample = customSamples.find(s => s.id === key);
          if (sample) {
            void message.info(`Loaded ${sample.name}`);
            setSelectedSample(sample.name);
          }
        } catch (error) {
          void message.error("Failed to load custom sample");
        } finally {
          setLoading(false);
        }
      }
    },
    [loadSample, loadCustomSample, customSamples, setLoading, setSaveModalOpen]
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
