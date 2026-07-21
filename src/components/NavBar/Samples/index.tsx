import { useCallback } from "react";
import {
  FileTextOutlined,
  CaretDownFilled,
  ExclamationCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { message, Modal } from "antd";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";
import useAppStore from "../../../store/store";
import { Dropdown, Menu, MenuItem, MenuItemGroup, Button } from "../components";
import * as counterLogic from "../../../samples/counterLogic";

function useSamplesLogic() {
  const {
    samples,
    lastLoadedSample,
    loadSample,
    fetchTemplateLibrary,
    sampleName,
    editorValue,
    editorModelCto,
    editorAgreementData,
    editorLogicTs,
    isLogicFeatureEnabled,
    isLoadingIndex,
    isLoadingTemplate,
    templateLibraryError,
  } = useStoreWithEqualityFn(
    useAppStore,
    (state) => ({
      samples: state.samples,
      lastLoadedSample: state.lastLoadedSample,
      loadSample: state.loadSample as (key: string) => Promise<void>,
      fetchTemplateLibrary: state.fetchTemplateLibrary,
      sampleName: state.sampleName,
      editorValue: state.editorValue,
      editorModelCto: state.editorModelCto,
      editorAgreementData: state.editorAgreementData,
      editorLogicTs: state.editorLogicTs,
      isLogicFeatureEnabled: state.isLogicFeatureEnabled,
      isLoadingIndex: state.isLoadingIndex,
      isLoadingTemplate: state.isLoadingTemplate,
      templateLibraryError: state.templateLibraryError,
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
      const hasUnsavedChanges =
        lastLoadedSample != null &&
        (editorValue !== lastLoadedSample.TEMPLATE ||
          editorModelCto !== lastLoadedSample.MODEL ||
          editorAgreementData !==
            JSON.stringify(lastLoadedSample.DATA, null, 2) ||
          editorLogicTs !== (lastLoadedSample.LOGIC ?? ""));

      if (hasUnsavedChanges) {
        Modal.confirm({
          title: "Load Sample Template",
          icon: <ExclamationCircleOutlined />,
          content: isLogicFeatureEnabled
            ? "Loading a new template will replace your current Concerto Model, TemplateMark, JSON Data, and Logic. Any unsaved changes will be lost. Do you want to continue?"
            : "Loading a new template will replace your current Concerto Model, TemplateMark, and JSON Data. Any unsaved changes will be lost. Do you want to continue?",
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
      lastLoadedSample,
      editorValue,
      editorModelCto,
      editorAgreementData,
      editorLogicTs,
      isLogicFeatureEnabled,
    ],
  );

  return {
    samples,
    sampleName,
    handleSampleClick,
    fetchTemplateLibrary,
    isLogicFeatureEnabled,
    isLoadingIndex,
    isLoadingTemplate,
    templateLibraryError,
  };
}

export function SampleMenuItems() {
  const { samples, handleSampleClick, isLogicFeatureEnabled, isLoadingIndex } =
    useSamplesLogic();

  return (
    <>
      {isLogicFeatureEnabled && (
        <MenuItemGroup title="Logic Sample">
          <MenuItem onClick={() => void handleSampleClick(counterLogic.NAME)}>
            <FileTextOutlined />
            <span>{counterLogic.NAME}</span>
          </MenuItem>
        </MenuItemGroup>
      )}
      <MenuItemGroup title="Templates">
        {isLoadingIndex ? (
          <div className="px-4 py-2 text-sm text-gray-500 flex items-center space-x-2">
            <LoadingOutlined />
            <span>Loading templates…</span>
          </div>
        ) : (
          samples?.map((s) => (
            <MenuItem
              key={s.NAME}
              onClick={() => void handleSampleClick(s.NAME)}
            >
              <FileTextOutlined />
              <span>{s.NAME}</span>
            </MenuItem>
          ))
        )}
      </MenuItemGroup>
    </>
  );
}

export default function Samples() {
  const {
    samples,
    sampleName,
    handleSampleClick,
    fetchTemplateLibrary,
    isLogicFeatureEnabled,
    isLoadingIndex,
    isLoadingTemplate,
    templateLibraryError,
  } = useSamplesLogic();

  const samplesMenu = (
    <Menu>
      {isLogicFeatureEnabled && (
        <MenuItemGroup title="Logic Sample">
          <MenuItem onClick={() => void handleSampleClick(counterLogic.NAME)}>
            <FileTextOutlined />
            <span>{counterLogic.NAME}</span>
          </MenuItem>
        </MenuItemGroup>
      )}
      <MenuItemGroup title="Templates">
        {isLoadingIndex ? (
          <div className="px-4 py-2 text-sm text-gray-500 flex items-center space-x-2">
            <LoadingOutlined />
            <span>Loading templates…</span>
          </div>
        ) : templateLibraryError ? (
          <div className="px-4 py-2 text-sm text-red-500">
            <div>Failed to load templates.</div>
            <button
              type="button"
              className="flex items-center space-x-1 mt-1 text-blue-500 hover:text-blue-700 bg-transparent border-none cursor-pointer p-0 text-sm"
              onClick={() => void fetchTemplateLibrary()}
            >
              <ReloadOutlined />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          samples?.map((s) => (
            <MenuItem
              key={s.NAME}
              onClick={() =>
                !isLoadingTemplate ? void handleSampleClick(s.NAME) : undefined
              }
              className={
                isLoadingTemplate ? "opacity-50 cursor-not-allowed" : ""
              }
            >
              <FileTextOutlined />
              <span>{s.NAME}</span>
            </MenuItem>
          ))
        )}
      </MenuItemGroup>
    </Menu>
  );

  const label = isLoadingTemplate ? (
    <>
      <LoadingOutlined className="mr-1.5" />
      Loading…
    </>
  ) : (
    <>
      Samples{sampleName ? `: ${sampleName}` : ""}
      <CaretDownFilled className="text-xs ml-1.5" />
    </>
  );

  return (
    <Dropdown overlay={samplesMenu} trigger={["click"]}>
      <Button className="bg-transparent border-none text-white h-16 flex items-center cursor-pointer">
        {label}
      </Button>
    </Dropdown>
  );
}
