import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Header from "../../../components/designV2/Header";
import { HEADER, URLS } from "../../../components/designV2/constants";
import useAppStore from "../../../store/store";
import useDesignV2Store from "../../../store/designV2Store";
import { STEP_ID, STEPS, type DesignV2View } from "../../../types/designV2.types";

describe("Design v2 Header", () => {
  const onNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({ sampleName: "Employment Offer" });
    useDesignV2Store.setState({ selectedTemplate: null });
  });

  it("wires the 'docs ↗' button as an external link to template docs", () => {
    render(<Header view={STEP_ID.template} onNavigate={onNavigate} />);

    const docsLink = screen.getByRole("link", { name: new RegExp(HEADER.docs, "i") });
    expect(docsLink).toBeInTheDocument();
    expect(docsLink).toHaveAttribute("href", URLS.templateDocs);
    expect(docsLink).toHaveAttribute("target", "_blank");
    expect(docsLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("displays the eyebrow and the active sample name", () => {
    render(<Header view={STEP_ID.template} onNavigate={onNavigate} />);

    expect(screen.getByText(HEADER.eyebrow)).toBeInTheDocument();
    expect(screen.getByText("Employment Offer")).toBeInTheDocument();
  });

  it("prefers selectedTemplate from designV2Store over sampleName", () => {
    useDesignV2Store.setState({ selectedTemplate: "Custom Lease Agreement" });
    render(<Header view={STEP_ID.text} onNavigate={onNavigate} />);

    expect(screen.getByText("Custom Lease Agreement")).toBeInTheDocument();
  });

  it("renders the stepper and triggers onNavigate when clicking a step", () => {
    render(<Header view={STEP_ID.template} onNavigate={onNavigate} />);

    const textStepButton = screen.getByRole("button", { name: /text/i });
    expect(textStepButton).toBeInTheDocument();

    fireEvent.click(textStepButton);
    expect(onNavigate).toHaveBeenCalledWith(STEP_ID.text);
  });

  it("disables skipped steps and applies skipped hint", () => {
    const isSkipped = (view: DesignV2View) => view === STEP_ID.simulate;
    render(<Header view={STEP_ID.logic} onNavigate={onNavigate} isSkipped={isSkipped} />);

    const simulateStepButton = screen.getByRole("button", { name: /simulate/i });
    expect(simulateStepButton).toBeDisabled();
    expect(simulateStepButton).toHaveAttribute("title", HEADER.skippedHint);
  });

  it("hides sample name and stepper on welcome view", () => {
    render(<Header view="welcome" onNavigate={onNavigate} />);

    expect(screen.getByText(HEADER.eyebrow)).toBeInTheDocument();
    expect(screen.queryByText("Employment Offer")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: HEADER.stepperLabel })).not.toBeInTheDocument();
  });

  describe("compact step picker", () => {
    const labelFor = (view: DesignV2View) => {
    const index = STEPS.findIndex((step) => step.id === view);
      return HEADER.stepPosition(index + 1, STEPS.length, STEPS[index].label);
    };

    const openPicker = (view: DesignV2View) => {
      fireEvent.click(screen.getByRole("button", { name: labelFor(view) }));
      return screen.findAllByRole("menuitem");
    };

    it("names the current step and its position", () => {
      render(<Header view={STEP_ID.logic} onNavigate={onNavigate} />);

      expect(screen.getByRole("button", { name: labelFor(STEP_ID.logic) })).toBeInTheDocument();
    });

    it("lists every step and marks the current one as selected", async () => {
      render(<Header view={STEP_ID.logic} onNavigate={onNavigate} />);
      const items = await openPicker(STEP_ID.logic);
      const logicIndex = STEPS.findIndex((step) => step.id === STEP_ID.logic);

      expect(items).toHaveLength(STEPS.length);
      expect(items[logicIndex]).toHaveClass("ant-dropdown-menu-item-selected");
    });

    it("triggers onNavigate when a step is chosen", async () => {
      render(<Header view={STEP_ID.template} onNavigate={onNavigate} />);
      const items = await openPicker(STEP_ID.template);
      const deployIndex = STEPS.findIndex((step) => step.id === STEP_ID.deploy);

      fireEvent.click(items[deployIndex]);
      expect(onNavigate).toHaveBeenCalledWith(STEP_ID.deploy);
    });

    it("disables a skipped step and shows the skipped meta", async () => {
      const isSkipped = (view: DesignV2View) => view === STEP_ID.simulate;
      render(<Header view={STEP_ID.logic} onNavigate={onNavigate} isSkipped={isSkipped} />);
      const items = await openPicker(STEP_ID.logic);
      const simulateIndex = STEPS.findIndex((step) => step.id === STEP_ID.simulate);

      expect(items[simulateIndex]).toHaveTextContent(HEADER.skippedMeta);
      expect(items[simulateIndex]).toHaveClass("ant-dropdown-menu-item-disabled");
    });
  });
});
