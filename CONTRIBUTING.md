# Contributing to mtrl

Thank you for your interest in contributing to mtrl! This document provides guidelines and instructions for contributing to this lightweight, TypeScript-focused UI component library.

## Why Contribute?

mtrl aims to be a modern, flexible UI component library with:

- Zero dependencies (except Bun for development)
- TypeScript-first codebase
- Lightweight, tree-shakable components
- Simple and extensible API
- Excellent documentation

By contributing to mtrl, you'll help create a lean alternative to heavier frameworks while gaining experience with modern TypeScript patterns and component design.

## Getting Started

### Development Environment

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/mtrl.git
   cd mtrl
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

### Testing Your Components with mtrl.app

mtrl uses a separate repository called mtrl.app (https://mtrl.app) for showcasing and testing components. There are two ways to test your components:

1. **Build and link locally**:
   ```bash
   # In the mtrl repository
   bun run build
   
   # Clone the mtrl.app repository 
   git clone https://github.com/YOUR-USERNAME/mtrl.app.git
   cd mtrl.app
   
   # Install dependencies and link to your local mtrl build
   bun install
   bun link ../path/to/your/mtrl
   
   # Start the showcase server
   bun run dev
   ```

2. **Use the official showcase site**:
   Visit https://mtrl.app to see official examples and documentation.

## Contribution Workflow

1. **Pick an issue or feature** - Start with issues labeled `good-first-issue` or `help-wanted`.

2. **Create a branch** - Name your branch based on what you're working on:
   ```bash
   git checkout -b feature/button-improvements
   # or
   git checkout -b fix/textfield-validation
   ```

3. **Make your changes** - Follow the coding standards and guidelines below.

4. **Test your changes** - Use the playground app to test your components in real-time.

5. **Submit a pull request** - Include a detailed description of your changes and reference any related issues.

## Development Guidelines

### Component Structure

mtrl components follow a consistent pattern:

```typescript
// src/components/mycomponent/index.ts
export { createMyComponent } from './mycomponent';
export type { MyComponentOptions } from './types';

// src/components/mycomponent/types.ts
export interface MyComponentOptions {
  text?: string;
  onClick?: (event: MouseEvent) => void;
  // other options...
}

// src/components/mycomponent/mycomponent.ts
import { createElement } from '../../core/dom/create';
import { createLifecycle } from '../../core/state/lifecycle';
import type { MyComponentOptions } from './types';

/**
 * Creates a new MyComponent instance
 * @param options - Configuration options for MyComponent
 * @returns The MyComponent instance
 */
export const createMyComponent = (options: MyComponentOptions = {}) => {
  // Create DOM elements
  const element = createElement({...});
  
  // Setup state and features
  const lifecycle = createLifecycle(element);
  
  // Return component API
  return {
    element,
    // Other public methods...
    destroy() {
      lifecycle.destroy();
    }
  };
};
```

### Using mtrl.app for Development

The mtrl.app showcase application is the best way to develop and test your components:

1. Clone the mtrl.app repository alongside your mtrl clone.
2. Create a new view file in `src/client/content/components/` for your component.
3. Add the route in `src/client/core/navigation.ts` of the mtrl.app repository.
4. Implement different variants and states for testing.
5. Run the showcase server with `bun run dev` in the mtrl.app directory.

This separation of the library code (mtrl) and the showcase app (mtrl.app) keeps the core library clean while providing a rich development environment.

### TypeScript Standards

- Use TypeScript's type system to create clear interfaces and types
- Export types and interfaces separately from implementations
- Use strict typing and avoid `any` when possible
- Prefer interfaces for public APIs and type aliases for complex types
- Add proper return types to all functions

### Coding Standards

- Add file path as a comment on the first line of each file
- Use functional programming principles when possible
- Use consistent naming conventions:
  - Factory functions should be named `createXyz`
  - Utilities should use clear, descriptive names
  - Interfaces should be named in PascalCase (e.g., `ButtonOptions`)
- Write TypeDoc comments for all public functions and types

### CSS/SCSS Guidelines

- Use BEM-style naming: `mtrl-component__element--modifier`
- Keep specificity low
- Use CSS variables for theming
- Organize styles in the `src/components/*/styles.scss` file

## Pull Request Process

1. Ensure your code follows the style guidelines
2. Update documentation as needed
3. Include a clear description of the changes
4. Reference any issues that are being addressed
5. Wait for review and address any feedback

## Testing

Please add appropriate tests for your changes:

```typescript
// Example test structure
describe('myComponent', () => {
  it('should render correctly', () => {
    // Test code
  });
  
  it('should handle user interaction', () => {
    // Test code
  });
});
```

## Documentation

Documentation is crucial for this project:

- Add TypeDoc comments for all public API methods and types
- Comment the file path at the top of each file
- Update the component's README.md (if applicable)
- Consider adding example code in the playground

Example of proper TypeDoc:

```typescript
/**
 * Creates a button element with specified options
 * 
 * @param options - The button configuration options
 * @returns A button component instance
 * @example
 * ```ts
 * const button = createButton({ text: 'Click me', variant: 'primary' });
 * document.body.appendChild(button.element);
 * ```
 */
```

## Community and Communication

- Submit issues for bugs or feature requests
- Join the discussion on existing issues
- Be respectful and constructive in communications

## License

By contributing to mtrl, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to mtrl! Your efforts help make this library better for everyone.