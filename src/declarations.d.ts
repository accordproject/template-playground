/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@accordproject/markdown-template' {
    export class TemplateMarkTransformer {
        fromMarkdownTemplate(
            input: { content: string },
            modelManager: any,
            contractType: string,
            options?: { verbose?: boolean }
        ): object;
    }
}

declare module '@accordproject/markdown-transform' {
    export function transform(
        input: any,
        outputFormat: string,
        options: string[],
        config: any,
        verbose: { verbose: boolean }
    ): Promise<string>;
}
