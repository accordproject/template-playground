<h1 align="center">Accord Project Template Playground</h1>
<p align="center">
  <a href="https://github.com/accordproject/models/blob/master/LICENSE"><img src="https://img.shields.io/github/license/accordproject/models" alt="GitHub license"></a>
  <a href="https://www.accordproject.org/">
    <img src="https://img.shields.io/badge/powered%20by-accord%20project-19C6C8.svg" alt="Accord Project" />
  </a>
</p>

This repository hosts the Accord Project Template-Playground. Templates are resourced using the [Template-Engine](https://github.com/accordproject/template-engine), rich-text templates are defined in TemplateMark (either as markdown files, or JSON documents) and are then merged with JSON data to produce output documents.

## Accord Project Playground

**Project Overview**

The Accord Project Template-Playground is a web-based platform designed to empower developers of all backgrounds to learn and experiment with Accord Project functionalities in a user-friendly and interactive environment. It is a Web playground for Accord Project templates:

1. TemplateMark for the natural language text.
2. [Concerto](https://docs.accordproject.org/docs/model-concerto.html) for the data model.
3. TypeScript for logic within the templates.
4. [Markdown-Transform](https://github.com/accordproject/markdown-transform) to transform the output to HTML, PDF etc.
5. [Template-Engine](https://github.com/accordproject/template-engine) to convert TemplateMark + JSON data to AgreementMark.
   This playground aims to bridge the gap between static documentation and active learning by providing:

**Interactive Template Samples** Users can directly edit, test and share template samples and see the corresponding output in a live preview environment, fostering a hands-on learning experience.

**Interactive Features:**

- Live template testing and editing with syntax highlighting and error checking.
- Real-time preview of code execution results.
- Share your edited templates with other users through generated shareable links.
- A newly introduced learning pathway allows users to engage in guided learning experiences. Users can explore creating, navigating, and using templates through structured modules.
**Getting Involved**

The Accord Project Playground is an open-source project, welcoming contributions from the developer community. Here are some ways to participate:

- **Feature Implementation:** Help build core functionalities like interactive code editing, live preview, and integrated learning resources.
- **Learning Module Development:** Create interactive modules to showcase specific Accord Project functionalities.
- **Functionality Enhancements:** Improve existing features based on user feedback and project needs.
- **Documentation and Tutorials:** Contribute to comprehensive documentation and tutorials that guide users through the platform effectively.

<h2>Local Development</h2>

<p>
This project can be run locally for development and contribution purposes.
</p>

<h3>Prerequisites</h3>

<p>
Ensure you have the following installed:
</p>

<ul>
  <li><strong>Node.js ≥ 18</strong></li>
  <li><strong>npm</strong></li>
</ul>

<p>Check your versions using:</p>

<pre><code>node -v
npm -v
</code></pre>

<h3>Setup</h3>

<p>
Clone the repository and install dependencies:
</p>

<pre><code>git clone https://github.com/accordproject/template-playground
cd template-playground
npm install
</code></pre>

<h3>Running the Development Server</h3>

<p>
This project uses <strong>Vite</strong> for local development.
</p>

<p>Start the development server using:</p>

<pre><code>npm run dev
</code></pre>

<p>
The application will be available at:
</p>

<pre><code>http://localhost:5173
</code></pre>

<p>
<strong>Note:</strong> This project does <strong>not</strong> define an
<code>npm start</code> script. Use <code>npm run dev</code> for local development.
</p>

<h3>Useful Scripts</h3>

<ul>
  <li>
    Run unit tests:
    <pre><code>npm test</code></pre>
  </li>
  <li>
    Lint the codebase:
    <pre><code>npm run lint</code></pre>
  </li>
  <li>
    Build the project for production:
    <pre><code>npm run build</code></pre>
  </li>
  <li>
    Preview the production build locally:
    <pre><code>npm run preview</code></pre>
  </li>
</ul>

## Demo

The Template Playground is deployed at: [https://playground.accordproject.org](https://playground.accordproject.org)

---

<p align="center">
  <a href="https://www.accordproject.org/">
    <img src="public/APLogo.png" alt="Accord Project Logo" width="400" />
  </a>
</p>

<p align="center">
  <a href="./LICENSE">
    <img src="https://img.shields.io/github/license/accordproject/cicero?color=bright-green" alt="GitHub license">
  </a>
  <a href="https://discord.gg/Zm99SKhhtA">
    <img src="https://img.shields.io/badge/Accord%20Project-Join%20Discord-blue" alt="Join the Accord Project Discord"/>
  </a>
</p>

Accord Project is an open source, non-profit, initiative working to transform contract management and contract automation by digitizing contracts. Accord Project operates under the umbrella of the [Linux Foundation][linuxfound]. The technical charter for the Accord Project can be found [here][charter].

## Learn More About Accord Project

### [Overview][apmain]

### [Documentation][apdoc]

## Contributing

The Accord Project technology is being developed as open source. All the software packages are being actively maintained on GitHub and we encourage organizations and individuals to contribute requirements, documentation, issues, new templates, and code.

Find out what’s coming on our [blog][apblog].

Join the Accord Project Technology Working Group [Discord channel][apdiscord] to get involved!

For code contributions, read our [CONTRIBUTING guide][contributing] and information for [DEVELOPERS][developers].

### README Badge

Using Accord Project? Add a README badge to let everyone know: [![accord project](https://img.shields.io/badge/powered%20by-accord%20project-19C6C8.svg)](https://www.accordproject.org/)

```
[![accord project](https://img.shields.io/badge/powered%20by-accord%20project-19C6C8.svg)](https://www.accordproject.org/)
```

## License <a name="license"></a>

Accord Project source code files are made available under the [Apache License, Version 2.0][apache].
Accord Project documentation files are made available under the [Creative Commons Attribution 4.0 International License][creativecommons] (CC-BY-4.0).

Copyright 2018-2019 Clause, Inc. All trademarks are the property of their respective owners. See [LF Projects Trademark Policy](https://lfprojects.org/policies/trademark-policy/).

[linuxfound]: https://www.linuxfoundation.org
[charter]: https://github.com/accordproject/governance/blob/master/accord-project-technical-charter.md
[apmain]: https://accordproject.org/
[apblog]: https://accordproject.org/news
[apdoc]: https://docs.accordproject.org/
[apdiscord]: https://discord.gg/Zm99SKhhtA
[contributing]: https://github.com/accordproject/models/blob/master/CONTRIBUTING.md
[developers]: https://github.com/accordproject/models/blob/master/DEVELOPERS.md
[apache]: https://github.com/accordproject/models/blob/master/LICENSE
[creativecommons]: http://creativecommons.org/licenses/by/4.0/
