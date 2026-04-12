import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConcertoFormatButton from "../../components/ConcertoFormatButton";
import { formatConcertoModel } from "../../utils/formatConcertoModel";
import { message } from "antd";

const hoisted = vi.hoisted(() => ({
  storeState: {
    editorModelCto: "namespace org.example\nasset Sample identified by sampleId {\no String sampleId\n}",
    setEditorModelCto: vi.fn(),
    setModelCto: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../store/store", () => ({
  default: vi.fn((selector) => selector(hoisted.storeState)),
}));

vi.mock("../../utils/formatConcertoModel", () => ({
  formatConcertoModel: vi.fn(),
}));

vi.mock("antd", () => ({
  message: {
    error: vi.fn(),
  },
}));

describe("ConcertoFormatButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hoisted.storeState.editorModelCto = "namespace org.example\nasset Sample identified by sampleId {\no String sampleId\n}";
  });

  it("formats and updates editor + model state", async () => {
    vi.mocked(formatConcertoModel).mockReturnValue("formatted-cto");

    render(<ConcertoFormatButton />);
    fireEvent.click(screen.getByRole("button", { name: /format concerto/i }));

    expect(formatConcertoModel).toHaveBeenCalledWith(hoisted.storeState.editorModelCto);
    expect(hoisted.storeState.setEditorModelCto).toHaveBeenCalledWith("formatted-cto");
    expect(hoisted.storeState.setModelCto).toHaveBeenCalledWith("formatted-cto");
  });

  it("shows error toast and does not mutate when formatting fails", async () => {
    vi.mocked(formatConcertoModel).mockImplementation(() => {
      throw new Error("invalid cto");
    });

    render(<ConcertoFormatButton />);
    fireEvent.click(screen.getByRole("button", { name: /format concerto/i }));

    expect(hoisted.storeState.setEditorModelCto).not.toHaveBeenCalled();
    expect(hoisted.storeState.setModelCto).not.toHaveBeenCalled();
    expect(message.error).toHaveBeenCalledWith("Fix Concerto syntax errors before formatting.");
  });
});

