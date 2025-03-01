# MTRL Library

> **Project Status:** MTRL is in active development with TypeScript support! The core architecture and components are established, with more features on the roadmap. We welcome early adopters and contributors who want to help shape MTRL's future!

MTRL is a lightweight, composable TypeScript/JavaScript component library inspired by Material Design principles. Built with zero dependencies, MTRL provides a robust foundation for creating modern web interfaces with an emphasis on performance, type safety, and accessibility.

## Understanding MTRL

MTRL (pronounced "material") takes its inspiration from Material Design while providing a flexible, framework-agnostic implementation. The library's name is reflected in its component prefix `mtrl-`, which you'll see used consistently throughout the codebase.

### Design Philosophy

MTRL is built on several core principles:

1. **Composition Over Inheritance**: Components are constructed through functional composition with full type safety.
2. **Zero Dependencies**: The entire library is built with vanilla TypeScript, ensuring minimal bundle size and maximum compatibility.
3. **Material Design Inspiration**: While inspired by Material Design, MTRL provides flexibility in styling and behavior.
4. **Accessibility First**: Built-in accessibility features ensure your applications are usable by everyone.
5. **TypeScript First**: Comprehensive type definitions for better developer experience and code reliability.

## Core Components

MTRL provides a comprehensive set of components, each following Material Design principles:

```typescript
import { createButton, createTextField } from 'mtrl'

// Create a material button with ripple effect
const button = createButton({
  text: 'Submit',
  variant: 'filled',
  ripple: true,
  class: 'custom-button'
})

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

Let's look at how MTRL components are constructed:

```typescript
// Example of a button component creation
const button = createButton({
  prefix: 'mtrl',           // The library's prefix
  componentName: 'button',  // Component identifier
  variant: 'filled',        // Visual variant
  text: 'Click me',         // Button text
  ripple: true             // Enable ripple effect
})
```

### The Composition System

MTRL uses a pipe-based composition system with full type safety for building components:

```typescript
// Internal component creation
const createButton = (config: ButtonConfig): ButtonComponent => {
  return pipe(
    createBase,                // Base component structure
    withEvents(),             // Event handling capability
    withElement({             // DOM element creation
      tag: 'button',
      componentName: 'button',
      prefix: 'mtrl'
    }),
    withVariant(config),      // Visual variant support
    withText(config),         // Text content management
    withIcon(config),         // Icon support
    withRipple(config)        // Ripple animation
  )(config)
}
```

### TypeScript Integration

MTRL provides comprehensive TypeScript definitions:

```typescript
// Component interfaces for better developer experience
export interface ButtonComponent extends 
  BaseComponent, 
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

MTRL follows a consistent class naming convention:

```css
.mtrl-component                /* Base component class */
.mtrl-component--variant      /* Variant modifier */
.mtrl-component--state        /* State modifier (disabled, focused) */
.mtrl-component-element       /* Child element */
```

## State Management

MTRL provides several approaches to state management:

### Local Component State

```typescript
const textField = createTextField({
  label: 'Username'
})

textField.on('input', ({ value }) => {
  console.log('Current value:', value)
})

textField.setValue('New value')
```

### Collection Management

For managing lists and datasets:

```typescript
const collection = new Collection<User>({
  transform: (item) => ({
    ...item,
    displayName: `${item.firstName} ${item.lastName}`
  })
})

collection.subscribe(({ event, data }) => {
  console.log(`Collection ${event}:`, data)
})
```

## Data Integration

MTRL provides adapters for different data sources:

```typescript
// MongoDB adapter
const mongoAdapter = createMongoAdapter({
  uri: 'mongodb://localhost:27017',
  dbName: 'mtrl-app',
  collection: 'users'
})

// Route adapter for REST APIs
const routeAdapter = createRouteAdapter({
  base: '/api',
  endpoints: {
    list: '/users',
    create: '/users'
  }
})
```

## Customization

### Creating Custom Components

Extend MTRL by creating custom components with full type safety:

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
      tag: 'div',
      componentName: 'card',
      prefix: 'mtrl'
    }),
    // Add custom features
    (component) => ({
      ...component,
      setContent(content: string) {
        component.element.innerHTML = content;
        return this;
      }
    })
  )(config);
}
```

### Styling

MTRL components can be styled through CSS custom properties:

```css
:root {
  --mtrl-primary: #6200ee;
  --mtrl-surface: #ffffff;
  --mtrl-on-surface: #000000;
  --mtrl-elevation-1: 0 2px 4px rgba(0,0,0,0.2);
}
```

## Best Practices

### Performance

MTRL is designed with performance in mind:

- Minimal DOM operations
- Efficient event handling
- Automatic cleanup of resources
- Lazy initialization of features

### Type Safety

MTRL leverages TypeScript for better developer experience:

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

MTRL supports modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details and our [Migration Guide](MIGRATION-GUIDE.md) for TypeScript information.

## License

MTRL is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Documentation

For detailed API documentation, examples, and guides, visit our [documentation site](https://mtrl.app).

---

This library is designed to provide a solid foundation for building modern web interfaces with TypeScript while maintaining flexibility for custom implementations. For questions, issues, or contributions, please visit our GitHub repository.