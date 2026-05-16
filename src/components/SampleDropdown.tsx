
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

import { Button, Dropdown, Space, message, Modal, MenuProps } from "antd";
import { DownOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
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

  const { samples, loadSample, sampleName, editorValue, editorModelCto, editorAgreementData } =
    useStoreWithEqualityFn(
      useAppStore,
      (state) => ({
        samples: state.samples,
        loadSample: state.loadSample as (key: string) => Promise<void>,
        sampleName: state.sampleName,
        editorValue: state.editorValue,
        editorModelCto: state.editorModelCto,
        editorAgreementData: state.editorAgreementData,
      }),
      shallow
    );
 main

  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  const items: MenuProps["items"] = useMemo(
    () =>
      samples?.map((s) => ({
        label: s.NAME,
        key: s.NAME,
      })) || [],
    [samples]
  );

  const performLoadSample = useCallback(
    async (key: string) => {
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
    },
    [loadSample, setLoading]
  );

  const handleMenuClick = useCallback(
    (e: { key: string }) => {
      if (e.key) {
        const currentSample = samples.find((s) => s.NAME === sampleName);
        const hasUnsavedChanges =
          !currentSample ||
          editorValue !== currentSample.TEMPLATE ||
          editorModelCto !== currentSample.MODEL ||
          editorAgreementData !== JSON.stringify(currentSample.DATA, null, 2);

        if (hasUnsavedChanges) {
          Modal.confirm({
            title: "Load Sample Template",
            icon: <ExclamationCircleOutlined />,
            content:
              "Loading a new sample will replace your current Concerto Model, TemplateMark, and JSON Data. Any unsaved changes will be lost. Do you want to continue?",
            okText: "Continue",
            cancelText: "Cancel",
            maskClosable: true,
            onOk: () => performLoadSample(e.key),
          });
        } else {
          void performLoadSample(e.key);
        }
      }
    },
    [performLoadSample, samples, sampleName, editorValue, editorModelCto, editorAgreementData]
  );


  return (
    <Space>
      <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={["click"]}>
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
