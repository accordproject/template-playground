/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import LearnContent from "../../components/Content";
import useAppStore from "../../store/store";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../utils/fetchContent", () => ({
  default: vi.fn().mockResolvedValue("# Module 1 Content\n\nSample tutorial text"),
}));

describe("LearnContent - Open in Playground Integration", () => {
  const loadSampleMock = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    useAppStore.setState({
      loadSample: loadSampleMock,
    });
  });

  it("renders the module content and shows Open in Playground buttons when mapped to a sample", async () => {
    render(
      <MemoryRouter>
        <LearnContent file="module1.md" />
      </MemoryRouter>
    );

    // Wait for content loading to finish
    expect(await screen.findByText("Module 1 Content")).toBeInTheDocument();

    // Verify Open in Playground buttons are rendered (top header button and bottom callout card button)
    const openButtons = screen.getAllByRole("button", { name: /Open in Playground/i });
    expect(openButtons.length).toBeGreaterThanOrEqual(1);

    // Verify the bottom callout card message exists
    expect(screen.getByText(/Ready to experiment with this template\?/i)).toBeInTheDocument();
  });

  it("loads the mapped sample and navigates to the Playground with query params when clicked", async () => {
    render(
      <MemoryRouter>
        <LearnContent file="module1.md" />
      </MemoryRouter>
    );

    expect(await screen.findByText("Module 1 Content")).toBeInTheDocument();

    const openButtons = screen.getAllByRole("button", { name: /Open in Playground/i });
    fireEvent.click(openButtons[0]);

    await waitFor(() => {
      expect(loadSampleMock).toHaveBeenCalledWith("Hello World");
      expect(mockNavigate).toHaveBeenCalledWith("/?sample=Hello%20World");
    });
  });

  it("navigates to '/' when Exit learning is clicked", async () => {
    render(
      <MemoryRouter>
        <LearnContent file="module1.md" />
      </MemoryRouter>
    );

    expect(await screen.findByText("Module 1 Content")).toBeInTheDocument();

    const exitButton = screen.getByRole("button", { name: /Exit learning/i });
    fireEvent.click(exitButton);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
