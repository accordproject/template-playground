import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from "vitest";
import "@testing-library/jest-dom";
import ErrorBoundary from "../../components/ErrorBoundary";
import useAppStore from "../../store/store";

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Child component</div>;
};

describe("ErrorBoundary", () => {
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    // Suppress console.error for cleaner test output
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should render children when there is no error", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Child component")).toBeInTheDocument();
  });

  it("should catch error and render fallback UI", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(/We apologize for the inconvenience/)
    ).toBeInTheDocument();
    expect(screen.queryByText("Child component")).not.toBeInTheDocument();
  });

  it("should render reload button that calls window.location.reload", () => {
    const reloadMock = vi.fn();
    // Mock the entire location object
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { ...originalLocation, reload: reloadMock } as any;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByRole("button", { name: /Reload Page/i });
    expect(reloadButton).toBeInTheDocument();

    reloadButton.click();
    expect(reloadMock).toHaveBeenCalledTimes(1);

    // Restore original location
    delete (window as any).location;
    window.location = originalLocation as any;
  });

  it("should display error details in development mode", () => {
    render(
      <ErrorBoundary showDevDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorDetails = screen.getByText("Error details");
    expect(errorDetails).toBeInTheDocument();

    const errorMessage = screen.getByText(/Error: Test error/);
    expect(errorMessage).toBeInTheDocument();
  });

  it("should not display error details in production mode", () => {
    render(
      <ErrorBoundary showDevDetails={false}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText("Error details")).not.toBeInTheDocument();
  });

  it("should call componentDidCatch and log error", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "ErrorBoundary caught an error:",
      expect.any(Error),
      expect.any(Object)
    );
  });

  it("should use theme colors from store", () => {
    // Capture previous state and set dark mode
    const previousBackgroundColor = useAppStore.getState().backgroundColor;
    const previousTextColor = useAppStore.getState().textColor;
    useAppStore.setState({ backgroundColor: '#121212', textColor: '#ffffff' });

    try {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const container = screen.getByText("Something went wrong").parentElement;
      expect(container).toHaveStyle({ backgroundColor: '#121212' });
    } finally {
      // Restore previous state to avoid test order-dependency
      useAppStore.setState({ 
        backgroundColor: previousBackgroundColor, 
        textColor: previousTextColor 
      });
    }
  });

  it("should display component stack in development mode", async () => {
    render(
      <ErrorBoundary showDevDetails={true}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorDetails = screen.getByText("Error details");
    expect(errorDetails).toBeInTheDocument();

    // Component stack should be present in the pre element
    // Use waitFor since errorInfo is set via setState in componentDidCatch
    await waitFor(() => {
      const preElement = screen.getByText(/Error: Test error/).closest('pre');
      expect(preElement?.textContent).toContain('Component Stack:');
    });
  });
});
