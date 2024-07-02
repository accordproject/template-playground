import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "../../components/Navbar";

describe("Navbar", () => {
  it("renders logo and title on small screens", () => {
    render(<Navbar scrollToExplore={() => {}} />);

    const logoImage = screen.getByRole("img", { name: /Template Playground/i });
    expect(logoImage).toBeInTheDocument();

    const title = screen.getByText(/Template Playground/i);
    expect(title).toBeInTheDocument();
  });

  it("renders Github link on all screens", () => {
    render(<Navbar scrollToExplore={() => {}} />);

    const githubLink = screen.getByRole("link", { name: /Github/i });
    expect(githubLink).toBeInTheDocument();
  });

  it("shows hover effect on menu items", () => {
    render(<Navbar scrollToExplore={() => {}} />);

    const homeMenuItem = screen
      .getByText(/Template Playground/i)
      .closest("div");

    expect(homeMenuItem).not.toHaveStyle({
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    });
  });
});
