# Overview

## Module 2

Learn how to use the Template Playground:

1. **Open the Template Editor**: Navigate to the TemplateMark section.
2. **Modify the Template**: Use the editor to make changes.
3. **Save Changes**: Click on the save button to apply your changes.

### Previewing Data

To preview your data:

1. **Go to the Preview Section**: View the output of your template.
2. **Review the Rendered Template**: Ensure it meets your requirements.

### Sharing Templates

1. **Click on the Share Button**: Generate a shareable link for your template.
2. **Copy the Link**: Share it with others to access your template.

A property of a class may be declared as a relationship using the `-->` syntax instead of the `o` syntax. The `o` syntax declares that the class contains (has-a) property of that type, whereas the `-->` syntax declares a typed pointer to an external identifiable instance.

In this example, the model declares that an `Order` has-an array of reference to `OrderLines`. Deleting the `Order` has no impact on the `OrderLine`. When the `Order` is serialized the JSON only the IDs of the `OrderLines` are stored within the `Order`, not the `OrderLines` themselves.

```js
asset OrderLine identified by orderLineId {
  o String orderLineId
  o String sku
  o String orderLineId
  o String sku
  o String orderLineId
  o String sku
  o String sku
}

asset Order identified by orderId {
  o String orderId
  --> OrderLine[] orderlines
}
```
