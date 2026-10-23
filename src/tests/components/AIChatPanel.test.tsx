import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIChatPanel } from "../../components/AIChatPanel";
import useAppStore from "../../store/store";
import { message } from "antd";

const messageSuccessSpy = vi.spyOn(message, "success").mockReturnValue({} as unknown as ReturnType<typeof message.success>);
const writeTextMock = vi.fn().mockResolvedValue(undefined);

describe("AIChatPanel Apply to Editor", () => {
  const setEditorValueMock = vi.fn();
  const setTemplateMarkdownMock = vi.fn();
  const setEditorModelCtoMock = vi.fn();
  const setModelCtoMock = vi.fn();
  const setEditorAgreementDataMock = vi.fn();
  const setDataMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    useAppStore.setState({
      chatState: {
        messages: [
          {
            id: "msg-1",
            role: "assistant",
            content: "Here is the code:\n```templatemarkApply\nHello {{name}}\n```\nAnd model:\n```concertoApply\nnamespace test\n```\nAnd data:\n```jsonApply\n{\"name\": \"John\"}\n```",
            timestamp: new Date(),
          },
        ],
        isLoading: false,
        error: null,
      },
      aiConfig: {
        apiKey: "test-key",
        provider: "openai",
        model: "gpt-4",
        includeTemplateMarkContent: true,
        includeConcertoModelContent: true,
        includeDataContent: true,
      },
      setEditorValue: setEditorValueMock,
      setTemplateMarkdown: setTemplateMarkdownMock,
      setEditorModelCto: setEditorModelCtoMock,
      setModelCto: setModelCtoMock,
      setEditorAgreementData: setEditorAgreementDataMock,
      setData: setDataMock,
      backgroundColor: "#ffffff",
      textColor: "#000000",
    });
  });

  it("renders Apply buttons for templatemark, concerto, and json apply blocks", () => {
    render(<AIChatPanel />);

    expect(screen.getByRole("button", { name: /Apply to TemplateMark/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Apply to Concerto Model/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Apply to JSON Data/i })).toBeInTheDocument();
  });

  it("applies TemplateMark code to editor when Apply button is clicked", () => {
    render(<AIChatPanel />);

    const applyBtn = screen.getByRole("button", { name: /Apply to TemplateMark/i });
    fireEvent.click(applyBtn);

    expect(setEditorValueMock).toHaveBeenCalledWith("Hello {{name}}");
    expect(setTemplateMarkdownMock).toHaveBeenCalledWith("Hello {{name}}");
    expect(messageSuccessSpy).toHaveBeenCalledWith("Applied to TemplateMark editor!");
  });

  it("applies Concerto code to editor when Apply button is clicked", () => {
    render(<AIChatPanel />);

    const applyBtn = screen.getByRole("button", { name: /Apply to Concerto Model/i });
    fireEvent.click(applyBtn);

    expect(setEditorModelCtoMock).toHaveBeenCalledWith("namespace test");
    expect(setModelCtoMock).toHaveBeenCalledWith("namespace test");
    expect(messageSuccessSpy).toHaveBeenCalledWith("Applied to Concerto Model editor!");
  });

  it("applies JSON data to editor when Apply button is clicked", () => {
    render(<AIChatPanel />);

    const applyBtn = screen.getByRole("button", { name: /Apply to JSON Data/i });
    fireEvent.click(applyBtn);

    expect(setEditorAgreementDataMock).toHaveBeenCalledWith('{"name": "John"}');
    expect(setDataMock).toHaveBeenCalledWith('{"name": "John"}');
    expect(messageSuccessSpy).toHaveBeenCalledWith("Applied to JSON Data editor!");
  });

  it("copies code to clipboard on Copy button click", async () => {
    render(<AIChatPanel />);

    const copyButtons = screen.getAllByRole("button", { name: /Copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("Hello {{name}}");
      expect(messageSuccessSpy).toHaveBeenCalledWith("Code copied to clipboard!");
    });
  });
});
