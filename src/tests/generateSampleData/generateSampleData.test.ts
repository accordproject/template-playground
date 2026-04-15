import { describe, it, expect } from 'vitest';
import { generateSampleData } from '../../utils/generateSampleData';

describe('generateSampleData', () => {
    it('should generate sample data for a simple model with primitives', async () => {
        const model = `namespace test@1.0.0

@template
concept SimpleModel {
    o String name
    o Integer age
    o Boolean active
}`;

        const result = await generateSampleData(model);
        const data = JSON.parse(result);

        expect(data.$class).toBe('test@1.0.0.SimpleModel');
        expect(typeof data.name).toBe('string');
        expect(typeof data.age).toBe('number');
        expect(typeof data.active).toBe('boolean');
    });

    it('should generate sample data with optional field excluded by default', async () => {
        const model = `namespace test@1.0.0

@template
concept OptionalModel {
    o String name
    o Integer age optional
    o String nickname optional
}`;

        const result = await generateSampleData(model);
        const data = JSON.parse(result);

        expect(data.$class).toBe('test@1.0.0.OptionalModel');
        expect(typeof data.name).toBe('string');
    });

    it('should generate sample data with enum fields', async () => {
        const model = `namespace test@1.0.0

enum Color {
    o RED
    o GREEN
    o BLUE
}

@template
concept EnumModel {
    o String name
    o Color favoriteColor
}`;

        const result = await generateSampleData(model);
        const data = JSON.parse(result);

        expect(data.$class).toBe('test@1.0.0.EnumModel');
        expect(['RED', 'GREEN', 'BLUE']).toContain(data.favoriteColor);
    });

    it('should throw an error when no @template concept is found', async () => {
        const model = `namespace test@1.0.0

concept NotATemplate {
    o String name
}`;

        await expect(generateSampleData(model)).rejects.toThrow(
            'No @template concept found in the model'
        );
    });

    it('should generate sample data for a complex model with nested concepts', async () => {
        const model = `namespace test@1.0.0

concept Item {
    o String sku
    o Integer quantity
    o Double price
}

@template
concept Order {
    o String customerName
    o DateTime orderDate
    o Item[] items
}`;

        const result = await generateSampleData(model);
        const data = JSON.parse(result);

        expect(data.$class).toBe('test@1.0.0.Order');
        expect(typeof data.customerName).toBe('string');
        expect(Array.isArray(data.items)).toBe(true);
        expect(data.items.length).toBe(1);
        expect(data.items[0].$class).toBe('test@1.0.0.Item');
        expect(typeof data.items[0].sku).toBe('string');
        expect(typeof data.items[0].quantity).toBe('number');
        expect(typeof data.items[0].price).toBe('number');
    });
});
