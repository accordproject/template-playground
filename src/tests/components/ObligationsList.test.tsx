import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ObligationsList from "../../components/ObligationsList";

// Mock JSONEditor so we don't have to render Monaco in unit tests
vi.mock("../../editors/JSONEditor", () => ({
  default: ({ value }: { value: string }) => <div data-testid="json-editor">{value}</div>,
}));

// Mock useAppStore if we ever needed it, but ObligationsList doesn't use it directly

describe("ObligationsList", () => {
  it("renders empty state when eventsJson is empty string", () => {
    render(<ObligationsList eventsJson="" />);
    expect(screen.getByText("No events emitted")).toBeInTheDocument();
  });

  it("renders empty state when eventsJson is '[]'", () => {
    render(<ObligationsList eventsJson="[]" />);
    expect(screen.getByText("No events emitted")).toBeInTheDocument();
  });

  it("falls back to JSONEditor for malformed JSON", () => {
    render(<ObligationsList eventsJson="invalid json" />);
    expect(screen.getByTestId("json-editor")).toHaveTextContent("invalid json");
  });

  it("falls back to JSONEditor if parsed data is not an array", () => {
    render(<ObligationsList eventsJson='{"not": "an array"}' />);
    expect(screen.getByTestId("json-editor")).toHaveTextContent('{"not": "an array"}');
  });

  it("falls back to JSONEditor if array contains non-objects or items without $class", () => {
    render(<ObligationsList eventsJson='[{"missing": "class"}]' />);
    expect(screen.getByTestId("json-editor")).toHaveTextContent('[{"missing": "class"}]');
  });

  it("renders an obligation correctly", () => {
    const obligationJson = JSON.stringify([
      {
        $class: "org.accordproject.runtime@0.2.0.Obligation",
        $timestamp: "2026-07-30T12:00:00Z",
        deadline: "2026-08-30T12:00:00Z",
        promisor: "Alice",
        promisee: "Bob",
        amount: 100
      }
    ]);

    render(<ObligationsList eventsJson={obligationJson} />);

    // Should not show empty state or fallback
    expect(screen.queryByText("No events emitted")).not.toBeInTheDocument();
    expect(screen.queryByTestId("json-editor")).not.toBeInTheDocument();

    // Renders tags and badges
    expect(screen.getAllByText("Obligation").length).toBeGreaterThan(0); // Badge text and shortname
    expect(screen.getByText(/Deadline\s*:/i)).toBeInTheDocument();
    expect(screen.getByText("Promisor :")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Promisee :")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    
    // Custom fields
    expect(screen.getByText("Amount :")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("renders a generic event correctly", () => {
    const genericEventJson = JSON.stringify([
      {
        $class: "org.acme.counter@1.0.0.CounterUpdated",
        $timestamp: "2026-07-30T12:00:00Z",
        previousCount: 0,
        nextCount: 1
      }
    ]);

    render(<ObligationsList eventsJson={genericEventJson} />);

    // Renders tags and badges
    expect(screen.getByText("CounterUpdated")).toBeInTheDocument();
    
    // Should NOT have the Obligation badge
    expect(screen.queryByText("Obligation")).not.toBeInTheDocument();
    
    // Custom fields
    expect(screen.getByText("PreviousCount :")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("NextCount :")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("handles object-type custom fields gracefully", () => {
    const genericEventJson = JSON.stringify([
      {
        $class: "org.acme.counter@1.0.0.CustomEvent",
        nestedObject: { key: "value" }
      }
    ]);

    const { container } = render(<ObligationsList eventsJson={genericEventJson} />);
    expect(screen.getByText("NestedObject :")).toBeInTheDocument();
    const jsonBlock = container.querySelector(".obligation-json-block");
    expect(jsonBlock).not.toBeNull();
    expect(jsonBlock?.textContent).toContain('"key": "value"');
  });
});
