import { Button, Dropdown, Space, message } from "antd";
import { DownOutlined } from "@ant-design/icons";

import useAppStore from "./store/store";

function SampleDropdown({ setLoading }: { setLoading: any }) {
  const samples = useAppStore((state) => state.samples);
  const loadSample = useAppStore((state) => state.loadSample);

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
      <Dropdown menu={menuProps} trigger={["click"]}>
        <Button>
          Load Sample <DownOutlined />
        </Button>
      </Dropdown>
    </Space>
  );
}

export default SampleDropdown;
