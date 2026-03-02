import { describe, it, expect } from 'vitest';
import { generateSampleData } from '../../../utils/generateSampleData';

describe('generateSampleData', () => {
    it('should generate sample data for a simple model with String and Integer', async () => {
        const model = `namespace test@1.0.0

@template
concept SimpleModel {
    o String name
    o Integer age
}`;

        const result = await generateSampleData(model);
        const data = JSON.parse(result);

        expect(data.$class).toBe('test@1.0.0.SimpleModel');
        expect(typeof data.name).toBe('string');
        expect(data.name).toBe('sample_name');
        expect(typeof data.age).toBe('number');
        expect(data.age).toBe(1);
    });

    it('should generate sample data for a model with DateTime', async () => {
        const model = `namespace test@1.0.0

@template
concept DateModel {
    o String title
    o DateTime createdAt
}`;

        const result = await generateSampleData(model);
        const data = JSON.parse(result);

        expect(data.$class).toBe('test@1.0.0.DateModel');
        expect(typeof data.createdAt).toBe('string');
        // Should be a valid ISO date string
        expect(new Date(data.createdAt).toISOString()).toBe(data.createdAt);
    });

    it('should generate sample data for a model with Boolean and Double', async () => {
        const model = `namespace test@1.0.0

@template
concept TypesModel {
    o Boolean isActive
    o Double price
}`;

        const result = await generateSampleData(model);
        const data = JSON.parse(result);

        expect(data.$class).toBe('test@1.0.0.TypesModel');
        expect(data.isActive).toBe(true);
        expect(typeof data.price).toBe('number');
    });

    it('should generate sample data with nested concepts including $class', async () => {
        const model = `namespace test@1.0.0

concept Address {
    o String line1
    o String city
}

@template
concept Person {
    o String name
    o Address address
}`;

        const result = await generateSampleData(model);
        const data = JSON.parse(result);

        expect(data.$class).toBe('test@1.0.0.Person');
        expect(data.address).toBeDefined();
        expect(data.address.$class).toBe('test@1.0.0.Address');
        expect(typeof data.address.line1).toBe('string');
        expect(typeof data.address.city).toBe('string');
    });

    it('should generate sample data with array fields', async () => {
        const model = `namespace test@1.0.0

@template
concept ListModel {
    o String[] tags
    o Integer[] scores
}`;

        const result = await generateSampleData(model);
        const data = JSON.parse(result);

        expect(data.$class).toBe('test@1.0.0.ListModel');
        expect(Array.isArray(data.tags)).toBe(true);
        expect(data.tags.length).toBe(1);
        expect(typeof data.tags[0]).toBe('string');
        expect(Array.isArray(data.scores)).toBe(true);
        expect(data.scores[0]).toBe(1);
    });

    it('should generate sample data with optional fields', async () => {
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
        // Optional fields should still be generated with sample values
        expect(data.age).toBeDefined();
        expect(data.nickname).toBeDefined();
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
        expect(data.favoriteColor).toBe('RED');
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

    it('should generate sample data for a complex model with nested arrays of concepts', async () => {
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
