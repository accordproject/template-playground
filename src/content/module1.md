# Module 1

## _Create a Concerto model for your template_

[Concerto](https://concerto.accordproject.org) is a lightweight, object-oriented modeling language for defining the data structure of your templates. Think of it as a schema that describes what information your template needs.

### Key Concepts

Concerto models define **concepts** (like classes) with **properties** (like fields). The model ensures your data is valid before it's used in a template.

---

### Step 1: Define a Namespace

Every Concerto model starts with a [namespace](https://concerto.accordproject.org/docs/design/specification/model-namespaces) declaration. Namespaces prevent naming conflicts and include a version number:

```concerto
namespace hello@1.0.0
```

The format is `name@major.minor.patch` following semantic versioning.

---

### Step 2: Create a Concept

[Concepts](https://concerto.accordproject.org/docs/design/specification/model-classes) are the building blocks of your model. They define a structured type with properties:

```concerto
namespace hello@1.0.0

concept HelloWorld {
}
```

---

### Step 3: Add the @template Decorator

The `@template` [decorator](https://concerto.accordproject.org/docs/design/specification/model-decorators) marks which concept represents the root data structure for your template:

```concerto
namespace hello@1.0.0

@template
concept HelloWorld {
}
```

Only one concept in your model should have `@template`.

---

### Step 4: Add Properties

[Properties](https://concerto.accordproject.org/docs/design/specification/model-properties) define the data fields. Each property has a type and a name:

```concerto
namespace hello@1.0.0

@template
concept HelloWorld {
    o String name
}
```

The `o` prefix indicates an "owned" property (the standard property type).

---

### Concerto Property Types

Concerto supports these primitive types:

| Type | Description | Example Values |
|------|-------------|----------------|
| `String` | Text values | `"Hello"`, `"John Doe"` |
| `Integer` | Whole numbers | `42`, `-7`, `0` |
| `Long` | Large whole numbers | `9223372036854775807` |
| `Double` | Decimal numbers | `3.14`, `99.99`, `-0.5` |
| `Boolean` | True/false values | `true`, `false` |
| `DateTime` | Date and time | `2026-04-12T10:30:00Z` |

**Example with multiple types:**

```concerto
namespace hello@1.0.0

@template
concept HelloWorld {
    o String name
    o Integer age
    o Double salary
    o Boolean isActive
    o DateTime startDate
}
```

---

### Optional Properties

Properties are required by default. Add `optional` to make a property non-required:

```concerto
namespace hello@1.0.0

@template
concept HelloWorld {
    o String name
    o String nickname optional
}
```

Optional properties can be omitted from the JSON data.

---

### Arrays

Use `Type[]` syntax for lists of values:

```concerto
namespace hello@1.0.0

@template
concept HelloWorld {
    o String name
    o String[] middleNames
}
```

Arrays can contain primitives or concepts.

---

### Enums

[Enums](https://concerto.accordproject.org/docs/design/specification/model-classes) define a fixed set of allowed values:

```concerto
namespace hello@1.0.0

enum Status {
    o ACTIVE
    o PENDING
    o CLOSED
}

@template
concept HelloWorld {
    o String name
    o Status status
}
```

---

### Nested Concepts

Concepts can reference other concepts for complex data structures:

```concerto
namespace hello@1.0.0

concept Address {
    o String street
    o String city
    o String country
}

@template
concept HelloWorld {
    o String name
    o Address address
}
```

---

### Documentation with @description

Use the `@description` decorator to document properties:

```concerto
namespace hello@1.0.0

@template
concept HelloWorld {
    o String name
    @description("Height in centimeters")
    o Double height
}
```

---

### Complete Example

Here's a more complete model showing multiple features:

```concerto
namespace hello@1.0.0

enum Country {
    o USA
    o UK
    o FRANCE
    o GERMANY
}

concept Address {
    o String street
    o String city
    o Country country
}

@template
concept HelloWorld {
    o String name
    o String[] middleNames optional
    o Integer age
    o DateTime birthDate
    o Address address optional
    o Boolean isVIP
}
```

Learn more in the [Concerto documentation](https://concerto.accordproject.org/docs/intro).
