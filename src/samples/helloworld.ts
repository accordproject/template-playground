const MODEL = `namespace hello@1.0.0

@template
concept HelloWorld {
    o String name
}`;

const TEMPLATE = `> The one, the only...

### Hello {{name}}!
`;

const DATA = {
    "$class" : "hello@1.0.0.HelloWorld",
    "name": "John Doe"
};

const NAME = 'Hello World';
const DESCRIPTION = "Simple starter template";
const DIFFICULTY = "Easy";
const TAGS = ["beginner", "basic"];

export { NAME, MODEL, DATA, TEMPLATE, DESCRIPTION, DIFFICULTY, TAGS };
