import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "../../components/Navbar";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

const renderNavbar = () => {
  return render(
    <MemoryRouter>
      <Navbar />
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

  it("removes the resize listener on unmount", () => {
    const removeEventListener = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderNavbar();

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );

    removeEventListener.mockRestore();
  });
});
