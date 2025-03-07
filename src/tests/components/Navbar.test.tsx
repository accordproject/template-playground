import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "@components/Navbar";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

vi.mock("@components/ToggleDarkMode", () => ({
  default: () => <div data-testid="toggle-dark-mode">Dark Mode Toggle</div>,
}));

const renderNavbar = () => {
  render(
    <MemoryRouter>
      <Navbar scrollToFooter={() => {}} />
    </MemoryRouter>
  );
};

describe("Navbar", () => {
  it("renders logo and title on small screens", () => {
    renderNavbar();

    const logoImage = screen.getByRole("img", { name: /Template Playground/i });
    expect(logoImage).toBeInTheDocument();

    const title = screen.getByText(/Template Playground/i);
    expect(title).toBeInTheDocument();
  });

  it("renders Github link on all screens", () => {
    renderNavbar();

    const githubLink = screen.getByRole("link", { name: /Github/i });
    expect(githubLink).toBeInTheDocument();
  });

  it("shows hover effect on menu items", () => {
    renderNavbar();

    const homeMenuItem = screen
      .getByText(/Template Playground/i)
      .closest("div");

    expect(homeMenuItem).not.toHaveStyle({
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    });
  });

  it("renders Dark Mode Toggle button", () => {
    renderNavbar();
    const toggleDarkMode = screen.getByTestId("toggle-dark-mode");
    expect(toggleDarkMode).toBeInTheDocument();
  });
});
