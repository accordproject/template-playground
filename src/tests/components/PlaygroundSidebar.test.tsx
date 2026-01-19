import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PlaygroundSidebar from "../../components/PlaygroundSidebar";
import { vi } from "vitest";

// Mock the store
vi.mock("../../store/store", () => ({
    default: () => ({
        isEditorsVisible: true,
        isPreviewVisible: true,
        isProblemPanelVisible: false,
        isAIChatOpen: false,
        setEditorsVisible: vi.fn(),
        setPreviewVisible: vi.fn(),
        setProblemPanelVisible: vi.fn(),
        setAIChatOpen: vi.fn(),
        generateShareableLink: vi.fn(() => "https://example.com"),
        exportTemplate: vi.fn(),
        importTemplate: vi.fn(),
    }),
}));

// Mock the Tour
vi.mock("../../components/Tour", () => ({
    default: { start: vi.fn() },
}));

// Mock FullScreenModal
vi.mock("../../components/FullScreenModal", () => ({
    default: () => <div data-testid="fullscreen-modal">FullScreen</div>,
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

        expect(screen.getByRole("button", { name: /Export/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Import/i })).toBeInTheDocument();
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
});
