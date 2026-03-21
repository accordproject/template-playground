import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import ProblemPanel from "../../components/ProblemPanel";
import useAppStore from "../../store/store";
import * as editorNavigation from "../../utils/editorNavigation";

// Mock the navigateToLine function
vi.mock("../../utils/editorNavigation", async () => {
  const actual = await vi.importActual<typeof editorNavigation>("../../utils/editorNavigation");
  return {
    ...actual,
    navigateToLine: vi.fn(),
  };
});

describe("ProblemPanel", () => {
  beforeEach(() => {
    // Clear store state and reset mocks
    useAppStore.setState({ error: undefined, backgroundColor: '#ffffff', textColor: '#000000' });
    vi.clearAllMocks();
  });

  it("should render empty state when there are no problems", () => {
    render(<ProblemPanel />);
    
    expect(screen.getByText("No problems detected")).toBeInTheDocument();
    expect(screen.getByText("✨")).toBeInTheDocument();
  });

  it("should render problems when error exists", () => {
    useAppStore.setState({ 
      error: "Error: Test error\nLine 10",
      backgroundColor: '#ffffff',
      textColor: '#000000'
    });

    render(<ProblemPanel />);
    
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
    expect(screen.queryByText("No problems detected")).not.toBeInTheDocument();
  });

  it("should call navigateToLine when clicking a clickable problem", () => {
    useAppStore.setState({ 
      error: "Error: Test error\nLine 10",
      backgroundColor: '#ffffff',
      textColor: '#000000'
    });

    render(<ProblemPanel />);
    
    const problemItem = screen.getByText(/Test error/i).closest('[role="button"]');
    expect(problemItem).toBeInTheDocument();
    
    fireEvent.click(problemItem!);
    
    expect(editorNavigation.navigateToLine).toHaveBeenCalledWith(
      expect.any(String),
      10,
      undefined
    );
  });

  it("should not call navigateToLine for problems without line numbers", () => {
    useAppStore.setState({ 
      error: "Error: Test error without line",
      backgroundColor: '#ffffff',
      textColor: '#000000'
    });

    render(<ProblemPanel />);
    
    const problemItem = screen.getByText(/Test error without line/i).closest('[role="button"]');
    expect(problemItem).toBeNull(); // Should not be clickable
    
    expect(editorNavigation.navigateToLine).not.toHaveBeenCalled();
  });

  it("should not call navigateToLine for problems with invalid line numbers (line 0 or negative)", () => {
    useAppStore.setState({ 
      error: "Error: Test error\nLine 0",
      backgroundColor: '#ffffff',
      textColor: '#000000'
    });

    render(<ProblemPanel />);
    
    const problemItem = screen.getByText(/Test error/i).closest('[role="button"]');
    expect(problemItem).toBeNull(); // Should not be clickable (line 0 is invalid)
    
    expect(editorNavigation.navigateToLine).not.toHaveBeenCalled();
  });

  it("should trigger navigation on Enter key press", () => {
    useAppStore.setState({ 
      error: "Error: Test error\nLine 15",
      backgroundColor: '#ffffff',
      textColor: '#000000'
    });

    render(<ProblemPanel />);
    
    const problemItem = screen.getByText(/Test error/i).closest('[role="button"]') as HTMLElement;
    expect(problemItem).toBeInTheDocument();
    
    fireEvent.keyDown(problemItem, { key: 'Enter' });
    
    expect(editorNavigation.navigateToLine).toHaveBeenCalledWith(
      expect.any(String),
      15,
      undefined
    );
  });

  it("should trigger navigation on Space key press", () => {
    useAppStore.setState({ 
      error: "Error: Test error\nLine 20",
      backgroundColor: '#ffffff',
      textColor: '#000000'
    });

    render(<ProblemPanel />);
    
    const problemItem = screen.getByText(/Test error/i).closest('[role="button"]') as HTMLElement;
    expect(problemItem).toBeInTheDocument();
    
    fireEvent.keyDown(problemItem, { key: ' ' });
    
    expect(editorNavigation.navigateToLine).toHaveBeenCalledWith(
      expect.any(String),
      20,
      undefined
    );
  });

  it("should display correct source labels (Concerto, TemplateMark, JSON)", () => {
    useAppStore.setState({ 
      error: "c: Model error\nLine 5",
      backgroundColor: '#ffffff',
      textColor: '#000000'
    });

    render(<ProblemPanel />);
    
    expect(screen.getByText("Concerto Model")).toBeInTheDocument();
  });

  it("should render clickable problems with correct role and tabIndex", () => {
    useAppStore.setState({ 
      error: "Error: Test error\nLine 10",
      backgroundColor: '#ffffff',
      textColor: '#000000'
    });

    render(<ProblemPanel />);
    
    const problemItem = screen.getByRole("button");
    expect(problemItem).toHaveAttribute("tabIndex", "0");
    expect(problemItem).toHaveAttribute("title", "Click to go to error location");
  });

  it("should not render role or tabIndex for non-clickable problems", () => {
    useAppStore.setState({ 
      error: "Error: Test error without line",
      backgroundColor: '#ffffff',
      textColor: '#000000'
    });

    render(<ProblemPanel />);
    
    const problemItems = screen.queryAllByRole("button");
    expect(problemItems).toHaveLength(0); // No clickable items
  });

  it("should handle multiple problems correctly", () => {
    useAppStore.setState({ 
      error: "Error: First error\nLine 10\nError: Second error\nLine 20",
      backgroundColor: '#ffffff',
      textColor: '#000000'
    });

    render(<ProblemPanel />);
    
    expect(screen.getByText(/First error/i)).toBeInTheDocument();
    expect(screen.getByText(/Second error/i)).toBeInTheDocument();
    
    const clickableProblems = screen.getAllByRole("button");
    expect(clickableProblems).toHaveLength(2);
  });
});
