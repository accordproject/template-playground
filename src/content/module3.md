# Module 3

## _Generate data(JSON) for the template_

Generate some data to the TemplateMark template conforming to the shape defined by the Concerto Model.

Define an instance of the `helloworld@1.0.0.TemplateData` data model. In this case setting the value of the `message` property to the string "World".

```
const data = {
    $class: 'helloworld@1.0.0.TemplateData',
    message: 'World',
};
```