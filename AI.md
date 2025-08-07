# MTRL - AI Assistant Guide

This document provides specific guidance for AI assistants working with mtrl - an independent Material Design 3 component library implemented with pure functional composition and zero dependencies.

## 🎯 mtrl as Independent Library

mtrl is a standalone Material Design 3 component library that can be used independently in any project:

- **Material Design 3 Implementation** - Implementing the complete MD3 specification _(work in progress)_
- **Zero Dependencies** - Pure TypeScript/JavaScript with no external dependencies
- **Framework Agnostic** - Works with any JavaScript framework or vanilla JS
- **Production Ready Architecture** - Built for real-world applications with scalable patterns
- **Accessibility Compliant** - WCAG guidelines and keyboard navigation support

> **Note**: mtrl is currently under active development. While the architecture and core systems are established, not all Material Design 3 components are fully implemented yet. The library follows a component-by-component approach to ensure quality and compliance with MD3 specifications.

## 🔗 Package Ecosystem & Interactions

mtrl also serves as the foundational package in the mtrl ecosystem, providing core Material Design 3 components:

### Package Relationships

```
mtrl (Main Library) ← Foundation
    ↑
    ├── mtrl-addons (Advanced Features)
    │   ├── Depends on mtrl main components
    │   ├── Extends with virtual scrolling & collections
    │   └── Provides performance optimizations
    │
    └── mtrl-app (Showcase & Documentation)
        ├── Uses mtrl components for demonstrations
        ├── Documents mtrl-addons capabilities
        └── Provides development environment
```

### How mtrl Interacts

1. **Provides foundation for mtrl-addons**

   - mtrl-addons imports: `import { createList } from 'mtrl/components/list'`
   - Extends mtrl components with advanced features
   - Maintains compatibility with mtrl APIs

2. **Showcased in mtrl-app**
   - mtrl-app imports: `import { createButton } from 'mtrl/components/button'`
   - Creates interactive demonstrations
   - Documents usage patterns and APIs

## 🎯 Package Purpose

mtrl is a lightweight TypeScript component library that implements Material Design 3 with pure functional composition:

- **Zero dependencies** - Pure TypeScript/JavaScript implementation
- **Material Design 3** - Complete MD3 specification compliance
- **Functional composition** - Composable building blocks using pipe patterns
- **Performance focused** - Optimized for size, memory, and speed
- **Accessibility compliant** - Full WCAG and keyboard navigation support

## 🏗️ Architecture

### Core Structure

```
src/
├── components/          # Material Design 3 components
│   ├── button/         # Button component family
│   ├── textfield/      # Text input components
│   ├── list/           # List components
│   └── ...            # Other MD3 components
├── core/               # Core utilities and systems
│   ├── compose/        # Functional composition utilities
│   ├── dom/            # DOM manipulation utilities
│   ├── state/          # State management utilities
│   └── utils/          # General utilities
├── styles/             # SCSS styling system
│   ├── components/     # Component-specific styles
│   ├── themes/         # Material Design 3 themes
│   └── abstract/       # Mixins and variables
└── constants.ts        # Package constants
```

### Key Systems

**Component System (`src/components/`)**

- Material Design 3 component implementations
- Functional composition patterns
- Consistent API design
- Accessibility compliance

**Core System (`src/core/`)**

- Compose utilities for functional composition
- DOM utilities for element manipulation
- State management for component state
- Utility functions for common operations

**Styling System (`src/styles/`)**

- SCSS-based styling architecture
- BEM naming conventions
- Material Design 3 tokens
- Theme system implementation

## 🛠️ Development Guidelines

### Component Development

Follow established component patterns:

```typescript
// src/components/example/example.ts
import { pipe } from "../../core/compose";
import { createBaseComponent } from "../shared";
import { ExampleConfig } from "./types";

export const createExample = (config: ExampleConfig) => {
  return pipe(
    createBaseComponent("example"),
    applyExampleFeatures(config),
    applyExampleStyles(config),
    applyExampleBehavior(config)
  );
};
```

### Component Structure

Each component follows this structure:

```
component/
├── index.ts           # Main export
├── api.ts             # Public API
├── config.ts          # Configuration
├── constants.ts       # Component constants
├── features.ts        # Feature implementations
├── types.ts           # TypeScript definitions
└── component.ts       # Core component logic
```

### Functional Composition

Use pipe patterns for component composition:

```typescript
// Core composition pattern
import { pipe } from "../../core/compose";

const createComponentWithFeatures = (config: Config) => {
  return pipe(
    createBaseElement(config.tag),
    applyBaseStyles(config),
    applyFeatureA(config.featureA),
    applyFeatureB(config.featureB),
    applyEventHandlers(config.events)
  );
};
```

### SCSS Architecture

Follow BEM naming conventions:

```scss
// src/styles/components/_button.scss
.mtrl-button {
  // Base button styles

  &__icon {
    // Button icon element
  }

  &--filled {
    // Filled variant modifier
  }

  &--outlined {
    // Outlined variant modifier
  }
}
```

### TypeScript Standards

- **Comprehensive types** - Define interfaces for all configurations
- **Generic utilities** - Create reusable type utilities
- **Strict typing** - Enable strict TypeScript settings
- **JSDoc comments** - Document all public APIs

```typescript
// Example TypeScript patterns
interface ButtonConfig {
  variant: "filled" | "outlined" | "text";
  size: "small" | "medium" | "large";
  disabled?: boolean;
  icon?: string;
  text?: string;
}

/**
 * Creates a Material Design 3 button component
 * @param config - Button configuration options
 * @returns HTMLButtonElement with Material Design 3 styling
 */
export const createButton = (config: ButtonConfig): HTMLButtonElement => {
  // Implementation
};
```

## 🧪 Testing Strategy

### Test Structure

Use Bun test runner with JSDOM:

```typescript
// test/components/button.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { JSDOM } from "jsdom";
import { createButton } from "../../src/components/button";

describe("Button Component", () => {
  beforeEach(() => {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
    global.document = dom.window.document;
    global.window = dom.window as any;
  });

  it("should create button with correct variant", () => {
    const button = createButton({ variant: "filled", text: "Click me" });
    expect(button.classList.contains("mtrl-button--filled")).toBe(true);
  });
});
```

### Testing Guidelines

- **Component testing** - Test component creation and configuration
- **Feature testing** - Test individual component features
- **Integration testing** - Test component interactions
- **Accessibility testing** - Verify WCAG compliance
- **Performance testing** - Measure component performance

### Mock Patterns

Mock components to avoid circular dependencies:

```typescript
// test/utils/mocks.ts
export const mockButton = {
  create: (config: any) => {
    const element = document.createElement("button");
    element.textContent = config.text || "Mock Button";
    return element;
  },
};
```

## 🎨 Styling System

### SCSS Architecture

```scss
// src/styles/main.scss
@use "abstract/variables";
@use "abstract/mixins";
@use "base/reset";
@use "themes/material-you";

// Component imports
@use "components/button";
@use "components/textfield";
@use "components/list";
```

### Theme System

Material Design 3 theme implementation:

```scss
// src/styles/themes/_material-you.scss
:root {
  // Primary colors
  --mtrl-primary: #6750a4;
  --mtrl-on-primary: #ffffff;
  --mtrl-primary-container: #eaddff;

  // Surface colors
  --mtrl-surface: #fffbfe;
  --mtrl-on-surface: #1c1b1f;
  --mtrl-surface-variant: #e7e0ec;
}

[data-theme="dark"] {
  --mtrl-primary: #d0bcff;
  --mtrl-on-primary: #381e72;
  --mtrl-primary-container: #4f378b;

  --mtrl-surface: #1c1b1f;
  --mtrl-on-surface: #e6e1e5;
  --mtrl-surface-variant: #49454f;
}
```

### BEM Conventions

```scss
// Component BEM structure
.mtrl-component {
  // Block: base component

  &__element {
    // Element: component part
  }

  &--modifier {
    // Modifier: variant/state
  }

  &__element--modifier {
    // Element with modifier
  }
}
```

## 🚀 Common Development Tasks

### Adding New Component

1. **Create component directory**

   ```
   src/components/new-component/
   ├── index.ts
   ├── api.ts
   ├── config.ts
   ├── constants.ts
   ├── features.ts
   ├── types.ts
   └── new-component.ts
   ```

2. **Define component types**

   ```typescript
   // types.ts
   export interface NewComponentConfig {
     variant: "primary" | "secondary";
     size: "small" | "medium" | "large";
     disabled?: boolean;
   }
   ```

3. **Implement component**

   ```typescript
   // new-component.ts
   import { pipe } from "../../core/compose";
   import { NewComponentConfig } from "./types";

   export const createNewComponent = (config: NewComponentConfig) => {
     return pipe(
       createBaseElement("div"),
       applyBaseStyles(config),
       applyVariantStyles(config),
       applyInteractiveFeatures(config)
     );
   };
   ```

4. **Add component styles**

   ```scss
   // src/styles/components/_new-component.scss
   .mtrl-new-component {
     // Base styles

     &--primary {
       // Primary variant
     }

     &--secondary {
       // Secondary variant
     }
   }
   ```

5. **Create tests**

   ```typescript
   // test/components/new-component.test.ts
   import { describe, it, expect } from "bun:test";
   import { createNewComponent } from "../../src/components/new-component";

   describe("NewComponent", () => {
     it("should create component with correct configuration", () => {
       const component = createNewComponent({
         variant: "primary",
         size: "medium",
       });
       expect(component.classList.contains("mtrl-new-component--primary")).toBe(
         true
       );
     });
   });
   ```

### Extending Existing Component

1. **Add new feature**

   ```typescript
   // src/components/button/features.ts
   export const applyNewFeature =
     (config: NewFeatureConfig) => (element: HTMLElement) => {
       // Feature implementation
       return element;
     };
   ```

2. **Update component config**

   ```typescript
   // src/components/button/types.ts
   export interface ButtonConfig {
     // ... existing config
     newFeature?: NewFeatureConfig;
   }
   ```

3. **Add feature to composition**

   ```typescript
   // src/components/button/button.ts
   export const createButton = (config: ButtonConfig) => {
     return pipe(
       createBaseElement("button"),
       applyBaseStyles(config),
       applyVariantStyles(config),
       config.newFeature && applyNewFeature(config.newFeature),
       applyEventHandlers(config)
     ).filter(Boolean);
   };
   ```

### Performance Optimization

1. **Optimize component creation**

   ```typescript
   // Use object pooling for frequently created components
   const buttonPool = new Map<string, HTMLButtonElement>();

   export const createOptimizedButton = (config: ButtonConfig) => {
     const key = JSON.stringify(config);

     if (buttonPool.has(key)) {
       return buttonPool.get(key)!.cloneNode(true) as HTMLButtonElement;
     }

     const button = createButton(config);
     buttonPool.set(key, button);
     return button;
   };
   ```

2. **Lazy load component features**

   ```typescript
   // Lazy load expensive features
   export const createButtonWithLazyFeatures = async (config: ButtonConfig) => {
     const button = createBaseButton(config);

     if (config.advancedFeature) {
       const { applyAdvancedFeature } = await import("./advanced-features");
       applyAdvancedFeature(config.advancedFeature)(button);
     }

     return button;
   };
   ```

## 🔧 Build System

### Build Commands

- `bun run build` - Build mtrl package
- `bun run test` - Run all tests
- `bun run test:components` - Run component tests
- `bun run test:core` - Run core tests

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["test/**/*", "dist/**/*"]
}
```

### Package Configuration

```json
{
  "name": "mtrl",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./components/*": {
      "import": "./dist/components/*/index.js",
      "require": "./dist/components/*/index.cjs"
    }
  }
}
```

## 🐛 Common Issues & Solutions

### Component Issues

- **Component not rendering** - Check element creation and DOM insertion
- **Styles not applying** - Verify SCSS compilation and CSS class application
- **Events not working** - Check event handler attachment and cleanup

### TypeScript Issues

- **Type errors** - Ensure all types are properly defined and exported
- **Import errors** - Check module resolution and export paths
- **Generic issues** - Verify generic type constraints and usage

### Performance Issues

- **Memory leaks** - Ensure proper cleanup of event listeners and references
- **Slow rendering** - Optimize component creation and style application
- **Large bundle size** - Review imports and enable tree-shaking

## 📚 Key Files Reference

### Core Architecture

- `src/index.ts` - Main package entry point
- `src/constants.ts` - Package constants and configuration
- `src/core/index.ts` - Core utilities export

### Component System

- `src/components/index.ts` - Component exports
- `src/components/shared/` - Shared component utilities
- `src/components/*/index.ts` - Individual component exports

### Core Utilities

- `src/core/compose/` - Functional composition utilities
- `src/core/dom/` - DOM manipulation utilities
- `src/core/state/` - State management utilities
- `src/core/utils/` - General utility functions

### Styling System

- `src/styles/main.scss` - Main SCSS entry point
- `src/styles/components/` - Component-specific styles
- `src/styles/themes/` - Material Design 3 themes
- `src/styles/abstract/` - SCSS mixins and variables

### Testing

- `test/setup.ts` - Test environment setup
- `test/components/` - Component tests
- `test/core/` - Core utility tests
- `test/utils/` - Test utilities and helpers

## 🎯 Material Design 3 Compliance

### Design Tokens

Implement complete Material Design 3 token system:

```scss
// Color tokens
--mtrl-primary: #6750a4;
--mtrl-on-primary: #ffffff;
--mtrl-primary-container: #eaddff;
--mtrl-on-primary-container: #21005d;

// Typography tokens
--mtrl-display-large: 400 57px/64px "Roboto", sans-serif;
--mtrl-display-medium: 400 45px/52px "Roboto", sans-serif;
--mtrl-display-small: 400 36px/44px "Roboto", sans-serif;

// Shape tokens
--mtrl-corner-extra-small: 4px;
--mtrl-corner-small: 8px;
--mtrl-corner-medium: 12px;
--mtrl-corner-large: 16px;
```

### Component Specifications

Follow Material Design 3 specifications exactly:

- **Button** - Height: 40px, Corner radius: 20px, Padding: 24px
- **Text Field** - Height: 56px, Corner radius: 4px, Border: 1px
- **List Item** - Height: 56px, Padding: 16px, Corner radius: 0px

### Accessibility Requirements

- **Keyboard navigation** - All interactive elements accessible via keyboard
- **Screen reader support** - Proper ARIA labels and roles
- **Color contrast** - Minimum 4.5:1 contrast ratio
- **Touch targets** - Minimum 44x44px touch targets

## 🔍 Advanced Patterns

### Composition Patterns

```typescript
// Feature composition
const createAdvancedButton = (config: AdvancedButtonConfig) => {
  return pipe(
    createBaseButton(config),
    config.ripple && applyRippleEffect(config.ripple),
    config.elevation && applyElevation(config.elevation),
    config.animation && applyAnimation(config.animation),
    config.accessibility && applyAccessibility(config.accessibility)
  );
};

// Conditional composition
const createConditionalButton = (config: ConditionalConfig) => {
  const features = [
    createBaseButton(config),
    config.variant === "filled" && applyFilledStyles(config),
    config.variant === "outlined" && applyOutlinedStyles(config),
    config.disabled && applyDisabledState(config),
    config.loading && applyLoadingState(config),
  ].filter(Boolean);

  return pipe(...features);
};
```

### State Management

```typescript
// Component state management
export const createStatefulButton = (config: StatefulButtonConfig) => {
  const state = createState({
    pressed: false,
    hovered: false,
    focused: false,
    disabled: config.disabled || false,
  });

  const button = pipe(
    createBaseButton(config),
    applyStateStyles(state),
    applyStateEvents(state)
  );

  return { button, state };
};
```

### Performance Optimization

```typescript
// Memoization for expensive operations
const memoizedStyleCalculation = memoize((config: StyleConfig) => {
  return calculateComplexStyles(config);
});

// Efficient event handling
const createOptimizedEventHandler = (handlers: EventHandlers) => {
  const eventMap = new Map();

  return (event: Event) => {
    const handler = eventMap.get(event.type) || handlers[event.type];
    if (handler) {
      eventMap.set(event.type, handler);
      handler(event);
    }
  };
};
```
