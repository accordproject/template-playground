import type { MenuProps } from "antd";
import { Button, Dropdown, Space, message } from "antd";
import { DownOutlined } from "@ant-design/icons";

import useAppStore from "./store";

function SampleDropdown() {
  const samples = useAppStore((state) => state.samples);
  const loadSample = useAppStore((state) => state.loadSample);
  const selectedSample = useAppStore((state) => state.sampleName);

  const items = samples.map((s) => ({
    label: s.NAME,
    key: s.NAME,
  }));

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key) {
      loadSample(e.key);
      message.info(`Loaded ${e.key} sample`);
    }
  };

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  return (
    <Space>
      <Dropdown menu={menuProps}>
        <Button>
          {selectedSample ? selectedSample : "Load Sample"}
          <DownOutlined />
        </Button>
      </Dropdown>
    </Space>
  );
}

export default SampleDropdown;
