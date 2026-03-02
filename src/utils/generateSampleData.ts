import { ModelManager } from "@accordproject/concerto-core";

/**
 * Primitive type defaults for Concerto model fields.
 */
const PRIMITIVE_DEFAULTS: Record<string, (fieldName: string) => unknown> = {
    String: (fieldName: string) => `sample_${fieldName}`,
    Integer: () => 1,
    Long: () => 100,
    Double: () => 1.0,
    Boolean: () => true,
    DateTime: () => new Date().toISOString(),
};

/**
 * Generates a sample value for a single property based on its type.
 * Handles primitives, enums, nested concepts, relationships, and arrays.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateValueForProperty(property: any, modelManager: any, visited: Set<string>): unknown {
    const typeName: string = property.getType() as string;
    const fqn: string = property.getFullyQualifiedTypeName() as string;

    let singleValue: unknown;

    // Check if it's a relationship
    if (typeof property.isRelationship === "function" && property.isRelationship()) {
        singleValue = `resource:${fqn}#sample-id`;
    }
    // Check if primitive
    else if (property.isPrimitive()) {
        const generator = PRIMITIVE_DEFAULTS[typeName];
        singleValue = generator ? generator(property.getName() as string) : `sample_${property.getName() as string}`;
    }
    // Check if enum
    else if (property.isTypeEnum()) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const enumDecl = modelManager.getType(fqn);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            const enumValues = enumDecl.getOwnProperties();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (enumValues && enumValues.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                singleValue = enumValues[0].getName() as string;
            } else {
                singleValue = "UNKNOWN";
            }
        } catch {
            singleValue = "UNKNOWN";
        }
    }
    // Must be a concept / complex type
    else {
        // Guard against circular references
        if (visited.has(fqn)) {
            singleValue = { $class: fqn };
        } else {
            singleValue = generateDataForType(fqn, modelManager, visited);
        }
    }

    // Wrap in an array if needed
    if (property.isArray()) {
        return [singleValue];
    }
    return singleValue;
}

/**
 * Generates a sample data object for a given fully qualified Concerto type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateDataForType(fqn: string, modelManager: any, visited: Set<string>): Record<string, unknown> {
    visited.add(fqn);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const classDecl = modelManager.getType(fqn);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const properties = classDecl.getProperties();

    const result: Record<string, unknown> = {
        $class: fqn,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    for (const prop of properties) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const propName: string = prop.getName() as string;

        // Skip system fields that start with $
        if (propName.startsWith("$")) {
            continue;
        }

        result[propName] = generateValueForProperty(prop, modelManager, new Set(visited));
    }

    return result;
}

/**
 * Finds the @template-decorated concept in the model manager.
 * Returns the fully qualified name of the template concept.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findTemplateConcept(modelManager: any): string {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const concepts = modelManager.getConceptDeclarations();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    for (const concept of concepts) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        const templateDecorator = concept.getDecorator("template");
        if (templateDecorator) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            return concept.getFullyQualifiedName() as string;
        }
    }

    throw new Error(
        "No @template concept found in the model. " +
        "Please add the @template decorator to the main concept in your Concerto model."
    );
}

/**
 * Generates sample JSON data from a Concerto model string (CTO format).
 *
 * Parses the model, finds the @template-decorated concept, introspects its
 * properties, and generates a well-typed JSON object with sample values.
 *
 * @param modelCto - The Concerto model in CTO format
 * @returns A JSON string with sample data conforming to the model
 */
export async function generateSampleData(modelCto: string): Promise<string> {
    const modelManager = new ModelManager({ strict: true });
    modelManager.addCTOModel(modelCto, undefined, true);
    await modelManager.updateExternalModels();

    const templateFqn = findTemplateConcept(modelManager);
    const sampleData = generateDataForType(templateFqn, modelManager, new Set<string>());

    return JSON.stringify(sampleData, null, 2);
}
