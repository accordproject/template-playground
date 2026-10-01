import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi, beforeEach } from "vitest";
import Navbar from "../../components/Navbar";
import { MemoryRouter } from "react-router-dom";

// ---------------------------------------------------------------------------
// Mock antd Modal and message to avoid jsdom/nwsapi CSS selector failures
// caused by Ant Design's internal focus management calling querySelector()
// with Tailwind class name strings containing colons (invalid CSS selectors).
// ---------------------------------------------------------------------------
vi.mock("antd", async (importOriginal) => {
  const original = await importOriginal<typeof import("antd")>();
  return {
    ...original,
    Modal: {
      ...original.Modal,
      confirm: vi.fn(),
    },
    message: {
      info: vi.fn(),
      error: vi.fn(),
    },
  };
});

// ---------------------------------------------------------------------------
// Mock the Zustand store.
//
// Navbar uses: useStoreWithEqualityFn(useAppStore, selector, shallow)
// from "zustand/traditional".  That API calls store.getState() and
// store.subscribe() on the store object, so the mock must expose those.
// ---------------------------------------------------------------------------
const SAMPLES = [
  {
    NAME: "Hello World",
    TEMPLATE: "Hello {{name}}!",
    MODEL: "namespace test\nconcept TestConcept {}",
    DATA: { name: "World" },
    LOGIC: "",
  },
  {
    NAME: "Late Delivery",
    TEMPLATE: "Late delivery clause.",
    MODEL: "namespace test\nconcept TestConcept {}",
    DATA: {},
    LOGIC: "",
  },
];

const STORE_STATE = {
  samples: SAMPLES,
  loadSample: vi.fn().mockResolvedValue(undefined),
  sampleName: null as string | null,
  editorValue: "",
  editorModelCto: "",
  editorAgreementData: "{}",
  editorLogicTs: "",
  isLogicFeatureEnabled: false,
};

vi.mock("../../store/store", () => {
  // Build a minimal Zustand-compatible store stub that
  // useStoreWithEqualityFn can consume.
  const mockStore = Object.assign(
    (selector: (s: typeof STORE_STATE) => unknown) => selector(STORE_STATE),
    {
      getState: () => STORE_STATE,
      setState: vi.fn(),
      subscribe: () => () => undefined,
      destroy: vi.fn(),
    }
  );
  return { default: mockStore };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Configures window.innerWidth so useBreakpoint() computes a desktop-sized
 * screen (≥768 px) during the INITIAL render.  Must be called BEFORE render.
 *
 * Note: useBreakpoint in Navbar.tsx calls checkSize() immediately inside a
 * useState initializer, so innerWidth must be set before the component mounts.
 */
function setDesktopViewport() {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: 1024,
  });
}

const renderNavbar = () => {
  render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

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

  // -------------------------------------------------------------------------
  // Regression tests for issue #894:
  // Dropdown must close when a menu item inside it is clicked.
  // -------------------------------------------------------------------------

  describe("dropdown auto-close on item click (issue #894)", () => {
    beforeEach(() => {
      // Must be set BEFORE render so useBreakpoint picks up the viewport size.
      setDesktopViewport();
    });

    it("closes the Samples dropdown after a sample button item is clicked", async () => {
      renderNavbar();

      // Open the Samples dropdown — only visible at desktop widths (≥768px)
      const samplesButton = screen.getByRole("button", { name: /Samples/i });
      fireEvent.click(samplesButton);

      // Sample button items should now be visible inside the dropdown overlay
      const helloWorldItem = await screen.findByText("Hello World");
      expect(helloWorldItem).toBeInTheDocument();

      // Click the menu item — this must close the dropdown (fix for #894)
      await act(async () => {
        fireEvent.click(helloWorldItem);
      });

      // The dropdown overlay must no longer be visible
      await waitFor(() => {
        expect(screen.queryByText("Hello World")).not.toBeInTheDocument();
      });
    });

    it("closes the Help dropdown after clicking a menu item", async () => {
      renderNavbar();

      // Open the Help dropdown
      const helpButton = screen.getByRole("button", { name: /Help/i });
      fireEvent.click(helpButton);

      // "Community" appears only inside the Help dropdown overlay
      const communityText = await screen.findByText("Community");
      expect(communityText).toBeInTheDocument();

      // Click the Community item (external <a> link) — dropdown must close
      await act(async () => {
        fireEvent.click(communityText);
      });

      // The dropdown overlay must no longer be visible
      await waitFor(() => {
        expect(screen.queryByText("Community")).not.toBeInTheDocument();
      });
    });
  });
});
