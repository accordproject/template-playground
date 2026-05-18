# Introduction

## _Learn to create Accord Project smart contract templates_

Welcome to the Accord Project Template Playground! In this tutorial, you'll learn how to create smart contract templates that combine natural language text with structured data and computable logic.

### What is an Accord Project Template?

An Accord Project template is a reusable document pattern that consists of three interconnected components:

1. **Concerto Model** — Defines the *data structure* (schema) for your template. Written in the [Concerto](https://concerto.accordproject.org) modeling language, it specifies what information your template needs: names, dates, amounts, lists, and more.

2. **TemplateMark Template** — The *natural language text* of your document with placeholders for dynamic data. Uses [TemplateMark](https://docs.accordproject.org/docs/markup-templatemark) syntax to bind text to your data model.

3. **JSON Data** — The *actual values* that fill in the template placeholders. Must conform to the structure defined by your Concerto model.

### Why Use Templates?

- **Consistency**: Generate documents with guaranteed structure and validation
- **Reusability**: Create once, use many times with different data
- **Type Safety**: Catch errors early with schema validation
- **Automation**: Integrate with systems via JSON APIs

### Tutorial Modules

This tutorial walks you through creating a simple "Hello World" template:

- [Module 1: Concerto Model](https://playground.accordproject.org/learn/module1) — Define the data structure using Concerto's object-oriented syntax
- [Module 2: TemplateMark Template](https://playground.accordproject.org/learn/module2) — Write the template text with variable placeholders and formatting
- [Module 3: JSON Data](https://playground.accordproject.org/learn/module3) — Provide data values and understand how they serialize to JSON

Let's get started!