import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "../../components/Navbar";

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
    render(<Navbar scrollToExplore={() => {}} />);
    const helpButton = screen.getByText("Help");
    fireEvent.click(helpButton);

    const aboutLink = screen.getByText(
      (content, element) =>
        element !== null &&
        element.tagName.toLowerCase() === "a" &&
        content.includes("About")
    );
    const communityLink = screen.getByText(
      (content, element) =>
        element !== null &&
        element.tagName.toLowerCase() === "a" &&
        content.includes("Community")
    );
    const issuesLink = screen.getByText(
      (content, element) =>
        element !== null &&
        element.tagName.toLowerCase() === "a" &&
        content.includes("Issues")
    );
    const documentationLink = screen.getByText(
      (content, element) =>
        element !== null &&
        element.tagName.toLowerCase() === "a" &&
        content.includes("Documentation")
    );

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
