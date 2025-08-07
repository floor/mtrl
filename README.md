# mtrl Library

> **Project Status:** mtrl is in active development with TypeScript support! The core architecture and components are established, with more features on the roadmap. We welcome early adopters and contributors who want to help shape mtrl's future!

mtrl is a lightweight, composable TypeScript/JavaScript component library inspired by Material Design principles. Built with zero dependencies, mtrl provides a robust foundation for creating modern web interfaces with an emphasis on performance, type safety, and accessibility.

## Understanding mtrl

mtrl (pronounced "material") takes its inspiration from Material Design while providing a flexible, framework-agnostic implementation.

### Design Philosophy

mtrl is built on several core principles:

1. **Composition Over Inheritance**: Components are constructed through functional composition with full type safety.
2. **Zero Dependencies**: The entire library is built with vanilla TypeScript, ensuring minimal bundle size and maximum compatibility.
3. **Material Design Inspiration**: While inspired by Material Design, mtrl provides flexibility in styling and behavior.
4. **Accessibility First**: Built-in accessibility features ensure your applications are usable by everyone.
5. **TypeScript First**: Comprehensive type definitions for better developer experience and code reliability.

## Core Components

mtrl provides a comprehensive set of components, each following Material Design principles:

```typescript
import { createButton, createTextField } from "mtrl";

// Create a material button with ripple effect
const button = createButton({
  text: "Submit",
  variant: "filled",
  ripple: true,
  class: "custom-button",
});

// className will be: mtrl-button mtrl-button--filled custom-button
```

### Component List

Each component follows the `mtrl-` prefix convention:

- `mtrl-button` - Material buttons with ripple effects
- `mtrl-textfield` - Text input components
- `mtrl-switch` - Toggle switches
- `mtrl-navigation` - Navigation components
- `mtrl-list` - List components with selection
- `mtrl-snackbar` - Toast notifications
- `mtrl-container` - Layout containers

## Installation

```bash
# Using npm
npm install mtrl

# Using yarn
yarn add mtrl

# Using bun
bun add mtrl
```

## Component Architecture

Let's look at how mtrl components are constructed:

```typescript
// Example of a button component creation
const button = createButton({
  prefix: "mtrl", // The library's prefix
  componentName: "button", // Component identifier
  variant: "filled", // Visual variant
  text: "Click me", // Button text
  ripple: true, // Enable ripple effect
});
```

### The Composition System

mtrl uses a pipe-based composition system with full type safety for building components:

```typescript
// Internal component creation
const createButton = (config: ButtonConfig): ButtonComponent => {
  return pipe(
    createBase, // Base component structure
    withEvents(), // Event handling capability
    withElement({
      // DOM element creation
      tag: "button",
      componentName: "button",
      prefix: "mtrl",
    }),
    withVariant(config), // Visual variant support
    withText(config), // Text content management
    withIcon(config), // Icon support
    withRipple(config) // Ripple animation
  )(config);
};
```

### TypeScript Integration

mtrl provides comprehensive TypeScript definitions:

```typescript
// Component interfaces for better developer experience
export interface ButtonComponent
  extends BaseComponent,
    ElementComponent,
    TextComponent,
    IconComponent,
    DisabledComponent,
    LifecycleComponent {
  // Button-specific properties and methods
  getValue: () => string;
  setValue: (value: string) => ButtonComponent;
  enable: () => ButtonComponent;
  disable: () => ButtonComponent;
  setText: (content: string) => ButtonComponent;
  getText: () => string;
  setIcon: (icon: string) => ButtonComponent;
  getIcon: () => string;
  destroy: () => void;
  updateCircularStyle: () => void;
}
```

### CSS Classes

mtrl follows a consistent class naming convention:

```css
.mtrl-component                /* Base component class */
/* Base component class */
.mtrl-component--variant      /* Variant modifier */
.mtrl-component--state        /* State modifier (disabled, focused) */
.mtrl-component-element; /* Child element */
```

## State Management

mtrl provides several approaches to state management:

### Local Component State

```typescript
const textField = createTextField({
  label: "Username",
});

textField.on("input", ({ value }) => {
  console.log("Current value:", value);
});

textField.setValue("New value");
```

### Collection Management

For managing lists and datasets:

```typescript
const collection = new Collection<User>({
  transform: (item) => ({
    ...item,
    displayName: `${item.firstName} ${item.lastName}`,
  }),
});

collection.subscribe(({ event, data }) => {
  console.log(`Collection ${event}:`, data);
});
```

## Data Integration

mtrl provides adapters for different data sources:

```typescript
// MongoDB adapter
const mongoAdapter = createMongoAdapter({
  uri: "mongodb://localhost:27017",
  dbName: "mtrl-app",
  collection: "users",
});

// Route adapter for REST APIs
const routeAdapter = createRouteAdapter({
  base: "/api",
  endpoints: {
    list: "/users",
    create: "/users",
  },
});
```

## Customization

### Creating Custom Components

Extend mtrl by creating custom components with full type safety:

```typescript
interface CustomCardConfig {
  title?: string;
  class?: string;
}

interface CustomCardComponent extends ElementComponent {
  setContent: (content: string) => CustomCardComponent;
}

const createCustomCard = (config: CustomCardConfig): CustomCardComponent => {
  return pipe(
    createBase,
    withEvents(),
    withElement({
      tag: "div",
      componentName: "card",
      prefix: "mtrl",
    }),
    // Add custom features
    (component) => ({
      ...component,
      setContent(content: string) {
        component.element.innerHTML = content;
        return this;
      },
    })
  )(config);
};
```

### Styling

mtrl components can be styled through CSS custom properties:

```css
:root {
  --mtrl-primary: #6200ee;
  --mtrl-surface: #ffffff;
  --mtrl-on-surface: #000000;
  --mtrl-elevation-1: 0 2px 4px rgba(0, 0, 0, 0.2);
}
```

## Best Practices

### Performance

mtrl is designed with performance in mind:

- Minimal DOM operations
- Efficient event handling
- Automatic cleanup of resources
- Lazy initialization of features

### Type Safety

mtrl leverages TypeScript for better developer experience:

- Clear component interfaces
- Type-safe method chaining
- Intelligent code completion
- Compile-time error checking
- Self-documenting code

### Accessibility

Built-in accessibility features include:

- ARIA attributes management
- Keyboard navigation
- Focus management
- Screen reader support

## Browser Support

mtrl supports modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details and our [Migration Guide](MIGRATION-GUIDE.md) for TypeScript information.

## License

mtrl is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Testing

mtrl comes with a comprehensive test suite using Bun's test runner. The tests are written in TypeScript and use JSDOM for DOM testing.

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage report
bun test --coverage

# Run tests with UI
bun test --watch --ui

# Run a specific test file
bun test test/components/button.test.ts
```

For more details on writing and running tests, see our [Testing Guide](TESTING.md).

## Documentation

For detailed API documentation, examples, and guides, visit our [documentation site](https://mtrl.app).

---

This library is designed to provide a solid foundation for building modern web interfaces with TypeScript while maintaining flexibility for custom implementations. For questions, issues, or contributions, please visit our GitHub repository.
