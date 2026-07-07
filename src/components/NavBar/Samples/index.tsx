import { useCallback } from "react";
import {
  FileTextOutlined,
  CaretDownFilled,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { message, Modal } from "antd";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";
import useAppStore from "../../../store/store";
import { Dropdown, Menu, MenuItem, MenuItemGroup, Button } from "../components";

function useSamplesLogic() {
  const {
    samples,
    loadSample,
    sampleName,
    editorValue,
    editorModelCto,
    editorAgreementData,
    editorLogicTs,
    isLogicFeatureEnabled,
  } = useStoreWithEqualityFn(
    useAppStore,
    (state) => ({
      samples: state.samples,
      loadSample: state.loadSample as (key: string) => Promise<void>,
      sampleName: state.sampleName,
      editorValue: state.editorValue,
      editorModelCto: state.editorModelCto,
      editorAgreementData: state.editorAgreementData,
      editorLogicTs: state.editorLogicTs,
      isLogicFeatureEnabled: state.isLogicFeatureEnabled,
    }),
    shallow,
  );

  const performLoadSample = useCallback(
    async (name: string) => {
      try {
        await loadSample(name);
        void message.info(`Loaded ${name} sample`);
      } catch {
        void message.error("Failed to load sample");
      }
    },
    [loadSample],
  );

  const handleSampleClick = useCallback(
    (name: string) => {
      const currentSample = samples.find((s) => s.NAME === sampleName);
      const hasUnsavedChanges =
        !currentSample ||
        editorValue !== currentSample.TEMPLATE ||
        editorModelCto !== currentSample.MODEL ||
        editorAgreementData !== JSON.stringify(currentSample.DATA, null, 2) ||
        editorLogicTs !== (currentSample.LOGIC ?? "");

      if (hasUnsavedChanges) {
        Modal.confirm({
          title: "Load Sample Template",
          icon: <ExclamationCircleOutlined />,
          content: isLogicFeatureEnabled
            ? "Loading a new sample will replace your current Concerto Model, TemplateMark, JSON Data, and Logic. Any unsaved changes will be lost. Do you want to continue?"
            : "Loading a new sample will replace your current Concerto Model, TemplateMark, and JSON Data. Any unsaved changes will be lost. Do you want to continue?",
          okText: "Continue",
          cancelText: "Cancel",
          maskClosable: true,
          onOk: () => performLoadSample(name),
        });
      } else {
        void performLoadSample(name);
      }
    },
    [
      performLoadSample,
      samples,
      sampleName,
      editorValue,
      editorModelCto,
      editorAgreementData,
      editorLogicTs,
      isLogicFeatureEnabled,
    ],
  );

  return { samples, sampleName, handleSampleClick };
}

export function SampleMenuItems() {
  const { samples, handleSampleClick } = useSamplesLogic();
  return (
    <MenuItemGroup title="Samples">
      {samples?.map((s) => (
        <MenuItem key={s.NAME} onClick={() => void handleSampleClick(s.NAME)}>
          <FileTextOutlined />
          <span>{s.NAME}</span>
        </MenuItem>
      ))}
    </MenuItemGroup>
  );
}

export default function Samples() {
  const { samples, sampleName, handleSampleClick } = useSamplesLogic();

  const samplesMenu = (
    <Menu>
      <MenuItemGroup title="Load Sample">
        {samples?.map((s) => (
          <MenuItem key={s.NAME} onClick={() => void handleSampleClick(s.NAME)}>
            <FileTextOutlined />
            <span>{s.NAME}</span>
          </MenuItem>
        ))}
      </MenuItemGroup>
    </Menu>
  );

  return (
    <Dropdown overlay={samplesMenu} trigger={["click"]}>
      <Button className="bg-transparent border-none text-white h-16 flex items-center cursor-pointer">
        Samples{sampleName ? `: ${sampleName}` : ""}
        <CaretDownFilled className="text-xs ml-1.5" />
      </Button>
    </Dropdown>
  );
}
