import { Button, Dropdown, Space, message } from "antd";
import { DownOutlined } from "@ant-design/icons";

import useAppStore from "../store/store";

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
      <Dropdown
        menu={menuProps}
        trigger={["click"]}
        aria-label="Dropdown menu for selecting a sample" // Added aria-label to describe the dropdown
      >
        <div className="samples-element">
          <Button aria-label="Open the dropdown to load a sample"> 
            {/* Added aria-label to the button to clarify its purpose */}
            Load Sample <DownOutlined />
          </Button>
        </div>
      </Dropdown>
    </Space>
  );
}

export default SampleDropdown;
