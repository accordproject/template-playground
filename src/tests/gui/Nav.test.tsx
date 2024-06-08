import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import Navbar from "../../Navbar";

const renderNavbar = (scrollToExplore: () => void) => {
  return render(<Navbar scrollToExplore={scrollToExplore} />);
};

describe("Navbar Component", () => {
  it("renders the logo", () => {
    renderNavbar(() => {});
    const logo = screen.getByAltText("Template Playground");
    expect(logo).toBeInTheDocument();
  });

  it("renders the Explore link and responds to click events", () => {
    let isCalled = false;
    const mockScrollToExplore = () => {
      isCalled = true;
    };
    renderNavbar(mockScrollToExplore);
    const exploreLink = screen.getByText("Explore");
    expect(exploreLink).toBeInTheDocument();
    fireEvent.click(exploreLink);
    expect(isCalled).toBe(true);
  });

  it("renders the Help dropdown with correct links", () => {
    renderNavbar(() => {});
    const helpButton = screen.getByText("Help");
    fireEvent.mouseEnter(helpButton);

    const aboutLink = screen.getByText("About");
    const communityLink = screen.getByText("Community");
    const issuesLink = screen.getByText("Issues");
    const documentationLink = screen.getByText("Documentation");

    expect(aboutLink).toBeInTheDocument();
    expect(communityLink).toBeInTheDocument();
    expect(issuesLink).toBeInTheDocument();
    expect(documentationLink).toBeInTheDocument();
  });

  it("renders the Github link", () => {
    renderNavbar(() => {});
    const githubLink = screen.getByText("Github");
    expect(githubLink).toBeInTheDocument();
    expect(githubLink.closest("a")).toHaveAttribute(
      "href",
      "https://github.com/accordproject/template-playground"
    );
  });
});
