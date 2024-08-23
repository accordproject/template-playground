# Module 2: Understanding the Template Model

In this module, we'll explore the **Template Model**, a crucial component of the Accord Project template system. The Template Model defines the data structure that supports the natural language text in your templates, providing a bridge between the text and the executable logic. Understanding the Template Model will help you grasp how data is categorized and utilized within Accord Project templates.

## What is the Template Model?

Unlike standard document templates (such as those created in Word or PDF), Accord Project templates use a _Template Model_ to associate a structured data model with the natural language text. This model categorizes and defines the types of different components used in the template, enabling the computer to understand and process the information effectively.

![Template Model](/public/assets/content/template_model.png)

The Template Model categorizes variables into different types—such as numbers, monetary amounts, dates, or references to organizations—allowing the computer to interpret the template's data correctly.

## Example of a Template Model

Let's examine a Template Model for a **Service Agreement** clause:

```js
/* The template model */
namespace service@1.0.0

concept Address {
  o String line1
  o String city
  o String state
  o String country
}

concept Service {
  o String serviceName
  o String description
  o DateTime serviceDate
}

concept PaymentDetails {
  o MonetaryAmount amount
  o DateTime dueDate
}

@template
concept ServiceAgreementData {
  o String clientName
  o Address clientAddress
  o Service[] services
  o PaymentDetails payment
}
```

In this model:

- **`Address`** defines the structure for addresses, including line1, city, state, and country.
- **`Service`** specifies the details of the services being provided, including the service name, description, and service date.
- **`PaymentDetails`** outlines the payment information, including the amount and due date.
- **`ServiceAgreementData`** is the main data concept used in the template, incorporating `clientName`, `clientAddress`, a list of `services`, and `payment`.

### Key Components

- **Concepts**: Define data structures and types used in the template. For instance, `Address` and `Service` are concepts that model different types of data.
- **Attributes**: Specify the type of data each concept holds, such as `String`, `Integer`, `DateTime`, or `MonetaryAmount`.
- **Namespaces**: Organize and manage different versions of the models, such as `service@1.0.0`.

## Concerto

The Template Model is written in **Concerto**, a language used to define data models in Accord Project templates. Concerto supports a range of modeling capabilities, including:

- Primitive types (e.g., numbers, dates)
- Nested and optional data structures
- Enumerations and relationships
- Object-oriented style inheritance

_More information about Concerto can be found in the [Concerto Model](https://concerto.accordproject.org/docs/intro) section of this documentation._

## Summary

In this module, we've introduced the Template Model, showcasing its role in defining and structuring the data used in Accord Project templates. By understanding the Template Model, you can create more sophisticated and functional templates that integrate seamlessly with TemplateMark text.

## What's Next?

In the next module, we'll dive into **Template Logic**—the business rules and logic that govern how templates are processed and executed. You'll learn how to implement and test the logic that drives template functionality, enhancing your ability to create dynamic and interactive templates. Stay tuned for an in-depth exploration of Template Logic!
