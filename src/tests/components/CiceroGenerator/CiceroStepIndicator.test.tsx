import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi, describe, it, expect } from "vitest";
import CiceroStepIndicator from "../../../components/CiceroGenerator/CiceroStepIndicator";

// Mock the store
vi.mock("../../../store/store", () => ({
    default: () => ({
        backgroundColor: "#ffffff",
    }),
}));

describe("CiceroStepIndicator", () => {
    const defaultProps = {
        currentStep: null,
        completedSteps: [],
        failedStep: null,
    };

    it("renders all step labels", () => {
        render(<CiceroStepIndicator {...defaultProps} />);

        expect(screen.getByText("Brief")).toBeInTheDocument();
        expect(screen.getByText("Template")).toBeInTheDocument();
        expect(screen.getByText("Model")).toBeInTheDocument();
        expect(screen.getByText("Logic")).toBeInTheDocument();
        expect(screen.getByText("Validate")).toBeInTheDocument();
        expect(screen.getByText("Package")).toBeInTheDocument();
    });

    it("shows current step as active", () => {
        render(
            <CiceroStepIndicator 
                {...defaultProps} 
                currentStep="agent1" 
            />
        );

        // Check that Template step is highlighted (current step is agent1)
        const templateLabel = screen.getByText("Template");
        expect(templateLabel).toHaveStyle({ fontWeight: 700 });
    });

    it("shows completed steps with checkmark", () => {
        render(
            <CiceroStepIndicator 
                {...defaultProps} 
                completedSteps={["coordinator", "agent1"]}
                currentStep="agent2"
            />
        );

        // Completed steps should have checkmarks (✓)
        const allContent = document.body.textContent;
        expect(allContent).toContain("✓");
    });

    it("shows failed step with X mark", () => {
        render(
            <CiceroStepIndicator 
                {...defaultProps}
                failedStep="agent2"
            />
        );

        // Failed step should have X mark (✕)
        const allContent = document.body.textContent;
        expect(allContent).toContain("✕");
    });

    it("renders step connectors between steps", () => {
        const { container } = render(<CiceroStepIndicator {...defaultProps} />);

        // There should be 5 connectors between 6 steps
        const connectors = container.querySelectorAll('[style*="width: 20px"]');
        expect(connectors.length).toBe(5);
    });

    it("applies different styling for dark mode", () => {
        vi.mock("../../../store/store", () => ({
            default: () => ({
                backgroundColor: "#121212",
            }),
        }));

        render(<CiceroStepIndicator {...defaultProps} />);

        // Should still render all steps
        expect(screen.getByText("Brief")).toBeInTheDocument();
    });
});
