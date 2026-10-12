import { render, screen } from "@testing-library/react"; 
import "@testing-library/jest-dom"; 
import { describe, expect, it, vi } from "vitest"; 
import Header from "../../../components/designV2/Header"; 
import { URLS } from "../../../components/designV2/constants"; 

describe("Design V2 Header", () => { 
  it("links the docs control to the template documentation", () => { 
    render(<Header view="welcome" onNavigate={vi.fn()} />); 

    const docsLink = screen.getByRole("link", { name: /docs/i }); 

    expect(docsLink).toHaveAttribute("href", URLS.templateDocs); 
    expect(docsLink).toHaveAttribute("target", "_blank"); 
    expect(docsLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});