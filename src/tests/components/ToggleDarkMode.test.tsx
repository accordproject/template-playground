import { render, screen, fireEvent } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import ToggleDarkMode from "../../components/ToggleDarkMode";
import useAppStore from "../../store/store";

vi.mock("../../store/store", () => ({ default: vi.fn() }));
vi.mock("react-dark-mode-toggle", () => ({
    default: (p: any) => <button data-testid="t" onClick={p.onChange} data-checked={p.checked} />
}));

describe("ToggleDarkMode", () => {
    const toggle = vi.fn();
    const setup = (bg = "#ffffff") => {
        vi.mocked(useAppStore).mockReturnValue({ backgroundColor: bg, toggleDarkMode: toggle } as any);
        return render(<ToggleDarkMode />);
    };

    beforeEach(() => {
        vi.clearAllMocks();

    });

    test("initializes correctly & updates on click", () => {
        const { unmount } = setup();
        expect(screen.getByTestId("t")).toHaveAttribute("data-checked", "false"); // Light mode default
        unmount();

        setup("#121212"); // Test dark mode init
        expect(screen.getByTestId("t")).toHaveAttribute("data-checked", "true");

        // Test click toggles theme
        fireEvent.click(screen.getByTestId("t"));
        expect(toggle).toHaveBeenCalledTimes(1);

    });
});
