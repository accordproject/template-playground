import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Header from "../../../components/designV2/Header";
import { HEADER, URLS } from "../../../components/designV2/constants";
import useAppStore from "../../../store/store";
import useDesignV2Store from "../../../store/designV2Store";
import { STEP_ID, type DesignV2View } from "../../../types/designV2.types";

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
});
