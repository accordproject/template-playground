import React from "react";
import { Button, Dropdown, Space, message, MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useCallback, useMemo } from "react";
import useAppStore from "../store/store";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

const SampleDropdown = function SampleDropdown({
  setLoading,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}): JSX.Element {
  const { samples, loadSample, sampleName, backgroundColor } = useStoreWithEqualityFn(
    useAppStore,
    (state) => ({
      samples: state.samples,
      loadSample: state.loadSample as (key: string) => Promise<void>,
      sampleName: state.sampleName,
      backgroundColor: state.backgroundColor
    }),
    shallow
  );

  

  const items: MenuProps["items"] = useMemo(
    () =>
      samples?.map((s) => ({
        label: s.NAME,
        key: s.NAME,
        style: backgroundColor === '#121212' ? {
          color: '#fff'
        } : undefined
      })) || [],
    [samples]
  );

  const handleMenuClick = useCallback(
    async (e: { key: string }) => {
      if (e.key) {
        setLoading(true);
        try {
          await loadSample(e.key);
          void message.info(`Loaded ${e.key} sample`);

        } catch (error) {
          void message.error("Failed to load sample");
        } finally {
          setLoading(false);
        }
      }
    },
    [loadSample, setLoading]
  );
  
  
  return (
    <Space>
      <Dropdown 
        menu={{ 
          items, 
          onClick: (e) => void handleMenuClick(e),
          style: backgroundColor === '#121212' ? {
            backgroundColor: '#1f1f1f',
            color: '#fff',
          } : undefined,
        }} 
        trigger={["click"]}
        dropdownRender={menu => (
          <div style={backgroundColor === '#121212' ? {
            backgroundColor: '#1f1f1f',
            color: '#fff',
          } : undefined}>
            {menu}
          </div>
        )}
      >
        <div className="samples-element">
          <Button 
            aria-label="Load sample dropdown"
            style={{
              backgroundColor: backgroundColor === '#121212' ? '#1f1f1f' : undefined,
              borderColor: backgroundColor === '#121212' ? '#434343' : undefined,
              color: backgroundColor === '#121212' ? '#fff' : undefined
            }}
          >
            {sampleName || "Load Sample"} <DownOutlined />
          </Button>
        </div>
      </Dropdown>
    </Space>
  );
}
export default SampleDropdown;
