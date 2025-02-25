# Contributing to MTRL

Thank you for your interest in contributing to MTRL! This document provides guidelines and instructions for contributing to this lightweight, ES6-focused JavaScript UI component library.

## Why Contribute?

MTRL aims to be a modern, flexible UI component library with:

- Zero dependencies (except Bun for development)
- ES6+ focused codebase
- Lightweight, tree-shakable components
- Simple and extensible API
- Excellent documentation

By contributing to MTRL, you'll help create a lean alternative to heavier frameworks while gaining experience with modern JavaScript patterns and component design.

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

MTRL uses a separate repository called mtrl.app (https://mtrl.app) for showcasing and testing components. There are two ways to test your components:

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

MTRL components follow a consistent pattern:

```javascript
// src/components/mycomponent/index.js
export { createMyComponent } from './mycomponent';

// src/components/mycomponent/mycomponent.js
import { createElement } from '../../core/dom/create';
import { createLifecycle } from '../../core/state/lifecycle';
// etc...

export const createMyComponent = (options = {}) => {
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
2. Create a new view file in `src/client/views/components/` for your component.
3. Add the route in `src/client/core/navigation.js` of the mtrl.app repository.
4. Implement different variants and states for testing.
5. Run the showcase server with `bun run dev` in the mtrl.app directory.

This separation of the library code (mtrl) and the showcase app (mtrl.app) keeps the core library clean while providing a rich development environment.

### Coding Standards

- Use ES6+ features but maintain browser compatibility
- Follow functional programming principles when possible
- Use consistent naming conventions:
  - Factory functions should be named `createXyz`
  - Utilities should use clear, descriptive names
- Write JSDoc comments for all public functions

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

```javascript
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

For any new feature or component:

- Add JSDoc comments for API methods
- Update the component's README.md (if applicable)
- Consider adding example code in the playground

## Community and Communication

- Submit issues for bugs or feature requests
- Join the discussion on existing issues
- Be respectful and constructive in communications

## License

By contributing to MTRL, you agree that your contributions will be licensed under the project's MIT License.

---

Thank you for contributing to MTRL! Your efforts help make this library better for everyone.