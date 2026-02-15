declare module '@accordproject/markdown-template' {
    import { ModelManager } from '@accordproject/concerto-core';

    export class TemplateMarkTransformer {
        fromMarkdownTemplate(options: {
            fileName: string;
            content: string;
            modelManager: ModelManager;
            templateKind?: string;
        }): { getModelManager: () => ModelManager };

        toMarkdownTemplate(parserManager: { getModelManager: () => ModelManager }): string;

        generate(data: Record<string, unknown>, parserManager: { getModelManager: () => ModelManager }): string;

        getVariables(parserManager: { getModelManager: () => ModelManager }): Record<string, unknown>;
    }
}
