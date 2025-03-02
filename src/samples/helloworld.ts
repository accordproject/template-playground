const MODEL = `namespace hello@1.0.0

@template
concept HelloWorld {
    o String name
}`;

const TEMPLATE = `> The one, the only...

### Hello {{name}}!
`;

const DATA = {
  $class: "hello@1.0.0.HelloWorld",
  name: "John Doe",
};

const NAME = "Hello World";
export { NAME, MODEL, DATA, TEMPLATE };
