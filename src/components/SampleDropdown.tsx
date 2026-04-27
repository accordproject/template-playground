/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Button, Dropdown, Space, message, MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useCallback, useMemo, useState } from "react";
import useAppStore from "../store/store";
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
      loadSample: state.loadSample as (key: string) => Promise<boolean>,
    }),
    shallow
  );

  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  const items: MenuProps["items"] = useMemo(
    () =>
      samples?.map((s) => ({
        label: s.NAME,
        key: s.NAME,
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
          setSelectedSample(e.key);
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
