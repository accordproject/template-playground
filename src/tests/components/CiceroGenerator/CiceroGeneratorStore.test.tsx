import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import useAppStore from "../../../store/store";
import { initialCiceroGeneratorState } from "../../../components/CiceroGenerator/types";

// Mock rebuild function from the store (avoid actual template parsing)
vi.mock("@accordproject/concerto-core", () => ({
    ModelManager: vi.fn().mockImplementation(() => ({
        addCTOModel: vi.fn(),
        updateExternalModels: vi.fn().mockResolvedValue(undefined),
    })),
}));

vi.mock("@accordproject/template-engine", () => ({
    TemplateMarkInterpreter: vi.fn().mockImplementation(() => ({
        generate: vi.fn().mockResolvedValue({
            toJSON: vi.fn().mockReturnValue({}),
        }),
    })),
}));

vi.mock("@accordproject/markdown-template", () => ({
    TemplateMarkTransformer: vi.fn().mockImplementation(() => ({
        fromMarkdownTemplate: vi.fn().mockReturnValue({}),
    })),
}));

vi.mock("@accordproject/markdown-transform", () => ({
    transform: vi.fn().mockResolvedValue("<p>Test HTML</p>"),
}));

describe("Cicero Generator Store", () => {
    beforeEach(() => {
        // Reset store to initial state before each test
        useAppStore.setState({
            isCiceroGeneratorOpen: false,
            ciceroGeneratorState: initialCiceroGeneratorState,
            templateMarkdown: "",
            editorValue: "",
            modelCto: "",
            editorModelCto: "",
            data: "{}",
            editorAgreementData: "{}",
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe("setIsCiceroGeneratorOpen", () => {
        it("should open the generator panel", () => {
            useAppStore.getState().setIsCiceroGeneratorOpen(true);
            expect(useAppStore.getState().isCiceroGeneratorOpen).toBe(true);
        });

        it("should close the generator panel", () => {
            useAppStore.getState().setIsCiceroGeneratorOpen(true);
            useAppStore.getState().setIsCiceroGeneratorOpen(false);
            expect(useAppStore.getState().isCiceroGeneratorOpen).toBe(false);
        });
    });

    describe("setCiceroGeneratorState", () => {
        it("should update document text", () => {
            useAppStore.getState().setCiceroGeneratorState({
                documentText: "Test legal document",
            });
            expect(useAppStore.getState().ciceroGeneratorState.documentText).toBe("Test legal document");
        });

        it("should update template name", () => {
            useAppStore.getState().setCiceroGeneratorState({
                templateName: "lateDelivery",
            });
            expect(useAppStore.getState().ciceroGeneratorState.templateName).toBe("lateDelivery");
        });

        it("should update namespace", () => {
            useAppStore.getState().setCiceroGeneratorState({
                namespace: "org.example.late",
            });
            expect(useAppStore.getState().ciceroGeneratorState.namespace).toBe("org.example.late");
        });

        it("should update isContract", () => {
            useAppStore.getState().setCiceroGeneratorState({
                isContract: true,
            });
            expect(useAppStore.getState().ciceroGeneratorState.isContract).toBe(true);
        });

        it("should update currentStep", () => {
            useAppStore.getState().setCiceroGeneratorState({
                currentStep: "coordinator",
            });
            expect(useAppStore.getState().ciceroGeneratorState.currentStep).toBe("coordinator");
        });

        it("should update completedSteps", () => {
            useAppStore.getState().setCiceroGeneratorState({
                completedSteps: ["coordinator", "agent1"],
            });
            expect(useAppStore.getState().ciceroGeneratorState.completedSteps).toEqual(["coordinator", "agent1"]);
        });

        it("should update isGenerating", () => {
            useAppStore.getState().setCiceroGeneratorState({
                isGenerating: true,
            });
            expect(useAppStore.getState().ciceroGeneratorState.isGenerating).toBe(true);
        });

        it("should update error", () => {
            useAppStore.getState().setCiceroGeneratorState({
                error: "Test error message",
            });
            expect(useAppStore.getState().ciceroGeneratorState.error).toBe("Test error message");
        });

        it("should update outputs", () => {
            const outputs = {
                contractBrief: null,
                grammarTem: "# Template",
                modelCto: "namespace test",
                logicTs: "class Logic {}",
                validationReport: null,
                packageJson: null,
                requestJson: null,
            };
            useAppStore.getState().setCiceroGeneratorState({
                outputs,
            });
            expect(useAppStore.getState().ciceroGeneratorState.outputs.grammarTem).toBe("# Template");
            expect(useAppStore.getState().ciceroGeneratorState.outputs.modelCto).toBe("namespace test");
        });

        it("should preserve other state when partially updating", () => {
            useAppStore.getState().setCiceroGeneratorState({
                documentText: "Test document",
            });
            useAppStore.getState().setCiceroGeneratorState({
                templateName: "myTemplate",
            });

            const state = useAppStore.getState().ciceroGeneratorState;
            expect(state.documentText).toBe("Test document");
            expect(state.templateName).toBe("myTemplate");
        });
    });

    describe("resetCiceroGenerator", () => {
        it("should reset all generator state to initial values", () => {
            // First, set some values
            useAppStore.getState().setCiceroGeneratorState({
                documentText: "Test document",
                templateName: "testTemplate",
                isGenerating: true,
                currentStep: "agent2",
                completedSteps: ["coordinator", "agent1"],
            });

            // Then reset
            useAppStore.getState().resetCiceroGenerator();

            const state = useAppStore.getState().ciceroGeneratorState;
            expect(state.documentText).toBe("");
            expect(state.templateName).toBe("");
            expect(state.isGenerating).toBe(false);
            expect(state.currentStep).toBeNull();
            expect(state.completedSteps).toEqual([]);
        });
    });

    describe("loadGeneratedTemplateToEditors", () => {
        it("should throw error when no outputs available", async () => {
            await expect(
                useAppStore.getState().loadGeneratedTemplateToEditors()
            ).rejects.toThrow("No generated template to load");
        });

        it("should load grammarTem to template editor", async () => {
            const grammarTem = "# Test Template\n{{name}}";
            useAppStore.getState().setCiceroGeneratorState({
                outputs: {
                    ...initialCiceroGeneratorState.outputs,
                    grammarTem,
                },
            });

            await useAppStore.getState().loadGeneratedTemplateToEditors();

            expect(useAppStore.getState().templateMarkdown).toBe(grammarTem);
            expect(useAppStore.getState().editorValue).toBe(grammarTem);
        });

        it("should load modelCto to model editor", async () => {
            const modelCto = "namespace test@1.0.0\nconcept Person {}";
            useAppStore.getState().setCiceroGeneratorState({
                outputs: {
                    ...initialCiceroGeneratorState.outputs,
                    modelCto,
                },
            });

            await useAppStore.getState().loadGeneratedTemplateToEditors();

            expect(useAppStore.getState().modelCto).toBe(modelCto);
            expect(useAppStore.getState().editorModelCto).toBe(modelCto);
        });

        it("should generate sample data from contract brief", async () => {
            const contractBrief = {
                templateName: "TestTemplate",
                namespace: "org.test",
                version: "1.0.0",
                isContract: false,
                variables: [
                    { name: "name", type: "String", description: "Name", sampleValue: "Alice", format: null },
                    { name: "amount", type: "Double", description: "Amount", sampleValue: 100.5, format: null },
                ],
                enumerations: [],
                conditionalProvisions: [],
                obligations: [],
                requestType: { name: "Request", fields: [] },
                responseType: { name: "Response", fields: [] },
                stateType: null,
                computedTextPassages: [],
            };

            useAppStore.getState().setCiceroGeneratorState({
                outputs: {
                    ...initialCiceroGeneratorState.outputs,
                    grammarTem: "# Test",
                    contractBrief,
                },
            });

            await useAppStore.getState().loadGeneratedTemplateToEditors();

            const data = JSON.parse(useAppStore.getState().data);
            expect(data.name).toBe("Alice");
            expect(data.amount).toBe(100.5);
            expect(data.$class).toBe("org.test@1.0.0.TestTemplate");
        });
    });
});
