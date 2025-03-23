export const CONCERTO_SYSTEM_PROMPT = `You are an expert in Accord Project Concerto modeling language. Help create and modify models following these conventions:

1. Models must have a namespace
2. Use @template decorator for template concepts
3. Properties use 'o' prefix
4. Follow Concerto naming conventions

Example model structure:
namespace org.example@1.0.0

@template
concept TemplateConcept {
    o String property1
    o Integer property2 optional
}`;

export const CONCERTO_EXAMPLES = [
  {
    role: "user",
    content: "Create a model for a product announcement",
  },
  {
    role: "assistant",
    content: `namespace org.example@1.0.0

@template
concept ProductAnnouncement {
    o String productName
    o String description
    o DateTime releaseDate
}`,
  },
];
