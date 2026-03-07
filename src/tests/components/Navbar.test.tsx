import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Navbar from "../../components/Navbar";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect, afterEach } from "vitest";
import { mockChangeLanguage } from "../../utils/testing/i18nMock";

vi.mock("react-i18next", async () => {
  const { reactI18nextMock } = await import("../../utils/testing/i18nMock");
  return {
    useTranslation: () => ({
      t: (key: string) => {
        const map: Record<string, string> = {
          "navbar.templatePlayground": "Template Playground",
          "navbar.github": "GitHub",
          "navbar.help": "Help",
          "navbar.learn": "Learn Now",
          "navbar.discord": "Discord",
          "navbar.about": "About",
          "navbar.community": "Community",
          "navbar.issues": "Issues",
          "navbar.documentation": "Documentation",
          "navbar.info": "Info",
          "navbar.language": "Language",
        };
        return map[key] || key;
      },
      i18n: reactI18nextMock.useTranslation().i18n,
    }),
  };
});

const renderNavbar = () => {
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
};

afterEach(() => {
  mockChangeLanguage.mockClear();
  localStorage.clear();
});

describe("Navbar", () => {
  it("renders logo and title on small screens", () => {
    renderNavbar();

    const logoImage = screen.getByRole("img", { name: /Template Playground/i });
    expect(logoImage).toBeInTheDocument();

    const title = screen.getByText(/Template Playground/i);
    expect(title).toBeInTheDocument();
  });

  it("renders GitHub link on all screens", () => {
    renderNavbar();

    const githubLink = screen.getByRole("link", { name: /GitHub/i });
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
});

describe("Language Switching", () => {
  it("selecting a language calls i18n.changeLanguage with the correct code", () => {
    renderNavbar();

    // Click the language switcher button to open the dropdown
    const langButton = screen.getByText("English", { exact: false }).closest("button");
    expect(langButton).toBeInTheDocument();
    fireEvent.click(langButton!);

    // Click the "Français" option in the dropdown
    const frenchOption = screen.getByText("Français");
    fireEvent.click(frenchOption);

    // Assert changeLanguage was called with 'fr'
    expect(mockChangeLanguage).toHaveBeenCalledWith("fr");
  });

  it("persisted language from localStorage is reflected in the UI on render", () => {
    // Pre-set localStorage to simulate a previously saved language
    localStorage.setItem("i18nextLng", "es");

    renderNavbar();

    // The displayed language label should reflect Spanish
    const spanishLabel = screen.getByText("Español", { exact: false });
    expect(spanishLabel).toBeInTheDocument();
  });
});
