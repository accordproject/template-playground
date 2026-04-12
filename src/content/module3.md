# Module 3

## _Provide JSON data for your template_

The JSON data panel is where you provide the actual values that fill your template. This data must conform to the structure defined by your Concerto model.

---

### The $class Property

Every JSON object **must** include a `$class` property that identifies its type. The format is:

```
namespace@version.ConceptName
```

**Example:**

```json
{
  "$class": "hello@1.0.0.HelloWorld",
  "name": "World"
}
```

The `$class` value must match:
- The namespace from your model (`hello`)
- The version (`1.0.0`)
- The concept name (`HelloWorld`)

---

### Serializing Primitive Types

Each Concerto type maps to a JSON representation:

| Concerto Type | JSON Type | Example |
|---------------|-----------|---------|
| `String` | string | `"Hello World"` |
| `Integer` | number (whole) | `42` |
| `Long` | number (whole) | `9223372036854775807` |
| `Double` | number (decimal) | `3.14159` |
| `Boolean` | boolean | `true` or `false` |
| `DateTime` | string (ISO 8601) | `"2026-04-12T00:00:00.000Z"` |

**Example with multiple types:**

```json
{
  "$class": "hello@1.0.0.HelloWorld",
  "name": "Alice",
  "age": 30,
  "salary": 75000.50,
  "isActive": true,
  "startDate": "2026-04-12T09:00:00.000Z"
}
```

---

### DateTime Format

DateTime values use the **ISO 8601** format:

```
YYYY-MM-DDTHH:mm:ss.sssZ
```

| Part | Meaning | Example |
|------|---------|---------|
| `YYYY` | Year | 2026 |
| `MM` | Month (01-12) | 04 |
| `DD` | Day (01-31) | 12 |
| `T` | Separator | T |
| `HH` | Hour (00-23) | 09 |
| `mm` | Minutes | 30 |
| `ss` | Seconds | 00 |
| `.sss` | Milliseconds | .000 |
| `Z` | UTC timezone | Z |

**Examples:**
- `"2026-04-12T00:00:00.000Z"` — Midnight UTC on April 12, 2026
- `"2026-12-25T14:30:00.000Z"` — 2:30 PM UTC on December 25, 2026

---

### Enum Values

Enum values are serialized as plain strings matching the enum option:

**Model:**
```concerto
enum Status {
    o ACTIVE
    o PENDING
    o CLOSED
}
```

**JSON:**
```json
{
  "$class": "hello@1.0.0.HelloWorld",
  "status": "ACTIVE"
}
```

---

### Optional Properties

Optional properties can simply be **omitted** from the JSON (don't use `null`):

**Model:**
```concerto
concept HelloWorld {
    o String name
    o String nickname optional
}
```

**Valid JSON (with optional):**
```json
{
  "$class": "hello@1.0.0.HelloWorld",
  "name": "Alice",
  "nickname": "Ali"
}
```

**Valid JSON (without optional):**
```json
{
  "$class": "hello@1.0.0.HelloWorld",
  "name": "Alice"
}
```

---

### Arrays

Arrays are standard JSON arrays. For arrays of concepts, each element needs its own `$class`:

**Model:**
```concerto
concept Item {
    o String name
    o Double price
}

concept Order {
    o Item[] items
}
```

**JSON:**
```json
{
  "$class": "hello@1.0.0.Order",
  "items": [
    {
      "$class": "hello@1.0.0.Item",
      "name": "Widget",
      "price": 9.99
    },
    {
      "$class": "hello@1.0.0.Item",
      "name": "Gadget",
      "price": 24.99
    }
  ]
}
```

For arrays of primitives, use standard JSON arrays:

```json
{
  "$class": "hello@1.0.0.HelloWorld",
  "middleNames": ["Jane", "Marie"]
}
```

---

### Nested Objects

Nested concepts require their own `$class` property:

**Model:**
```concerto
concept Address {
    o String street
    o String city
}

concept Person {
    o String name
    o Address address
}
```

**JSON:**
```json
{
  "$class": "hello@1.0.0.Person",
  "name": "Alice",
  "address": {
    "$class": "hello@1.0.0.Address",
    "street": "123 Main St",
    "city": "New York"
  }
}
```

---

### Complete Example

Putting it all together:

**Model:**
```concerto
namespace hello@1.0.0

enum Country {
    o USA
    o UK
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
    o Address address
    o Boolean isVIP
}
```

**JSON:**
```json
{
  "$class": "hello@1.0.0.HelloWorld",
  "name": "Alice",
  "middleNames": ["Jane", "Marie"],
  "age": 30,
  "birthDate": "1996-03-15T00:00:00.000Z",
  "address": {
    "$class": "hello@1.0.0.Address",
    "street": "123 Main Street",
    "city": "Boston",
    "country": "USA"
  },
  "isVIP": true
}
```

---

### Validation

The playground automatically validates your JSON against the Concerto model. Common errors include:

- **Missing `$class`**: Every object needs a type identifier
- **Missing required property**: Check your model for non-optional properties
- **Type mismatch**: Numbers can't be quoted, strings must be quoted
- **Invalid enum value**: Must match exactly one of the enum options
- **Invalid DateTime**: Must use ISO 8601 format

When validation succeeds, your template will render with the provided data!
