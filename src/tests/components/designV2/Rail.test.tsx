import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Rail from "../../../components/designV2/Rail";
import { RAIL, URLS } from "../../../components/designV2/constants";
import useAppStore from "../../../store/store";
import useDesignV2Store from "../../../store/designV2Store";
import { STEP_ID } from "../../../types/designV2.types";
import * as playground from "../../../samples/playground";
import tour from "../../../components/Tour";

vi.mock("../../../components/Tour", () => ({
  default: {
    start: vi.fn().mockResolvedValue(undefined),
  },
}));

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
    useDesignV2Store.setState({ view: "welcome" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("opens the playground menu", () => {
    render(<Rail />);

    openMenu();

    expect(screen.getByRole("menuitem", { name: /Open the demo document/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Replay the guided tour/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Browse example templates/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Docs: template format/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Reset the playground/ })).toBeInTheDocument();
  });

  it.each([
    ["Open the demo document", "demo"],
    ["Replay the guided tour", "tour"],
    ["Browse example templates", "examples"],
    ["Docs: template format", "docs"],
    ["Reset the playground", "reset"],
  ])("closes the menu after selecting %s", (label) => {
    render(<Rail />);

    clickMenuItem(label);

    expect(screen.queryByRole("menuitem", { name: new RegExp(label) })).not.toBeInTheDocument();
  });

  it("loads the demo sample and opens the Text step", async () => {
    render(<Rail />);

    clickMenuItem("Open the demo document");

    expect(loadSample).toHaveBeenCalledWith(playground.NAME);
    await waitFor(() => expect(useDesignV2Store.getState().view).toBe(STEP_ID.text));
    expect(useDesignV2Store.getState().selectedTemplate).toBeNull();
  });

  it("replays the guided tour", () => {
    render(<Rail />);

    clickMenuItem("Replay the guided tour");

    expect(tour.start).toHaveBeenCalledTimes(1);
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

  it("resets execution state and loads the demo sample", () => {
    useDesignV2Store.setState({ view: STEP_ID.simulate, selectedTemplate: "Counter Contract" });
    render(<Rail />);

    clickMenuItem("Reset the playground");

    expect(resetExecution).toHaveBeenCalledTimes(1);
    expect(loadSample).toHaveBeenCalledWith(playground.NAME);
    expect(useDesignV2Store.getState().view).toBe("welcome");
    expect(useDesignV2Store.getState().selectedTemplate).toBeNull();
  });

  it("does not let a pending demo navigation override reset", async () => {
    let resolveDemo!: () => void;
    const pendingDemo = new Promise<void>((resolve) => {
      resolveDemo = resolve;
    });
    loadSample.mockImplementation(() => pendingDemo);

    render(<Rail />);

    clickMenuItem("Open the demo document");
    clickMenuItem("Reset the playground");

    await act(async () => {
      resolveDemo();
      await pendingDemo;
    });

    expect(useDesignV2Store.getState().view).toBe("welcome");
  });
});
