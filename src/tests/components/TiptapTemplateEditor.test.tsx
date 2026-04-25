import { act, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, beforeEach, expect, vi } from "vitest";
import { ModelManager } from "@accordproject/concerto-core";
import TiptapTemplateEditor from "../../editors/TiptapTemplateEditor";
import useAppStore from "../../store/store";

const {
  parseMarkdownTemplateMock,
  serializeToMarkdownMock,
} = vi.hoisted(() => ({
  parseMarkdownTemplateMock: vi.fn(),
  serializeToMarkdownMock: vi.fn(() => "serialized markdown"),
}));

vi.mock("../../tiptap-editor", () => ({
  TemplateEditor: ({ value }: { value: unknown }) => (
    <div data-testid="template-editor">{JSON.stringify(value)}</div>
  ),
  parseMarkdownTemplate: parseMarkdownTemplateMock,
  serializeToMarkdown: serializeToMarkdownMock,
}));

describe("TiptapTemplateEditor", () => {
  beforeEach(() => {
    parseMarkdownTemplateMock.mockReset();
    serializeToMarkdownMock.mockClear();

    useAppStore.setState({
      editorValue: "Loaded sample markdown",
      modelManager: undefined,
      isDarkMode: false,
    });
  });

  it("retries parsing when modelManager changes after an external markdown load", async () => {
    const loadedMarkdown = "Loaded sample markdown";
    const modelManager = new ModelManager({ strict: true });
    const parsedDoc = {
      $class: "org.accordproject.commonmark@0.5.0.Document",
      nodes: [],
    };

    parseMarkdownTemplateMock
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(parsedDoc);

    render(<TiptapTemplateEditor />);

    await waitFor(() => {
      expect(parseMarkdownTemplateMock).toHaveBeenCalledTimes(1);
    });
    expect(parseMarkdownTemplateMock).toHaveBeenNthCalledWith(
      1,
      loadedMarkdown,
      undefined,
      undefined
    );

    act(() => {
      useAppStore.setState({ modelManager });
    });

    await waitFor(() => {
      expect(parseMarkdownTemplateMock).toHaveBeenCalledTimes(2);
    });
    expect(parseMarkdownTemplateMock).toHaveBeenNthCalledWith(
      2,
      loadedMarkdown,
      undefined,
      modelManager
    );

    await waitFor(() => {
      expect(screen.getByTestId("template-editor")).toBeInTheDocument();
    });
    expect(screen.getByTestId("template-editor")).toHaveTextContent(
      JSON.stringify(parsedDoc)
    );
  });
});
