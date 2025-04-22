# Code Conventions

This document outlines the coding standards, patterns, and development practices for the mtrl library. Following these conventions ensures consistency, maintainability, and high code quality throughout the project.

## Build & Development Commands

- Build: `bun run build`
- Dev server: `bun run dev`
- Tests: `bun test`
- Single test: `bun test test/components/button.test.ts`
- Watch tests: `bun test --watch`
- Test with UI: `bun test --watch --ui`
- Test coverage: `bun test --coverage`
- Docs: `bun run docs` (uses TypeDoc)

## Core Architecture

### Component Structure

- Components follow a standard directory structure:
  - `index.ts` - Public exports and constants
  - `component.ts` - Main component implementation (e.g., `button.ts`)
  - `types.ts` - TypeScript interfaces and types
  - `config.ts` - Default configuration and helpers
  - `api.ts` - Public API implementation
  - `features/` - Component-specific features

### Functional Composition

- Use the pipe pattern for component creation:
  ```typescript
  const component = pipe(
    createBase,
    withElement(options),
    withEvents(),
    withFeature(config),
    // Additional features...
    withLifecycle()
  )(baseConfig);
  ```

- Higher-order functions should be pure and focused on a single responsibility
- Features should be composable and independent of each other

## Coding Style

### TypeScript

- Use TypeScript with strict mode enabled
- Prefer interfaces over types for object definitions
- Use discriminated union types for variants
- Export public types alongside components
- Use generics for reusable, type-safe components
- Avoid `any` type; use specific types or `unknown` when appropriate
- Use type guards for runtime type checking

### Functions and Methods

- Use factory pattern: `createComponent` naming for component creators
- Prefer pure functions over stateful classes
- Use arrow functions for consistent `this` binding
- Keep functions small and focused on a single responsibility
- Use parameter destructuring for clearer function signatures

### Error Handling

- Wrap component creation in try/catch blocks
- Provide meaningful error messages with component names
- Log errors to console in development mode
- Fail gracefully with helpful warnings when possible

### Naming Conventions

- **Components**: camelCase for variables, PascalCase for type names
- **CSS Classes**: Follow BEM-style naming: `mtrl-component__element--modifier`
- **Constants**: UPPER_SNAKE_CASE for constants, especially in enums
- **Private Properties**: Use `#` prefix (private class fields) or `_` prefix (convention)
- **Interfaces**: Prefix with `I` only for implementation interfaces, not for public types

## CSS and Styling

- Use external SCSS files for components in `src/components/` (e.g., `_button.scss`)
- No inline CSS in component implementation
- Follow BEM methodology for class naming
- Use CSS variables for theming and configuration
- Keep selectors flat and avoid deep nesting
- Group related properties and use consistent property order

## Documentation

- Each file must start with a header comment indicating the file path
- Use TypeDoc-compatible comments for all public exports
- Document interfaces, including property descriptions
- Include examples in documentation for public APIs
- Structure component documentation with these sections:
  - Component description
  - Usage examples
  - Configuration options
  - Accessibility considerations
  - Browser compatibility notes (if relevant)

Example of proper TypeDoc comments:

```typescript
/**
 * Creates a new Button component with the specified configuration.
 * 
 * The Button component implements the Material Design 3 Button guidelines
 * with support for different variants, states, and features.
 * 
 * @param {ButtonConfig} config - Configuration options for the button
 * @returns {ButtonComponent} A fully configured button component instance
 * @throws {Error} Throws an error if button creation fails
 * 
 * @example
 * // Create a simple text button
 * const textButton = createButton({ text: 'Click me' });
 * document.body.appendChild(textButton.element);
 */
```

## Testing

- Tests live in `test/components/` with `.test.ts` extension
- Test structure follows `describe/test` pattern
- Each component should have tests for:
  - Component creation with various configurations
  - Public API methods
  - Event handling
  - State changes and transitions
  - Error cases
- Use JSDOM for DOM manipulation in tests
- Create mock implementations to avoid circular dependencies
- Use `import type` to avoid circular dependencies in TypeScript tests

## Version Control

- Use conventional commit format: `type(scope): message`
- Commit types: feat, fix, docs, style, refactor, test, chore
- Branch naming follows pattern: `type/description` (e.g., `feat/new-component`)
- Standard branch types: feat, fix, chore
- Keep commit messages concise and descriptive
- Include issue number in commit message when applicable
- PR titles should follow the same convention as commit messages

## Performance Considerations

- Minimize DOM manipulation and batch changes when possible
- Use DocumentFragment for creating complex DOM structures
- Optimize event listeners with delegation where appropriate
- Ensure components clean up event listeners to prevent memory leaks
- Reduce calculation in render paths and consider memoization for expensive operations
- Structure code to enable effective tree-shaking