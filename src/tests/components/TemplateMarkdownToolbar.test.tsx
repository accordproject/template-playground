import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TemplateMarkdownToolbar } from "../../components/TemplateMarkdownToolbar";
import * as markdownContext from "../../contexts/MarkdownEditorContext";

const mockStoreState = {
  textColor: "#121212",
  backgroundColor: "#ffffff",
};

vi.mock("../../store/store", () => ({
  default: vi.fn((selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState)),
}));

describe("TemplateMarkdownToolbar", () => {
  let mockCommands: markdownContext.MarkdownEditorCommands;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreState.textColor = "#121212";
    mockStoreState.backgroundColor = "#ffffff";
    mockCommands = {
      toggleHeading1: vi.fn(),
      toggleHeading2: vi.fn(),
      toggleHeading3: vi.fn(),
      toggleBold: vi.fn(),
      toggleItalic: vi.fn(),
      toggleUnorderedList: vi.fn(),
      toggleOrderedList: vi.fn(),
      insertLink: vi.fn(),
      insertImage: vi.fn(),
    };
    vi.spyOn(markdownContext, "useMarkdownEditorContext").mockReturnValue({
      commands: mockCommands,
      setCommands: vi.fn(),
    });
  });

  it("renders all markdown toolbar action buttons", () => {
    render(<TemplateMarkdownToolbar />);

    expect(screen.getByRole("button", { name: "Heading 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Heading 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Heading 3" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unordered list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ordered list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Insert link" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Insert image" })).toBeInTheDocument();
  });

  it("triggers corresponding commands on button click", () => {
    render(<TemplateMarkdownToolbar />);

    fireEvent.click(screen.getByRole("button", { name: "Heading 1" }));
    expect(mockCommands.toggleHeading1).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Heading 2" }));
    expect(mockCommands.toggleHeading2).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Heading 3" }));
    expect(mockCommands.toggleHeading3).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(mockCommands.toggleBold).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Italic" }));
    expect(mockCommands.toggleItalic).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Unordered list" }));
    expect(mockCommands.toggleUnorderedList).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Ordered list" }));
    expect(mockCommands.toggleOrderedList).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Insert link" }));
    expect(mockCommands.insertLink).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Insert image" }));
    expect(mockCommands.insertImage).toHaveBeenCalledTimes(1);
  });

  it("applies high-contrast color in dark mode", () => {
    mockStoreState.backgroundColor = "#121212";
    mockStoreState.textColor = "#ffffff";

    render(<TemplateMarkdownToolbar />);

    const boldBtn = screen.getByRole("button", { name: "Bold" });
    expect(boldBtn).toHaveStyle({ color: "#f3f4f6" });
  });

  it("applies standard color in light mode", () => {
    mockStoreState.backgroundColor = "#ffffff";
    mockStoreState.textColor = "#121212";

    render(<TemplateMarkdownToolbar />);

    const boldBtn = screen.getByRole("button", { name: "Bold" });
    expect(boldBtn).toHaveStyle({ color: "#121212" });
  });
});
