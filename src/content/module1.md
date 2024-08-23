# Module 1: Introduction to TemplateMark

The **TemplateMark** language is a crucial element of the Accord Project template system. It allows you to craft templates using a mix of _natural language text_ and _markup syntax_, making it possible to create documents that are both _human-readable_ and _machine-readable_. In this module, we will delve into the basics of TemplateMark, showcasing its key features and demonstrating its practical application within the Accord Project Template Playground.

## What is TemplateMark?

TemplateMark is a markup language used for defining templates in the Accord Project. It combines plain text with specific notations, enabling templates to be interpreted and processed by computers while remaining understandable to humans.

![Template Text](/public/assets/content/template_text.png)

Templates in Accord Project are made up of three essential elements:

- **Template Text**: The natural language content of the template.
- **Template Model**: The data model that provides the connection between the text and the executable logic.
- **Template Logic**: The business rules and logic that define how the template is processed and used.

These components work together to create a powerful tool for contract automation and management.

## Example of Template Text

Let's explore a TemplateMark example for a **Service Agreement** clause:

```js
## Service Agreement

{{provider}} agrees to provide the following services to {{client}}:

- **Service 1**: {{service1Description}}
- **Service 2**: {{service2Description}}

The services will be delivered according to the following schedule:

- **Start Date**: {{startDate as "D MMMM YYYY"}}
- **End Date**: {{endDate as "D MMMM YYYY"}}

Payment terms are as follows:

- **Amount**: {{paymentAmount as "0,0.00 USD"}}
- **Due Date**: {{paymentDueDate as "D MMMM YYYY"}}

Any changes to the service agreement must be documented in writing and agreed upon by both parties.
```

In this template:

- `{{provider}}`, `{{client}}`, `{{service1Description}}`, `{{service2Description}}`, `{{startDate}}`, `{{endDate}}`, `{{paymentAmount}}`, and `{{paymentDueDate}}` are placeholders that will be replaced with actual values when the template is used.

Here's how the same clause looks with placeholder values filled in:

```md
## Service Agreement

"ABC Services Ltd." agrees to provide the following services to "XYZ Corp":

- **Service 1**: Monthly IT support and maintenance
- **Service 2**: On-site technical assistance

The services will be delivered according to the following schedule:

- **Start Date**: 1 September 2024
- **End Date**: 31 August 2025

Payment terms are as follows:

- **Amount**: $5,000.00
- **Due Date**: 1 September 2024

Any changes to the service agreement must be documented in writing and agreed upon by both parties.
```

## Key Features of TemplateMark

- **Variables**: Use `{{` and `}}` to denote placeholders in your template. These placeholders are replaced with specific values during template processing.
- **Conditional Sections**: Incorporate or exclude sections based on conditions using `{{#clause}} ... {{/clause}}`.
- **Formatting**: Apply formatting like bold or italics to emphasize important terms.
- **Lists**: Organize information using ordered or unordered lists.

## Practical Example in the Playground

In the Template Playground, you can interact with TemplateMark templates such as:

```js
### Welcome {{username}}!

![Logo](https://avatars.githubusercontent.com/u/29445438?s=64)

{{#clause personalDetails}}
#### Personal Details
> {{firstName}} {{lastName}},
 {{address}}, {{city}}, {{state}},
 {{country}}
 {{/clause}}

- Your date of birth is *{{dob as "D MMMM YYYY"}}*
- Your annual salary is {{annualSalary as "0,0.00 USD"}}
- Your preferred contact method is {{contactMethod}}

{{#clause recentActivity}}
## Recent Activity
You signed up on {{signupDate as "D MMMM YYYY"}} ({{% return now.diff(user.signupDate, 'day')%}} days ago).

{{#ulist recentPurchases}}
- {{quantity}}x _{{item}}_ @ ${{price as "0,0.00"}}
{{/ulist}}
Total spent: {{% return '£' + user.recentPurchases.map(purchase => purchase.price * purchase.quantity).reduce((sum, cur) => sum + cur).toFixed(2);%}}
{{/clause}}

Thank you for being with us!
```

In this example:

- **Welcome Message**: Personalize messages with dynamic values.
- **Personal Details Clause**: Display personal information conditionally.
- **Recent Activity**: List recent purchases with calculations.

## Summary

In this module, we introduced TemplateMark, highlighting its role in creating flexible and dynamic templates. By understanding TemplateMark, you can build templates that combine natural language with computer logic, enabling sophisticated document automation and management.

## What's Next?

In the next module, we'll explore the **Template Model**—the data structure that supports and enhances the TemplateMark text. We'll cover how the Template Model integrates with TemplateMark to enable dynamic and functional templates. Stay tuned for a deep dive into the data modeling aspect of Accord Project templates!
