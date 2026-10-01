import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useAppStore from "../../store/store";
import { validateBeforeRebuild } from "../../utils/validators";
import { rebuildInSandbox } from "../../store/rebuildSandbox";
import { transform } from "@accordproject/markdown-transform";
import { decompress } from "../../utils/compression/compression";

vi.mock("../../utils/validators", () => ({ validateBeforeRebuild: vi.fn() }));
vi.mock("../../store/rebuildSandbox", () => ({ rebuildInSandbox: vi.fn() }));
vi.mock("@accordproject/markdown-transform", () => ({ transform: vi.fn() }));
vi.mock("../../utils/compression/compression", () => ({
  compress: vi.fn(),
  decompress: vi.fn(),
}));

describe("agreement preview after a failed rebuild", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    useAppStore.setState({
      templateMarkdown: "Template",
      modelCto: "namespace example@1.0.0",
      data: "{}",
      agreementHtml: "",
      error: undefined,
      isProblemPanelVisible: false,
    });
    vi.mocked(validateBeforeRebuild).mockResolvedValue(undefined);
    vi.mocked(rebuildInSandbox).mockResolvedValue({});
    vi.mocked(transform).mockResolvedValue("<p>Valid agreement</p>");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(["rebuild", "setTemplateMarkdown", "setModelCto", "setData"] as const)(
    "%s clears stale output on failure and restores output on recovery",
    async (action) => {
      const render = async () => {
        const state = useAppStore.getState();
        const pending = action === "rebuild"
          ? state.rebuild()
          : state[action](action === "setData" ? "{}" : "Edited source");
        await vi.advanceTimersByTimeAsync(500);
        await pending;
      };

      await render();
      expect(useAppStore.getState().agreementHtml).toBe("<p>Valid agreement</p>");

      // A share-link error is unrelated to rendering the current valid agreement.
      vi.mocked(decompress).mockImplementation(() => {
        throw new Error("Invalid share link data");
      });
      await useAppStore.getState().loadFromLink("invalid-link");
      expect(useAppStore.getState().error).toContain("Invalid share link data");
      expect(useAppStore.getState().agreementHtml).toBe("<p>Valid agreement</p>");
      useAppStore.setState({ error: undefined, isProblemPanelVisible: false });

      vi.mocked(rebuildInSandbox).mockRejectedValueOnce(new Error("Current render failed"));
      await render();
      expect(useAppStore.getState()).toMatchObject({
        agreementHtml: "",
        error: "Error: Current render failed",
        isProblemPanelVisible: true,
      });

      vi.mocked(transform).mockResolvedValueOnce("<p>Recovered agreement</p>");
      await render();
      expect(useAppStore.getState()).toMatchObject({
        agreementHtml: "<p>Recovered agreement</p>",
        error: undefined,
      });
    },
  );
});
