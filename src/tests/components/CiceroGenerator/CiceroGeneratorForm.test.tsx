import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";
import CiceroGeneratorForm from "../../../components/CiceroGenerator/CiceroGeneratorForm";

// Mock the store
vi.mock("../../../store/store", () => ({
    default: () => ({
        backgroundColor: "#ffffff",
    }),
}));

describe("CiceroGeneratorForm", () => {
    const defaultProps = {
        documentText: "",
        templateName: "",
        namespace: "",
        isContract: false,
        isGenerating: false,
        hasOutput: false,
        onDocumentTextChange: vi.fn(),
        onTemplateNameChange: vi.fn(),
        onNamespaceChange: vi.fn(),
        onIsContractChange: vi.fn(),
        onGenerate: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the form with all input fields", () => {
        render(<CiceroGeneratorForm {...defaultProps} />);

        expect(screen.getByPlaceholderText(/Paste your legal\/contractual text here/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/e.g. lateDelivery/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/e.g. org.example.late/i)).toBeInTheDocument();
    });

    it("renders type toggle buttons", () => {
        render(<CiceroGeneratorForm {...defaultProps} />);

        expect(screen.getByRole("radio", { name: /Clause/i })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: /Contract/i })).toBeInTheDocument();
    });

    it("renders the generate button", () => {
        render(<CiceroGeneratorForm {...defaultProps} />);

        expect(screen.getByRole("button", { name: /Generate Cicero Template/i })).toBeInTheDocument();
    });

    it("disables generate button when no document text", () => {
        render(<CiceroGeneratorForm {...defaultProps} />);

        const button = screen.getByRole("button", { name: /Generate Cicero Template/i });
        expect(button).toBeDisabled();
    });

    it("enables generate button when document text is provided", () => {
        render(<CiceroGeneratorForm {...defaultProps} documentText="Some legal text" />);

        const button = screen.getByRole("button", { name: /Generate Cicero Template/i });
        expect(button).not.toBeDisabled();
    });

    it("shows loading state when generating", () => {
        render(<CiceroGeneratorForm {...defaultProps} documentText="Some text" isGenerating={true} />);

        expect(screen.getByRole("button", { name: /Generating Template/i })).toBeInTheDocument();
    });

    it("calls onDocumentTextChange when document text is entered", () => {
        const mockOnChange = vi.fn();
        render(<CiceroGeneratorForm {...defaultProps} onDocumentTextChange={mockOnChange} />);

        const textarea = screen.getByPlaceholderText(/Paste your legal\/contractual text here/i);
        fireEvent.change(textarea, { target: { value: "Test content" } });

        expect(mockOnChange).toHaveBeenCalled();
    });

    it("calls onGenerate when button is clicked", () => {
        const mockOnGenerate = vi.fn();
        render(
            <CiceroGeneratorForm 
                {...defaultProps} 
                documentText="Some text" 
                onGenerate={mockOnGenerate} 
            />
        );

        const button = screen.getByRole("button", { name: /Generate Cicero Template/i });
        fireEvent.click(button);

        expect(mockOnGenerate).toHaveBeenCalled();
    });

    it("calls onIsContractChange when type is toggled", () => {
        const mockOnChange = vi.fn();
        render(<CiceroGeneratorForm {...defaultProps} onIsContractChange={mockOnChange} />);

        const contractButton = screen.getByRole("radio", { name: /Contract/i });
        fireEvent.click(contractButton);

        expect(mockOnChange).toHaveBeenCalledWith(true);
    });
});
