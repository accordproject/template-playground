# Accord Project Template Playground Contribution Guide

We'd love for you to contribute to the Template Playground and help make Accord Project technology even better! Here's how to get involved:

* [Code of Conduct][contribute.coc]
* [Questions and Problems][contribute.question]
* [Issues and Bugs][contribute.issue]
* [Feature Requests][contribute.feature]
* [Documentation Improvements][contribute.docs]
* [Issue Submission Guidelines][contribute.submit]
* [Pull Request Submission Guidelines][contribute.submitpr]
* [Development Guidelines][developers]

## <a name="coc"></a> Code of Conduct

Help us keep the Accord Project open and inclusive. Please read and follow our [Code of Conduct][coc].

## <a name="requests"></a> Questions, Bugs, Features

### <a name="question"></a> Got a Question or Problem?

We want to keep GitHub Issues dedicated to bug reports and feature requests. For general support questions, please use the [Accord Project Discord Community][apdiscord] - you'll get faster responses from the community.

### <a name="issue"></a> Found an Issue or Bug?

If you find a bug in the source code or documentation, please submit an issue to our GitHub repository. Even better, submit a Pull Request with a fix!

**See [Issue Submission Guidelines][contribute.submit] below for details.**

### <a name="feature"></a> Missing a Feature?

You can request a new feature by submitting an issue to the GitHub repository. Please include:
- Clear use case and motivation
- Example scenarios where this feature would be useful
- Potential implementation approach (if you have ideas)

If you'd like to implement a new feature:

* **Major Changes** (new editors, providers, significant refactoring) should be discussed first in a GitHub Issue outlining:
  - The problem being solved
  - Proposed solution
  - Potential impacts on existing functionality
  
* **Small Changes** (bug fixes, documentation, minor features) can be submitted directly as a Pull Request. See [Pull Request Submission Guidelines][contribute.submitpr] and [Development Guidelines][developers].

### <a name="docs"></a> Want to Improve Documentation?

Documentation improvements are highly valued! You can:
1. Open an issue suggesting documentation improvements
2. Submit a Pull Request with the improvements directly (even better!)

For large documentation changes:
- Build and test the documentation before submitting
- Ensure no formatting or layout issues
- Follow [Commit Message Guidelines][developers.commits]
- Update related docs and examples

**Good karma for documentation contributors!** ✨

## <a name="submit"></a> Issue Submission Guidelines

Before submitting, please search existing issues - your question may already be answered.

### Reporting a Bug

If you find a bug that hasn't been reported, open a new issue. The issue form will guide you through providing necessary details.

**Effective bug reports include:**

1. **Clear, descriptive title**
   - ❌ Bad: "Doesn't work"
   - ✅ Good: "AI Chat panel not responding when switching between templates"

2. **Step-by-step reproduction**
   - Exact steps to reproduce the issue
   - What happens vs. what should happen

3. **Screenshots or recordings**
   - Visual proof helps tremendously
   - GIFs or videos for complex interactions

4. **Environment details**
   - Node.js version: `node --version`
   - npm version: `npm --version`
   - Browser and version (if relevant)
   - Operating System

5. **Additional context**
   - Does it happen consistently or intermittently?
   - What were you trying to do?
   - Any related error messages?

**Remember: If you get help, help others. Good karma rules!** 🙌

## <a name="submit-pr"></a> Pull Request Submission Guidelines

### 1. Check for Related Work

* Search for existing GitHub Issues related to your work
* If no issue exists, [create one][contribute.submit] with:
  - Problem description
  - Expected behavior
  - Your proposed solution
  
* Search for open/closed Pull Requests to avoid duplicate effort
* Link related Issues and PRs in your submission for context

### 2. Set Up Development Environment

Follow [Development Guidelines][developers] to set up your environment:

```bash
# Clone your forked repository
git clone https://github.com/<YOUR_USERNAME>/template-playground.git
cd template-playground

# Add upstream remote for syncing
git remote add upstream https://github.com/accordproject/template-playground.git

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app runs at `http://localhost:5173`

### 3. Create a Feature Branch

Use this naming convention for branches:

```bash
git checkout -b <type>/<issue-number>/<short-description> main
```

**Branch types:**
- `feature/` - New features
- `fix/` - Bug fixes  
- `docs/` - Documentation improvements
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Dependency updates, build script changes

**Examples:**
```bash
git checkout -b feature/42/support-claude-3-opus main
git checkout -b fix/156/editor-sync-lag main
git checkout -b docs/189/improve-setup-guide main
```

### 4. Make Your Changes

* Follow our [Code Standards][developers.rules]
* Write tests for new functionality
* Update documentation as needed
* Add JSDoc comments for complex logic
* Keep commits focused and logical

### 5. Run Tests & Validation

Before submitting, ensure everything works:

```bash
# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run linting
npm run lint

# Build for production (verify no build errors)
npm run build
```

**All tests must pass.** If adding a feature:
- Include unit tests for logic
- Add component tests for UI changes
- Consider E2E tests for critical workflows

### 6. Write Clear Commit Messages

Follow [Conventional Commits][developers.commits] format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code formatting (no logic changes)
- `refactor:` - Code refactoring (no feature/fix)
- `perf:` - Performance improvement
- `test:` - Test additions/updates
- `chore:` - Build, dependencies, tooling

**Examples:**

```
feat(ai-assistant): add support for Claude 3 Opus model

- Implement AnthropicProvider for Claude 3 Opus
- Add model configuration in AIConfigPopup
- Support streaming responses and error handling
- Add unit tests for streaming and error cases

Closes #123
```

```
fix(editor): resolve Monaco editor sync lag on large files

Debounce editor onChange events to prevent excessive
re-renders and state updates when editing large templates.
Improves performance from 50ms lag to <5ms.

Fixes #456
```

```
docs(contributing): add detailed contribution workflow examples

Add step-by-step examples for branch creation, commits,
and PR submission to make contributing easier for newcomers.
```

### 7. Sync and Rebase

Before creating the PR, ensure your branch is up to date:

```bash
# Fetch latest changes
git fetch upstream

# Rebase onto main (keeps history clean)
git rebase upstream/main

# If there are conflicts, resolve them then:
git rebase --continue
```

### 8. Push Your Branch

```bash
git push origin <type>/<issue-number>/<short-description>
```

### 9. Create a Pull Request

On GitHub, create a PR to `template-playground:main`

**Use this template for your PR description:**

```markdown
## Description
Brief summary of what this PR does.

## Motivation & Context
Why is this change needed? What problem does it solve?

Related Issue: Closes #123

## Type of Change
- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Specific change 1
- Specific change 2
- Specific change 3

## Testing
How have you tested these changes?
- Test case 1
- Test case 2

## Screenshots (if applicable)
[Add screenshots or recordings of UI changes]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing locally
- [ ] No breaking changes (or clearly documented)
```

### 10. Review & Updates

* A maintainer will review your PR
* Continuous Integration (CI) must pass:
  - Linting ✓
  - Unit tests ✓
  - E2E tests ✓
  - Build verification ✓
  
* Address feedback and push updates to the same branch
* Don't worry if CI fails - we can help troubleshoot!

### 11. After Merge

Once your PR is merged, clean up:

```bash
# Delete remote branch
git push origin --delete <type>/<issue-number>/<short-description>

# Switch to main
git checkout main

# Delete local branch
git branch -D <type>/<issue-number>/<short-description>

# Update your local main
git fetch --all --prune
git rebase upstream/main
git push origin main
```

---

## Development Guidelines

For detailed information on:
- Code standards and best practices
- TypeScript conventions
- React component patterns
- Testing requirements
- Documentation standards

Please see [DEVELOPERS.md][developers]

---


## Getting Help

- **Discord**: [Accord Project Discord Community][apdiscord] - fastest way to get help
- **GitHub Discussions**: For questions and ideas
- **GitHub Issues**: For bugs and feature requests

---

## License

Accord Project source code files are made available under the [Apache License, Version 2.0][apache].

Accord Project documentation files are made available under the [Creative Commons Attribution 4.0 International License][creativecommons] (CC-BY-4.0).

---

[coc]: https://lfprojects.org/policies/code-of-conduct/
[apdiscord]: https://discord.gg/Zm99SKhhtA
[apache]: https://github.com/accordproject/techdocs/blob/master/LICENSE
[creativecommons]: http://creativecommons.org/licenses/by/4.0/

[contribute.coc]: CONTRIBUTING.md#coc
[contribute.question]: CONTRIBUTING.md#question
[contribute.issue]: CONTRIBUTING.md#issue
[contribute.feature]: CONTRIBUTING.md#feature
[contribute.docs]: CONTRIBUTING.md#docs
[contribute.submit]: CONTRIBUTING.md#submit
[contribute.submitpr]: CONTRIBUTING.md#submit-pr

[developers]: DEVELOPERS.md
[developers.commits]: DEVELOPERS.md#commits
[developers.rules]: DEVELOPERS.md#rules