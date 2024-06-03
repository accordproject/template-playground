import { useState } from "react";
import { Button, Dropdown, Space, message, Spin } from "antd";
import { DownOutlined } from "@ant-design/icons";

import useAppStore from "./store";

function SampleDropdown() {
  const samples = useAppStore((state) => state.samples);
  const loadSample = useAppStore((state) => state.loadSample);
  const selectedSample = useAppStore((state) => state.sampleName);
  const [loading, setLoading] = useState(false);

  const items = samples.map((s) => ({
    label: s.NAME,
    key: s.NAME,
  }));

  const handleMenuClick = async (e: any) => {
    if (e.key) {
      setLoading(true);
      try {
        await loadSample(e.key);
        message.info(`Loaded ${e.key} sample`);
      } catch (error) {
        message.error("Failed to load sample");
      } finally {
        setLoading(false);
      }
    }
  };

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  return (
    <Space>
      <Dropdown menu={menuProps} disabled={loading}>
        <Button disabled={loading}>
          {loading ? <Spin /> : selectedSample ? selectedSample : "Load Sample"}
          <DownOutlined />
        </Button>
      </Dropdown>
    </Space>
  );
}

export default SampleDropdown;
