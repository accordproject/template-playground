import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { message } from "antd";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LearnContent from "../../components/Content";
import fetchContent from "../../utils/fetchContent";

vi.mock("../../utils/fetchContent", () => ({ default: vi.fn() }));

vi.mock("../../constants/learningSteps/steps", () => ({
  steps: [{ link: "/learn/lesson" }],
}));

describe("LearnContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchContent).mockResolvedValue("```ts\nconst answer = 42;\n```");
  });

  const renderContent = () =>
    render(
      <MemoryRouter>
        <LearnContent file="lesson.md" />
      </MemoryRouter>,
    );

  it("only reports success after the clipboard write succeeds", async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    writeText.mockResolvedValue(undefined);
    const success = vi.fn();
    message.success = success;

    renderContent();
    await screen.findByRole("button", { name: "Copy code" });
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));

    await waitFor(() => expect(success.mock.calls).toContainEqual(["Copied to clipboard!"]));
    expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument();
  });

  it("reports an error and does not show copied state when the clipboard write fails", async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    writeText.mockRejectedValue(new Error("permission denied"));
    const success = vi.fn();
    const error = vi.fn();
    message.success = success;
    message.error = error;

    renderContent();
    await screen.findByRole("button", { name: "Copy code" });
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));

    await waitFor(() => expect(error.mock.calls).toContainEqual(["Failed to copy to clipboard"]));
    expect(success.mock.calls).toHaveLength(0);
  });

});
