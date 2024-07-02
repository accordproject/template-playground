import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import Footer from "../../components/Footer";

vi.mock("../../public/logo.png", () => ({
  default: "logo.png",
}));

vi.mock("../constants/content/footer.json", () => ({
  sections: [
    {
      title: "ABOUT",
      links: [
        { title: "About the AP", href: "https://accordproject.org/about/" },
        {
          title: "FAQ",
          href: "https://accordproject.org/frequently-asked-questions/",
        },
        {
          title: "White Paper",
          href: "https://accordproject.org/whitepaper-2024/",
        },
      ],
    },
    {
      title: "COMMUNITY",
      links: [
        { title: "Contribute", href: "https://accordproject.org/contribute/" },
        {
          title: "Tech WG",
          href: "https://accordproject.org/working-groups/technology/",
        },
        {
          title: "Join Discord",
          href: "https://discord.com/invite/Zm99SKhhtA",
          external: true,
        },
      ],
    },
    {
      title: "PROJECTS",
      links: [
        {
          title: "Concerto",
          href: "https://accordproject.org/projects/concerto/",
        },
        {
          title: "VS Code Extension",
          href: "https://marketplace.visualstudio.com/items?itemName=accordproject.cicero-vscode-extension",
        },
        {
          title: "Markdown Transform",
          href: "https://github.com/accordproject/markdown-transform",
        },
      ],
    },
    {
      title: "RESOURCES",
      links: [
        {
          title: "Template Library",
          href: "https://templates.accordproject.org/",
        },
        {
          title: "Model Repository",
          href: "https://models.accordproject.org/",
        },
        { title: "Videos", href: "https://vimeo.com/accordproject" },
        {
          title: "GitHub",
          href: "https://github.com/accordproject",
        },
        { title: "Documentation", href: "https://docs.accordproject.org/" },
      ],
    },
  ],
}));

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
});

describe("Footer", () => {
  it("matches the snapshot", () => {
    const { asFragment } = render(<Footer />);
    expect(asFragment()).toMatchSnapshot();
  });
});
