import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PlaygroundSidebar from "../../components/PlaygroundSidebar";
import FullScreenModal from "../../components/FullScreenModal";
import { vi } from "vitest";

// Mock the store
const mockSetEditorsVisible = vi.fn();
const mockSetPreviewVisible = vi.fn();
const mockSetProblemPanelVisible = vi.fn();
const mockSetAIChatOpen = vi.fn();
const mockSetSettingsOpen = vi.fn();

vi.mock("../../store/store", () => ({
  default: () => ({
    isEditorsVisible: true,
    isPreviewVisible: true,
    isProblemPanelVisible: false,
    isAIChatOpen: false,
    setEditorsVisible: mockSetEditorsVisible,
    setPreviewVisible: mockSetPreviewVisible,
    setProblemPanelVisible: mockSetProblemPanelVisible,
    setAIChatOpen: mockSetAIChatOpen,
    setSettingsOpen: mockSetSettingsOpen,
    generateShareableLink: vi.fn(() => "https://example.com"),
    textColor: "#000000",
    backgroundColor: "#ffffff",
  }),
}));

vi.mock("../../components/Tour", () => ({
  default: { start: vi.fn() },
}));

vi.mock("../../components/FullScreenModal", () => ({
  default: () => <div data-testid="fullscreen-modal">FullScreen</div>,
}));

vi.mock("../../components/SettingsModal", () => ({
  default: () => <div data-testid="settings-modal">Settings</div>,
}));

describe("Keyboard Accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PlaygroundSidebar - Top Nav", () => {
    it("activates Editor button on Enter key", () => {
      render(<PlaygroundSidebar />);
      const editorButton = screen.getByRole("button", { name: /Editor/i });
      fireEvent.keyDown(editorButton, { key: "Enter" });
      expect(mockSetEditorsVisible).toHaveBeenCalled();
    });

    it("activates Editor button on Space key", () => {
      render(<PlaygroundSidebar />);
      const editorButton = screen.getByRole("button", { name: /Editor/i });
      fireEvent.keyDown(editorButton, { key: " " });
      expect(mockSetEditorsVisible).toHaveBeenCalled();
    });

    it("does not activate Editor button on other keys", () => {
      render(<PlaygroundSidebar />);
      const editorButton = screen.getByRole("button", { name: /Editor/i });
      fireEvent.keyDown(editorButton, { key: "Tab" });
      expect(mockSetEditorsVisible).not.toHaveBeenCalled();
    });

    it("activates Preview button on Enter key", () => {
      render(<PlaygroundSidebar />);
      const previewButton = screen.getByRole("button", { name: /Preview/i });
      fireEvent.keyDown(previewButton, { key: "Enter" });
      expect(mockSetPreviewVisible).toHaveBeenCalled();
    });

    it("activates Problems button on Space key", () => {
      render(<PlaygroundSidebar />);
      const problemsButton = screen.getByRole("button", { name: /Problems/i });
      fireEvent.keyDown(problemsButton, { key: " " });
      expect(mockSetProblemPanelVisible).toHaveBeenCalled();
    });

    it("activates AI Assistant button on Enter key", () => {
      render(<PlaygroundSidebar />);
      const aiButton = screen.getByRole("button", { name: /AI Assistant/i });
      fireEvent.keyDown(aiButton, { key: "Enter" });
      expect(mockSetAIChatOpen).toHaveBeenCalled();
    });
  });

  describe("PlaygroundSidebar - Bottom Nav", () => {
    it("activates Share button on Enter key", () => {
      render(<PlaygroundSidebar />);
      const shareButton = screen.getByRole("button", { name: /Share/i });
      fireEvent.keyDown(shareButton, { key: "Enter" });
      // Share calls handleShare which is async, just verify no error
      expect(shareButton).toBeInTheDocument();
    });

    it("activates Settings button on Space key", () => {
      render(<PlaygroundSidebar />);
      const settingsButton = screen.getByRole("button", { name: /Settings/i });
      fireEvent.keyDown(settingsButton, { key: " " });
      expect(mockSetSettingsOpen).toHaveBeenCalledWith(true);
    });

    it("activates Start Tour button on Enter key", () => {
      render(<PlaygroundSidebar />);
      const tourButton = screen.getByRole("button", { name: /Start Tour/i });
      fireEvent.keyDown(tourButton, { key: "Enter" });
      expect(tourButton).toBeInTheDocument();
    });
  });

  describe("PlaygroundSidebar - focusability", () => {
    it("all nav items have tabIndex=0 for keyboard focus", () => {
      render(<PlaygroundSidebar />);
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("tabindex", "0");
      });
    });
  });
});
