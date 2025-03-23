import { Button, Dropdown, Space, message } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useCallback, useMemo, useState } from "react";
import useAppStore from "../store/store";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";
import styled from "styled-components";

// Styled components for custom UI
const StyledButton = styled(Button)`
  background-color: #1b2540;
  color: #ffffff;
  border: none;
  border-radius: 5px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  width: 200px; /* Increased width for the button */
  justify-content: center; /* Spread text and icon */

  &:hover {
    background-color: #ffffff;
    color: #050c40;
    border: 1px solid #1b2540;
  }
`;

const StyledDropdown = styled(Dropdown)`
  .ant-dropdown-menu {
    background-color: #1b2540;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    padding: 8px 0;
    width: 200px; /* Match the button width or make it wider */
  }

  .ant-dropdown-menu-item {
    color: #ffffff;
    font-size: 14px;
    padding: 8px 16px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #19c6c7;
      color: #050c40;
    }
  }
`;

interface SampleDropdownProps {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

function SampleDropdown({ setLoading }: SampleDropdownProps) {
  const { samples, loadSample } = useStoreWithEqualityFn(
    useAppStore,
    (state) => ({
      samples: state.samples,
      loadSample: state.loadSample as (key: string) => Promise<void>,
    }),
    shallow
  );

  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  const items = useMemo(
    () =>
      samples?.map((s) => ({
        label: s.NAME,
        key: s.NAME,
      })) || [],
    [samples]
  );

  const handleMenuClick = useCallback(
    async ({ key }: { key: string }) => {
      if (key) {
        setLoading(true);
        try {
          await loadSample(key);
          message.info(`Loaded ${key} sample`);
          setSelectedSample(key);
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
      <StyledDropdown
        menu={{ items, onClick: handleMenuClick }}
        trigger={["click"]}
      >
        <StyledButton aria-label="Load sample dropdown">
          {selectedSample || "Load Sample"}
          <DownOutlined />
        </StyledButton>
      </StyledDropdown>
    </Space>
  );
}

export default SampleDropdown;
