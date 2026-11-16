import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Rail from "../../../components/designV2/Rail";
import { RAIL, URLS } from "../../../components/designV2/constants";
import useAppStore from "../../../store/store";
import useDesignV2Store from "../../../store/designV2Store";
import { STEP_ID } from "../../../types/designV2.types";
import * as playground from "../../../samples/playground";

vi.mock("../../../components/SettingsModal", () => ({
  default: () => null,
}));

const loadSample = vi.fn().mockResolvedValue(undefined);
const resetExecution = vi.fn();

const openMenu = () => {
  fireEvent.click(screen.getByRole("button", { name: RAIL.menuButton }));
};

const clickMenuItem = (name: string) => {
  openMenu();
  fireEvent.click(screen.getByRole("menuitem", { name: new RegExp(name) }));
};

/** A flow part-way through: Simulate open, a template picked, Preview on, one pane closed, a run selected. */
const midFlow = () =>
  useDesignV2Store.setState({
    view: STEP_ID.simulate,
    selectedTemplate: "Counter Contract",
    previewOpen: true,
    modelDataPanes: { model: true, data: false },
    selectedRunId: "run-1",
    helpRailOpen: false,
  });

describe("Design V2 Rail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "open").mockImplementation(() => null);
    useAppStore.setState({
      sampleName: playground.NAME,
      loadSample,
      resetExecution,
      setSettingsOpen: vi.fn(),
    });
    useDesignV2Store.getState().resetFlow();
    useDesignV2Store.setState({ helpRailOpen: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the playground menu", () => {
    render(<Rail />);

    openMenu();

    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      expect.stringContaining("Replay the introduction"),
      expect.stringContaining("Browse example templates"),
      expect.stringContaining("Docs: template format"),
      expect.stringContaining("Reset the playground"),
    ]);
  });

  it.each([
    ["Replay the introduction"],
    ["Browse example templates"],
    ["Docs: template format"],
    ["Reset the playground"],
  ])("closes the menu after selecting %s", (label) => {
    render(<Rail />);

    clickMenuItem(label);

    expect(screen.queryByRole("menuitem", { name: new RegExp(label) })).not.toBeInTheDocument();
  });

  it("replays the v2 introduction by returning to the welcome view", () => {
    useDesignV2Store.setState({ view: STEP_ID.modelData });
    render(<Rail />);

    clickMenuItem("Replay the introduction");

    expect(useDesignV2Store.getState().view).toBe("welcome");
    expect(loadSample).not.toHaveBeenCalled();
  });

  it("opens the template gallery", () => {
    render(<Rail />);

    clickMenuItem("Browse example templates");

    expect(useDesignV2Store.getState().view).toBe(STEP_ID.template);
  });

  it("opens the official documentation in a new tab", () => {
    render(<Rail />);

    clickMenuItem("Docs: template format");

    expect(window.open).toHaveBeenCalledWith(URLS.templateDocs, "_blank", "noopener,noreferrer");
  });

  describe("Reset the playground", () => {
    it("asks for confirmation before discarding anything", async () => {
      midFlow();
      render(<Rail />);

      clickMenuItem("Reset the playground");

      expect(await screen.findByText(RAIL.resetConfirm.title)).toBeInTheDocument();
      expect(screen.getByText(RAIL.resetConfirm.content(playground.NAME))).toBeInTheDocument();
      expect(resetExecution).not.toHaveBeenCalled();
      expect(loadSample).not.toHaveBeenCalled();
      expect(useDesignV2Store.getState().view).toBe(STEP_ID.simulate);
    });

    it("leaves everything as it was when cancelled", async () => {
      midFlow();
      render(<Rail />);

      clickMenuItem("Reset the playground");
      fireEvent.click(await screen.findByRole("button", { name: RAIL.resetConfirm.cancel }));

      await waitFor(() => expect(screen.queryByText(RAIL.resetConfirm.title)).not.toBeInTheDocument());
      expect(resetExecution).not.toHaveBeenCalled();
      expect(loadSample).not.toHaveBeenCalled();
      const state = useDesignV2Store.getState();
      expect(state.view).toBe(STEP_ID.simulate);
      expect(state.selectedTemplate).toBe("Counter Contract");
      expect(state.selectedRunId).toBe("run-1");
    });

    it("on confirm, clears the run history, reloads the sample and resets the whole flow", async () => {
      midFlow();
      render(<Rail />);

      clickMenuItem("Reset the playground");
      fireEvent.click(await screen.findByRole("button", { name: RAIL.resetConfirm.ok }));

      await waitFor(() => expect(resetExecution).toHaveBeenCalledTimes(1));
      expect(loadSample).toHaveBeenCalledWith(playground.NAME);
      const state = useDesignV2Store.getState();
      expect(state.view).toBe("welcome");
      expect(state.selectedTemplate).toBeNull();
      expect(state.previewOpen).toBe(false);
      expect(state.modelDataPanes).toEqual({ model: true, data: true });
      expect(state.selectedRunId).toBeNull();
      // A layout preference, not part of the flow.
      expect(state.helpRailOpen).toBe(false);
    });
  });
});
