import { Button, Dropdown, Space, message } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { memo, useCallback, useMemo } from "react";
import useAppStore from "../store/store";
import { shallow } from "zustand/shallow";

function SampleDropdown({ setLoading }: { setLoading: any }) {
  const { samples, loadSample } = useAppStore(
    (state) => ({
      samples: state.samples,
      loadSample: state.loadSample,
    }),
    shallow
  );

  const items = useMemo(
    () =>
      samples.map((s) => ({
        label: s.NAME,
        key: s.NAME,
      })),
    [samples]
  );

  const handleMenuClick = useCallback(
    async (e: any) => {
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
    },
    [loadSample, setLoading]
  );

  return (
    <Space>
      <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={["click"]}>
        <div className="samples-element">
          <Button>
            Load Sample <DownOutlined />
          </Button>
        </div>
      </Dropdown>
    </Space>
  );
}

export default memo(SampleDropdown);
