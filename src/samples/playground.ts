const MODEL = `namespace org.accordproject.demo@1.0.0

concept Repository {
  o String name
  o String language
}

@template
concept ProjectData {
  o String projectName
  o String websiteUrl
  o String foundation
  o String version
  o String[] coreTech
  o Repository[] repositories
}`;

const TEMPLATE = `> Playground default sample using real Accord Project metadata

## Project: {{projectName}}

**Organization:** {{foundation}}  
**Website:** {{websiteUrl}}  
**Version:** {{version}}

### Tech Stack
{{#join coreTech ", "}}

### Core Repositories
{{#ulist repositories}}
- {{name}} ({{language}})
{{/ulist}}

_Rendered via Accord Project Template Engine_`;

const DATA = {
  "$class": "org.accordproject.demo@1.0.0.ProjectData",
  "projectName": "Accord Project",
  "websiteUrl": "https://accordproject.org",
  "foundation": "The Linux Foundation",
  "version": "1.0.0",
  "coreTech": ["Concerto", "Cicero", "Ergo", "React"],
  "repositories": [
    {
      "$class": "org.accordproject.demo@1.0.0.Repository",
      "name": "cicero",
      "language": "TypeScript"
    },
    {
      "$class": "org.accordproject.demo@1.0.0.Repository",
      "name": "concerto",
      "language": "JavaScript"
    }
  ]
};

const NAME = 'Accord Project Fact Sheet';

export { NAME, MODEL, DATA, TEMPLATE };
