import { Button, Dropdown, Space, message, MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useCallback, useMemo, useState } from "react";
import useAppStore from "@store/store";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

function SampleDropdown({
  setLoading,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}): JSX.Element {
  const { samples, loadSample } = useStoreWithEqualityFn(
    useAppStore,
    (state) => ({
      samples: state.samples,
      loadSample: state.loadSample as (key: string) => Promise<void>,
    }),
    shallow
  );

  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  const items: MenuProps["items"] = useMemo(
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
          setSelectedSample(e.key);
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
            {selectedSample ? selectedSample : "Load Sample"} <DownOutlined />
          </Button>
        </div>
      </Dropdown>
    </Space>
  );
}

export default SampleDropdown;
