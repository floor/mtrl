# TypeDoc Installation and Usage Guide for MTRL

This guide will help you set up and use TypeDoc with your MTRL library.

## Installation

To install TypeDoc and its dependencies:

```bash
# Using Bun
bun add -D typedoc

# Using npm
npm install --save-dev typedoc

# Using yarn
yarn add --dev typedoc
```

## Configuration

TypeDoc is configured via the `typedoc.json` file at the root of your project. This configuration specifies input files, output directory, theming options, and more.

## Generating Documentation

To generate documentation:

```bash
# Using the npm script
bun run docs

# Or directly
bun typedoc
```

## Serving Documentation Locally

To view the generated documentation in your browser:

```bash
# Using the npm script
bun run docs:serve

# Or directly
bun run --bun serve docs
```

Then open your browser to http://localhost:8080

## Documentation Structure

TypeDoc generates a structured representation of your codebase:

- **Modules**: File-based organization of your code
- **Classes/Interfaces**: Object definitions and their members
- **Functions**: Standalone functions
- **Type aliases**: Custom type definitions
- **Variables**: Exported variables

## JSDoc Tips for Better Documentation

TypeDoc uses JSDoc comments to generate documentation. Here are some tips for writing effective comments:

### Basic Comment Structure

```typescript
/**
 * Description of the function
 * @param paramName Description of the parameter
 * @returns Description of the return value
 */
function myFunction(paramName: string): number {
  // Implementation
}
```

### Common JSDoc Tags

- `@param {type} name - Description` - Describes a function parameter
- `@returns {type} Description` - Describes the return value
- `@example` - Provides an example of usage
- `@see` - References related documentation
- `@deprecated` - Marks an element as deprecated
- `@since version` - Indicates when the element was added
- `@category name` - Organizes documentation into categories

### Categories

Use the `@category` tag to organize your MTRL components and utilities:

```typescript
/**
 * @category Components
 */
export interface ButtonConfig {
  // ...
}

/**
 * @category Core
 */
export const pipe = (...fns) => (initialValue) => {
  // ...
}
```

## Customizing the Theme

If you want to customize the default theme, you can create a custom theme:

1. Create a `typedoc-theme` directory
2. Copy the default theme files from the TypeDoc package
3. Modify the files as needed
4. Update the `typedoc.json` file to use your custom theme:

```json
{
  "theme": "./typedoc-theme"
}
```

## Continuous Integration

To automatically generate documentation on each commit or release:

1. Add a script to your CI workflow (GitHub Actions, etc.)
2. Generate the docs and deploy them to GitHub Pages or another hosting service

Example GitHub Actions workflow:

```yaml
name: Generate Docs

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - name: Install dependencies
        run: bun install
      - name: Generate docs
        run: bun run docs
      - name: Deploy to GitHub Pages
        uses: JamesIves/github-pages-deploy-action@4.1.4
        with:
          branch: gh-pages
          folder: docs
```