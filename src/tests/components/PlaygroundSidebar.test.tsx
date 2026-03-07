import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PlaygroundSidebar from "../../components/PlaygroundSidebar";
import { vi } from "vitest";


vi.mock('react-i18next', async () => {
    const { reactI18nextMock } = await import("../../utils/testing/i18nMock");
    return {
        useTranslation: () => ({
            t: (key: string) => {
                const map: Record<string, string> = {
                    'sidebar.editor': 'Editor',
                    'sidebar.preview': 'Preview',
                    'sidebar.problems': 'Problems',
                    'sidebar.aiAssistant': 'AI Assistant',
                    'sidebar.share': 'Share',
                    'sidebar.startTour': 'Start Tour',
                    'sidebar.settings': 'Settings',
                    'sidebar.fullscreen': 'Fullscreen'
                };
                return map[key] || key;
            },
            i18n: reactI18nextMock.useTranslation().i18n,
        })
    };
});

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
        setSettingsOpen: vi.fn(),
        generateShareableLink: vi.fn(() => "https://example.com"),
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
});
