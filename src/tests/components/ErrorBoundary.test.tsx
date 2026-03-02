import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let consoleErrorSpy: any;
  const originalEnv = import.meta.env.DEV;

  beforeEach(() => {
    // Suppress console.error for cleaner test output
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    // Restore original env
    import.meta.env.DEV = originalEnv;
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
    Object.defineProperty(window, "location", {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByRole("button", { name: /Reload Page/i });
    expect(reloadButton).toBeInTheDocument();

    reloadButton.click();
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("should display error details in development mode", () => {
    import.meta.env.DEV = true;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorDetails = screen.getByText("Error details");
    expect(errorDetails).toBeInTheDocument();

    const errorMessage = screen.getByText(/Error: Test error/);
    expect(errorMessage).toBeInTheDocument();
  });

  it("should not display error details in production mode", () => {
    import.meta.env.DEV = false;

    render(
      <ErrorBoundary>
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
    // Set dark mode
    useAppStore.setState({ backgroundColor: '#1e1e1e', textColor: '#ffffff' });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const container = screen.getByText("Something went wrong").parentElement;
    expect(container).toHaveStyle({ backgroundColor: '#1e1e1e' });
  });

  it("should display component stack in development mode", () => {
    import.meta.env.DEV = true;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const errorDetails = screen.getByText("Error details");
    expect(errorDetails).toBeInTheDocument();

    // Component stack should be present in the pre element
    const preElement = screen.getByText(/Error: Test error/).closest('pre');
    expect(preElement?.textContent).toContain('Component Stack:');
  });
});
