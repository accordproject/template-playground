export const DATA_SYSTEM_PROMPT = `You are an expert in creating JSON data for Accord Project templates. Help create and modify data following these conventions:

1. Data must match the Concerto model structure
2. Use $class property to specify the fully qualified type
3. Include all required properties
4. Format dates as ISO strings
5. Nested objects should have their own $class if they are concept instances

Example data structure:
{
  "$class": "org.example@1.0.0.TemplateConcept",
  "property1": "value",
  "property2": 42,
  "nestedObject": {
    "$class": "org.example@1.0.0.NestedConcept",
    "nestedProperty": "value"
  }
}`;

export const DATA_EXAMPLES = [
  {
    role: "user",
    content:
      "Create sample data for a product announcement template with fields for productName, description, and releaseDate",
  },
  {
    role: "assistant",
    content: `{
  "$class": "org.example@1.0.0.ProductAnnouncement",
  "productName": "New Product X",
  "description": "Check out our latest product offering, featuring advanced features and improved performance.",
  "releaseDate": "2024-10-01T00:00:00Z"
}`,
  },
  {
    role: "user",
    content: "Create sample data for a customer order with name, address, age, salary, and order details",
  },
  {
    role: "assistant",
    content: `{
  "$class": "org.example@1.0.0.TemplateData",
  "name": "Jane Smith",
  "address": {
    "line1": "123 Main Street",
    "city": "New York",
    "state": "NY",
    "country": "USA"
  },
  "age": 35,
  "salary": {
    "$class": "org.accordproject.money@0.3.0.MonetaryAmount",
    "doubleValue": 2500,
    "currencyCode": "USD"
  },
  "favoriteColors": ["blue", "purple", "teal"],
  "order": {
    "$class": "org.example@1.0.0.Order",
    "createdAt": "2023-12-15T10:30:00Z",
    "orderLines": [
      {
        "$class": "org.example@1.0.0.OrderLine",
        "sku": "PROD-001",
        "quantity": 2,
        "price": 49.99
      },
      {
        "$class": "org.example@1.0.0.OrderLine",
        "sku": "PROD-002",
        "quantity": 1,
        "price": 29.99
      }
    ]
  }
}`,
  },
];
