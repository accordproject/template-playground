const MODEL = `namespace hello@1.0.0

@template
concept HelloWorld {
    o String name
}`;

const TEMPLATE = `> Includes a TypeScript formula.

### Welcome {{name}}!

Your name has {{% return name.length %}} characters.
`;

const DATA = {
    "$class" : "hello@1.0.0.HelloWorld",
    "name": "John Doe"
};

const NAME = 'Formula';
export {NAME, MODEL,DATA,TEMPLATE};