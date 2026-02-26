import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import ShareModal from "../../components/ShareModal";

// Mock matchMedia for Ant Design Modal
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

const mockSetShareModalOpen = vi.fn();
const mockGenerateShareableLink = vi.fn(() => "https://example.com/share-link");

// Mock the store
vi.mock("../../store/store", () => ({
    default: () => ({
        isShareModalOpen: true,
        setShareModalOpen: mockSetShareModalOpen,
        generateShareableLink: mockGenerateShareableLink,
        backgroundColor: "#ffffff",
    }),
}));

// Mock the antd message
vi.mock('antd', async () => {
    const antd = await vi.importActual('antd');
    return {
        ...antd,
        message: {
            success: vi.fn(),
            error: vi.fn(),
        },
    };
});

describe("ShareModal", () => {
    beforeAll(() => {
        // Mock clipboard API
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockImplementation(() => Promise.resolve()),
            },
        });
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the modal with the correct link when open", async () => {
        render(<ShareModal />);

        expect(screen.getByText("Share Template")).toBeInTheDocument();

        // Modal opens and generates the link after a minor delay due to afterOpenChange
        // So we might need to wait for the value to be populated
        await waitFor(() => {
            expect(screen.getByDisplayValue("https://example.com/share-link")).toBeInTheDocument();
        });
    });

    it("copies link to clipboard and updates button state on copy", async () => {
        render(<ShareModal />);

        const copyButton = screen.getByRole("button", { name: /Copy/i });
        fireEvent.click(copyButton);

        expect(navigator.clipboard.writeText).toHaveBeenCalled();

        // Wait for button text to change to 'Copied!'
        await waitFor(() => {
            expect(screen.getByRole("button", { name: /Copied!/i })).toBeInTheDocument();
        });
    });

    it("calls setShareModalOpen(false) when closed", () => {
        render(<ShareModal />);

        // Ant Design modals typically have a close button (x icon) with aria-label="Close"
        const closeIcon = screen.getByRole("button", { name: "Close" });
        fireEvent.click(closeIcon);

        expect(mockSetShareModalOpen).toHaveBeenCalledWith(false);
    });
});
