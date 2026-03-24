import useAppStore, { DecompressedData } from "../../store/store";
import { decompress } from "../../utils/compression/compression";
import { vi } from "vitest";

vi.mock("../../utils/compression/compression");

describe("loadFromLink", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should set state correctly when agreementHtml is present", async () => {
        const payload: DecompressedData = {
            templateMarkdown: "# Template",
            modelCto: "namespace org",
            data: '{"key": "value"}',
            agreementHtml: "<p>Agreement</p>",
        };

        vi.mocked(decompress).mockReturnValue(payload);

        await useAppStore.getState().loadFromLink("compressed-data");

        const state = useAppStore.getState();
        expect(state.templateMarkdown).toBe(payload.templateMarkdown);
        expect(state.modelCto).toBe(payload.modelCto);
        expect(state.data).toBe(payload.data);
        expect(state.agreementHtml).toBe(payload.agreementHtml);
        expect(state.error).toBeUndefined();
    });

    it("should default agreementHtml to empty string when missing", async () => {
        const payload = {
            templateMarkdown: "# Template",
            modelCto: "namespace org",
            data: '{"key": "value"}',
        } as DecompressedData;

        vi.mocked(decompress).mockReturnValue(payload);

        // Mock rebuild to avoid running the real template engine
        const rebuildSpy = vi.fn().mockResolvedValue(undefined);
        useAppStore.setState({ rebuild: rebuildSpy } as never);

        await useAppStore.getState().loadFromLink("compressed-data");

        const state = useAppStore.getState();
        expect(state.agreementHtml).toBe("");
    });

    it("should set error state for invalid compressed data", async () => {
        vi.mocked(decompress).mockImplementation(() => {
            throw new Error("Failed to decompress data");
        });

        await useAppStore.getState().loadFromLink("invalid-data");

        const state = useAppStore.getState();
        expect(state.error).toContain("Failed to load shared content");
    });
});
