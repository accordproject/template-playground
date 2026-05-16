import { ModelManager, Factory, Serializer } from "@accordproject/concerto-core";

/**
 * Finds the @template-decorated concept in the model manager and uses
 * concerto-core's Factory (with ValueGenerator internally) to generate
 * sample instance data, then serializes it to JSON.
 *
 * @param modelCto - The Concerto model in CTO format
 * @returns A JSON string with sample data conforming to the model
 */
export async function generateSampleData(modelCto: string): Promise<string> {
    const modelManager = new ModelManager({ strict: true });
    modelManager.addCTOModel(modelCto, undefined, true);
    await modelManager.updateExternalModels();

    // Find the @template concept
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const concepts = modelManager.getConceptDeclarations();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const templateConcept = concepts.find(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (c: any) => c.getDecorator("template") !== null
    );

    if (!templateConcept) {
        throw new Error(
            "No @template concept found in the model. " +
            "Please add the @template decorator to the main concept in your Concerto model."
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const ns: string = templateConcept.getNamespace();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const name: string = templateConcept.getName();

    // Use Factory with generate:'sample' — internally uses ValueGenerator + InstanceGenerator
    const factory = new Factory(modelManager);
    const resource = factory.newConcept(ns, name, undefined, {
        generate: 'sample',
        includeOptionalFields: false,
    });

    // Serialize to plain JSON using concerto-core's Serializer
    const serializer = new Serializer(factory, modelManager);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const json = serializer.toJSON(resource);
    return JSON.stringify(json, null, 2);
}
