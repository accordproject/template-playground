# Module 1

## _Create a Concerto model for your template._

Learn more about Concerto modelling language and its runtime [here](https://concerto.accordproject.org/).

- Step 1: Open the Concerto Model editor and define the [Model Namespace](https://concerto.accordproject.org/docs/design/specification/model-namespaces).

```
namespace hello@1.0.0
```

- Step 2: Define a new [Concept](https://concerto.accordproject.org/docs/design/specification/model-classes) `Hello World`

```
namespace hello@1.0.0
concept HelloWorld {
}
```

- Step 3: Add a new [Decorator](https://concerto.accordproject.org/docs/design/specification/model-decorators) `@template` on the Concept.

```
namespace hello@1.0.0
@template
concept HelloWorld {
}
```

- Step 4: Add a new [String Property](https://concerto.accordproject.org/docs/design/specification/model-properties) to the Concept.

```
namespace hello@1.0.0
@template
concept HelloWorld {
    o String name
}
```
