import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import PlaygroundSidebar from "../../components/PlaygroundSidebar";
import { vi } from "vitest";

const mockStore = {
    isEditorsVisible: true,
    isPreviewVisible: true,
    isProblemPanelVisible: false,
    isAIChatOpen: false,
    setEditorsVisible: vi.fn(),
    setPreviewVisible: vi.fn(),
    setProblemPanelVisible: vi.fn(),
    setAIChatOpen: vi.fn(),
    setSettingsOpen: vi.fn(),
    generateShareableLink: vi.fn(() => "https://example.com"),
};

// Mock the store
vi.mock("../../store/store", () => ({
    default: () => mockStore,
}));

// Mock the Tour
vi.mock("../../components/Tour", () => ({
    default: { start: vi.fn() },
}));

// Mock FullScreenModal
vi.mock("../../components/FullScreenModal", () => ({
    default: () => <div data-testid="fullscreen-modal">FullScreen</div>,
}));

// Mock SettingsModal
vi.mock("../../components/SettingsModal", () => ({
    default: () => <div data-testid="settings-modal">Settings</div>,
}));

const renderSidebar = () => {
    render(<PlaygroundSidebar />);
};

describe("PlaygroundSidebar", () => {
    it("renders all top navigation items", () => {
        renderSidebar();

        expect(screen.getByRole("button", { name: /Editor/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Preview/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Problems/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /AI Assistant/i })).toBeInTheDocument();
    });

    it("renders all bottom navigation items", () => {
        renderSidebar();

        expect(screen.getByRole("button", { name: /Share/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Start Tour/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Settings/i })).toBeInTheDocument();
    });

    it("wraps navigation items with Tooltip component", () => {
        renderSidebar();
        const editorButton = screen.getByRole("button", { name: /Editor/i });
        expect(editorButton).toBeInTheDocument();
    });

    it("renders FullScreen modal component", () => {
        renderSidebar();
        expect(screen.getByTestId("fullscreen-modal")).toBeInTheDocument();
    });

    it("activates navigation items on Enter and Space keydown", () => {
        renderSidebar();

        const problemsButton = screen.getByRole("button", { name: /Problems/i });
        fireEvent.keyDown(problemsButton, { key: "Enter" });
        expect(mockStore.setProblemPanelVisible).toHaveBeenCalled();

        const aiButton = screen.getByRole("button", { name: /AI Assistant/i });
        fireEvent.keyDown(aiButton, { key: " " });
        expect(mockStore.setAIChatOpen).toHaveBeenCalled();

        const settingsButton = screen.getByRole("button", { name: /Settings/i });
        fireEvent.keyDown(settingsButton, { key: "Enter" });
        expect(mockStore.setSettingsOpen).toHaveBeenCalledWith(true);
    });
});
