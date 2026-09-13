import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AIChatPanel } from "../../components/AIChatPanel";
import useAppStore from "../../store/store";

// Mock scrollIntoView for Monaco / DOM elements in jsdom
Element.prototype.scrollIntoView = vi.fn();

describe("AIChatPanel", () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useAppStore.getState();
    store.setAIConfig(null);
    store.setChatState({
      messages: [],
      isLoading: false,
      error: null,
    });
    store.setSettingsOpen(false);
  });

  it("renders warning banner when AI settings are not configured", () => {
    render(<AIChatPanel />);

    expect(screen.getByText("AI Provider Not Configured")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Please configure an AI provider and API key in Settings to start using the assistant/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Configure Settings/i })
    ).toBeInTheDocument();
  });

  it("opens settings modal when clicking Configure Settings button on warning banner", () => {
    render(<AIChatPanel />);

    const configureBtn = screen.getByRole("button", { name: /Configure Settings/i });
    fireEvent.click(configureBtn);

    expect(useAppStore.getState().isSettingsOpen).toBe(true);
  });

  it("submits prompt and adds user message and error message when AI config is missing", async () => {
    render(<AIChatPanel />);

    const textarea = screen.getByPlaceholderText("Type your message...");
    fireEvent.change(textarea, { target: { value: "Hello AI" } });

    const sendBtn = screen.getByRole("button", { name: "Send" });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      const messages = useAppStore.getState().chatState.messages;
      expect(messages.length).toBeGreaterThanOrEqual(2);
      expect(messages[0].content).toBe("Hello AI");
      expect(messages[1].content).toContain("Please configure AI settings");
    });
  });
});
