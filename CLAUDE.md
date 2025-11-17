# mtrl - Material Design 3 Component Library

## Project Overview

mtrl is a lightweight TypeScript component library implementing Material Design 3 with pure functional composition. It delivers the complete MD3 specification through carefully crafted, composable building blocks with zero dependencies, embodying the "less is more" philosophy without sacrificing functionality or design fidelity.

**Key Details:**
- License: MIT
- Language: TypeScript (strict mode)
- Runtime: Bun (native TypeScript execution)
- Dependencies: Zero - pure TypeScript/JavaScript
- Framework: Agnostic - works with any JavaScript framework or vanilla JS
- Repository: Part of Radiooooo ecosystem

## Architecture

### Package Ecosystem

mtrl is part of a multi-package ecosystem:

```
mtrl ecosystem/
├── mtrl/              # Core Material Design 3 components (this package)
├── mtrl-addons/       # Extended components and advanced features
└── mtrl-app/          # Documentation hub and interactive showcase
```

**Package Relationships:**
```
mtrl (Foundation)
    ↑
    ├── mtrl-addons (Extensions)
    │   ├── Depends on mtrl components
    │   ├── Provides advanced features (virtual scrolling, collections)
    │   └── Performance optimizations
    │
    └── mtrl-app (Documentation)
        ├── Uses mtrl components for demonstrations
        ├── Documents mtrl and mtrl-addons
        └── Interactive showcases and examples
```

**Development Environment Recommendation:**
Clone related packages as siblings for easier cross-package development:
```
~/Code/
├── mtrl/              # This package
├── mtrl-addons/       # Extended components
└── mtrl-app/          # Documentation and showcase
```

### Package Structure

```
mtrl/
├── src/
│   ├── components/          # Material Design 3 components
│   │   ├── button/         # Button component family
│   │   ├── textfield/      # Text input components
│   │   ├── list/           # List components
│   │   ├── dialog/         # Dialog components
│   │   ├── tabs/           # Tabs components
│   │   ├── menu/           # Menu components
│   │   ├── snackbar/       # Snackbar components
│   │   ├── fab/            # Floating action button
│   │   ├── checkbox/       # Checkbox components
│   │   ├── switch/         # Switch components
│   │   ├── slider/         # Slider components
│   │   └── ...             # 30+ MD3 components total
│   ├── core/               # Core utilities and systems
│   │   ├── compose/        # Functional composition utilities
│   │   ├── dom/            # DOM manipulation utilities
│   │   ├── state/          # State management utilities
│   │   ├── utils/          # General utilities
│   │   ├── canvas/         # Canvas drawing and animation utilities
│   │   └── config/         # Component and global configuration
│   ├── styles/             # SCSS styling system
│   │   ├── components/     # Component-specific styles
│   │   ├── themes/         # Material Design 3 themes
│   │   ├── abstract/       # Mixins and variables
│   │   ├── base/           # Base styles and resets
│   │   ├── utilities/      # Utility classes
│   │   └── main.scss       # Main SCSS entry point
│   └── constants.ts        # Package constants
├── test/                   # Bun test suite
│   ├── components/         # Component tests
│   ├── core/               # Core utility tests
│   ├── benchmarks/         # Performance benchmarks
│   ├── performance/        # Performance tests
│   ├── svg/                # SVG-related tests
│   ├── types/              # TypeScript type tests
│   ├── utils/              # Test utilities and helpers
│   └── setup.ts            # Test environment setup
├── dist/                   # Built package (gitignored)
└── package.json
```

## Technology Stack

### Core
- **Language**: TypeScript (strict mode enabled)
- **Runtime**: Bun (native TypeScript execution, built-in test runner)
- **Build Tool**: Bun
- **Test Framework**: Bun's built-in test runner
- **DOM Testing**: JSDOM

### Styling
- **Preprocessor**: Sass/SCSS
- **Architecture**: BEM methodology
- **Theming**: CSS custom properties
- **Design System**: Material Design 3

### Package Distribution
- **Module Format**: ES Modules + CommonJS
- **TypeScript**: Full type definitions included
- **Tree-shaking**: Optimized for modern bundlers

## Development Philosophy

### Core Principles

1. **"Less is More"** - Minimalist but complete implementation
2. **Zero Dependencies** - Pure TypeScript/JavaScript, no external libraries
3. **Performance First** - Optimize for size, memory usage, and speed
4. **Functional Composition** - Composable building blocks using pipe patterns
5. **Accessibility Compliance** - Full WCAG and keyboard navigation support
6. **Material Design Fidelity** - Accurate implementation of MD3 specification

### Design Decisions

- **Why Functional Composition?** Small, reusable, composable, tree-shakeable
- **Why Zero Dependencies?** Minimal bundle size, no version conflicts, full control
- **Why TypeScript Strict?** Type safety, better DX, fewer runtime errors
- **Why Bun?** Fast builds, native TypeScript, built-in test runner
- **Why BEM?** Predictable CSS, no specificity wars, clear component structure

## Development Setup

### 🚫 CRITICAL - Git Commit and Push Rules

**ABSOLUTE PROHIBITIONS:**
- ❌ **NEVER commit before testing** - Always test changes first
- ❌ **NEVER commit without explicit user permission** - Even if changes are tested
- ❌ **NEVER push to remote without explicit user permission** - Even after committing
- ❌ **NEVER run `git commit` automatically** - Always ask first
- ❌ **NEVER run `git push` automatically** - Always ask first
- ❌ **NEVER assume user wants changes committed** - Testing does not mean committing
- ❌ **NEVER assume user wants changes pushed** - Committing does not mean pushing
- ❌ **NEVER create markdown files without asking first** - No .md files without permission

**MANDATORY WORKFLOW:**
1. ✅ Make changes to files
2. ✅ Test the changes thoroughly (`bun test`)
3. ✅ Run type checking (`bun run typecheck`)
4. ✅ Build the package (`bun run build`)
5. ✅ Show `git status` and `git diff` to user
6. ✅ **STOP and ASK**: "Should I commit these changes?"
7. ✅ Wait for explicit "yes" or "commit" from user
8. ✅ Only then run `git commit`
9. ✅ **STOP and ASK**: "Should I push to remote?"
10. ✅ Wait for explicit "yes" or "push" from user
11. ✅ Only then run `git push`

### Initial Setup

```bash
# Clone repository
git clone <repository-url> mtrl
cd mtrl

# Install dependencies
bun install

# Build package
bun run build

# Run tests
bun test

# Type check
bun run typecheck
```

### Key Commands

```bash
# Development
bun run dev                # Development mode with watch
bun run build              # Build package for distribution
bun run typecheck          # TypeScript type checking

# Testing
bun test                   # Run all tests
bun test --watch          # Watch mode for tests
bun test <pattern>        # Run specific test files

# Quality
bun run lint              # Check code style
bun run lint:fix          # Fix code style issues

# Package
bun run pack              # Create package tarball for testing
```

## Coding Standards

### TypeScript Best Practices

**Type Safety (CRITICAL):**
- **Strict mode enabled** - All type checking rules active
- **NEVER use `any` type** - Always use proper interfaces or `unknown`
- **Create interfaces** for all data structures
- **Explicit return types** on all functions
- **Type all function parameters**
- **Use `unknown` for truly unknown data** - Then narrow with type guards

**Example:**
```typescript
// ✅ GOOD - Proper types
interface ButtonConfig {
  variant?: 'filled' | 'outlined' | 'text'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}

function createButton(config: ButtonConfig): HTMLElement {
  // typed parameter and return
}

// ❌ BAD - Using any
function createButton(config: any): any {  // NEVER DO THIS
  return config
}
```

### Component Structure

**Standard Component File Structure:**
```typescript
// src/components/button/button.ts

// 1. Imports
import { pipe } from '../../core/compose'
import { createElement } from '../../core/dom'

// 2. Types
interface ButtonConfig {
  variant?: 'filled' | 'outlined' | 'text'
  text?: string
  disabled?: boolean
}

// 3. Constants
const DEFAULTS: ButtonConfig = {
  variant: 'filled',
  disabled: false
}

// 4. Features (composable functions)
const applyVariant = (config: ButtonConfig) => (element: HTMLElement): HTMLElement => {
  element.classList.add(`mtrl-button--${config.variant}`)
  return element
}

const applyDisabled = (config: ButtonConfig) => (element: HTMLElement): HTMLElement => {
  if (config.disabled) {
    element.setAttribute('disabled', '')
  }
  return element
}

// 5. Main creator function
export const createButton = (config: ButtonConfig = {}): HTMLElement => {
  const finalConfig = { ...DEFAULTS, ...config }

  return pipe(
    createElement('button', { class: 'mtrl-button' }),
    applyVariant(finalConfig),
    applyDisabled(finalConfig)
  )
}
```

### Functional Composition

**Use Pipe Pattern:**
```typescript
import { pipe } from '../core/compose'

// Compose features using pipe
const createComponentWithFeatures = (config: Config): HTMLElement => {
  return pipe(
    createElement('div'),
    applyFeature1(config),
    applyFeature2(config),
    applyFeature3(config)
  )
}
```

**Benefits:**
- Declarative and readable
- Easy to add/remove features
- Testable in isolation
- Reusable across components

### SCSS Architecture

**File Structure:**
```scss
// src/styles/components/button.scss

// 1. Component variables
$button-padding: 0.75rem 1.5rem;
$button-border-radius: 0.25rem;

// 2. Base component
.mtrl-button {
  padding: $button-padding;
  border-radius: $button-border-radius;

  // 3. Modifiers
  &--filled {
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }

  &--outlined {
    border: 1px solid var(--md-sys-color-outline);
    color: var(--md-sys-color-primary);
  }

  // 4. States
  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }
}
```

**BEM Naming Convention:**
- Block: `.mtrl-component`
- Element: `.mtrl-component__element`
- Modifier: `.mtrl-component--modifier`
- State: `.mtrl-component.is-active`

**Theme Integration:**
- Use CSS custom properties for colors
- Follow Material Design 3 token naming
- Support light and dark themes
- Never hardcode colors

### File Management

**Preferences:**
- Prefer editing existing files over creating new ones
- Avoid hyphens in filenames if possible
- Prefer short filenames if clear enough
- No HTML test files or standalone .js/.html files
- No summary .md files for coding sessions
- Use `debugging/` folder for temporary test files (gitignored)

**File Naming:**
- Components: `button.ts`, `textfield.ts`
- Tests: `button.test.ts`, `textfield.test.ts`
- Styles: `button.scss`, `textfield.scss`
- Types: `types.ts` (per component folder)

## Testing Strategy

### Test Structure

```typescript
// test/components/button.test.ts
import { describe, it, expect, beforeEach } from 'bun:test'
import { JSDOM } from 'jsdom'
import { createButton } from '../../src/components/button'

describe('Button Component', () => {
  let dom: JSDOM

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><body></body>')
    global.document = dom.window.document as any
    global.HTMLElement = dom.window.HTMLElement as any
  })

  it('should create button with correct variant', () => {
    const button = createButton({ variant: 'filled' })

    expect(button.classList.contains('mtrl-button')).toBe(true)
    expect(button.classList.contains('mtrl-button--filled')).toBe(true)
  })

  it('should handle disabled state', () => {
    const button = createButton({ disabled: true })

    expect(button.hasAttribute('disabled')).toBe(true)
  })
})
```

### Testing Guidelines

1. **Use Bun test runner** - Native TypeScript support, fast execution
2. **Use JSDOM** - For DOM testing in Node environment
3. **Mock components** - Avoid circular dependencies
4. **Test public APIs** - Focus on component behavior
5. **Test-driven development** - Write tests first when possible
6. **Comprehensive but lightweight** - Cover edge cases without over-testing

### Mock Patterns

```typescript
// test/mocks/button.mock.ts
export const mockButton = {
  create: (overrides = {}) => {
    const element = document.createElement('button')
    element.classList.add('mtrl-button')
    return element
  }
}
```

## Material Design 3 Compliance

### Design Tokens

**Color System:**
- Primary, Secondary, Tertiary color roles
- Error, Warning, Success states
- Surface and background variants
- Neutral and neutral-variant tones

**Typography Scale:**
- Display (Large, Medium, Small)
- Headline (Large, Medium, Small)
- Title (Large, Medium, Small)
- Body (Large, Medium, Small)
- Label (Large, Medium, Small)

**Elevation:**
- Level 0-5 elevation system
- Shadow definitions per level
- Overlay opacity for each level

**Motion:**
- Duration tokens (short, medium, long, extra-long)
- Easing curves (standard, emphasized, decelerated)
- Transition patterns for enter/exit/shared

### Component Specifications

**Each component must implement:**
1. All MD3 variants and states
2. Proper elevation and shadow
3. Correct color token usage
4. Typography scale adherence
5. Motion and interaction patterns
6. Accessibility requirements (ARIA, keyboard, focus)

### Accessibility Requirements

**WCAG Compliance:**
- Color contrast ratios (4.5:1 for text, 3:1 for UI)
- Touch target size (48x48px minimum)
- Focus indicators (visible and clear)
- Keyboard navigation (Tab, Enter, Space, Arrows)
- Screen reader support (ARIA labels, roles, states)

## Showcase & Documentation

### Documentation Location

**❌ Do NOT create documentation in mtrl package**
- No README files for features
- No .md files for components
- No inline documentation beyond JSDoc

**✅ DO create documentation in mtrl-app:**
- `mtrl-app/client/content/components/` - Component showcases
- `mtrl-app/docs/` - Architecture and usage guides
- Interactive demonstrations with live code examples

### Creating Showcases

**Always use layout system:**
```typescript
// In mtrl-app, not in mtrl
import { createButton } from 'mtrl/components/button'

const buttonShowcase = [
  [Button, { variant: 'filled', text: 'Filled Button' }],
  [Button, { variant: 'outlined', text: 'Outlined Button' }],
  [Button, { variant: 'text', text: 'Text Button' }]
]
```

**Showcase Guidelines:**
- Use array-based layout schema
- Follow formatting conventions
- Demonstrate all variants and states
- Show accessibility features
- Provide code examples
- Never inline CSS

## Build System

### Build Configuration

**Package Exports:**
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
      "import": "./dist/components/*.js",
      "require": "./dist/components/*.cjs"
    }
  }
}
```

### TypeScript Configuration

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["test", "dist"]
}
```

### Build Commands

```bash
# Development build
bun run build

# Production build (optimized)
bun run build:prod

# Watch mode
bun run dev

# Type checking only
bun run typecheck
```

## Performance Optimization

### Bundle Size

**Target Metrics:**
- Core utilities: < 5KB gzipped
- Individual components: < 3KB gzipped
- Full package: < 50KB gzipped
- Tree-shaking: Import only what you use

**Optimization Strategies:**
- No external dependencies
- Functional composition (tree-shakeable)
- Small, focused modules
- Efficient DOM operations
- Minimal abstraction layers

### Runtime Performance

**Best Practices:**
- Avoid unnecessary re-renders
- Use event delegation where appropriate
- Minimize DOM queries
- Cache computed values
- Use requestAnimationFrame for animations

**Example:**
```typescript
// ✅ Good - Efficient
const memoizedStyleCalculation = (() => {
  const cache = new Map()
  return (key: string, compute: () => string): string => {
    if (!cache.has(key)) {
      cache.set(key, compute())
    }
    return cache.get(key)!
  }
})()

// ❌ Bad - Recomputes every time
const computeStyle = (key: string): string => {
  return expensiveCalculation(key)
}
```

## Common Development Tasks

### Adding New Component

**1. Create component structure:**
```bash
mkdir -p src/components/newcomponent
touch src/components/newcomponent/newcomponent.ts
touch src/components/newcomponent/index.ts
touch src/components/newcomponent/types.ts
```

**2. Implement component:**
```typescript
// src/components/newcomponent/newcomponent.ts
import { pipe } from '../../core/compose'
import { createElement } from '../../core/dom'
import type { NewComponentConfig } from './types'

export const createNewComponent = (config: NewComponentConfig): HTMLElement => {
  return pipe(
    createElement('div', { class: 'mtrl-newcomponent' }),
    applyFeature1(config),
    applyFeature2(config)
  )
}
```

**3. Add styles:**
```scss
// src/styles/components/newcomponent.scss
.mtrl-newcomponent {
  // Component styles
}
```

**4. Write tests:**
```typescript
// test/components/newcomponent.test.ts
import { describe, it, expect } from 'bun:test'
import { createNewComponent } from '../../src/components/newcomponent'

describe('NewComponent', () => {
  it('should create component', () => {
    const component = createNewComponent({})
    expect(component).toBeDefined()
  })
})
```

**5. Export from index:**
```typescript
// src/components/newcomponent/index.ts
export { createNewComponent } from './newcomponent'
export type { NewComponentConfig } from './types'

// src/index.ts
export * from './components/newcomponent'
```

### Extending Existing Component

**Add new feature:**
```typescript
// Add to existing component file
const applyNewFeature = (config: Config) => (element: HTMLElement): HTMLElement => {
  // Feature implementation
  return element
}

// Update main creator
export const createComponent = (config: Config): HTMLElement => {
  return pipe(
    createElement('div'),
    applyExistingFeature(config),
    applyNewFeature(config)  // Add new feature
  )
}
```

### Performance Optimization

**Component pooling:**
```typescript
const componentPool = new Map<string, HTMLElement[]>()

const createOptimizedComponent = (config: Config): HTMLElement => {
  const key = JSON.stringify(config)

  if (componentPool.has(key) && componentPool.get(key)!.length > 0) {
    return componentPool.get(key)!.pop()!
  }

  return createComponent(config)
}
```

**Lazy feature loading:**
```typescript
const createComponentWithLazyFeatures = (config: Config): HTMLElement => {
  const element = createBaseComponent(config)

  // Load advanced features only when needed
  const applyAdvancedFeature = () => {
    if (!element.dataset.advancedLoaded) {
      advancedFeature(element)
      element.dataset.advancedLoaded = 'true'
    }
  }

  element.addEventListener('hover', applyAdvancedFeature, { once: true })
  return element
}
```

## Common Issues & Solutions

### Component Issues

**Issue:** Component not rendering
**Solution:** Check JSDOM setup in tests, ensure global document is set

**Issue:** Styles not applying
**Solution:** Verify SCSS import order, check BEM class names

**Issue:** TypeScript errors
**Solution:** Run `bun run typecheck`, check interface definitions

### Build Issues

**Issue:** Build fails with type errors
**Solution:** Ensure all imports have proper types, check tsconfig.json

**Issue:** Package exports not working
**Solution:** Verify package.json exports field, check module resolution

### Performance Issues

**Issue:** Large bundle size
**Solution:** Check for circular dependencies, ensure tree-shaking works

**Issue:** Slow runtime performance
**Solution:** Profile with DevTools, optimize hot paths, use memoization

## Advanced Patterns

### Composition Patterns

**Conditional composition:**
```typescript
const createConditionalComponent = (config: Config): HTMLElement => {
  const features = [
    config.feature1 && applyFeature1(config),
    config.feature2 && applyFeature2(config),
    config.feature3 && applyFeature3(config)
  ].filter(Boolean)

  return pipe(createElement('div'), ...features)
}
```

### State Management

**Simple state for components:**
```typescript
const createStatefulComponent = (config: Config): HTMLElement => {
  const state = {
    pressed: false,
    hovered: false,
    focused: false
  }

  const element = pipe(
    createElement('button'),
    applyStateHandlers(state),
    applyStateClasses(state)
  )

  return element
}
```

## Related Packages

### mtrl-addons

**Purpose:** Extended components and advanced features
- Virtual scrolling
- Data grids and collections
- Advanced form components
- Performance optimizations

**Documentation:** `mtrl-addons/.cursorrules`

### mtrl-app

**Purpose:** Documentation hub and interactive showcase
- Component demonstrations
- Usage examples
- API documentation
- Interactive playground

**Documentation:** `mtrl-app/.cursorrules`

## Key Files Reference

### Core Architecture
- `src/core/compose/` - Functional composition utilities
- `src/core/dom/` - DOM manipulation helpers
- `src/core/state/` - State management utilities
- `src/core/utils/` - General utility functions
- `src/core/canvas/` - Canvas drawing and animation utilities
- `src/core/config/` - Component and global configuration system

### Component System
- `src/components/` - All Material Design 3 components
- `src/constants.ts` - Package-level constants
- `src/index.ts` - Main package entry point

### Styling System
- `src/styles/components/` - Component styles
- `src/styles/themes/` - Material Design 3 themes
- `src/styles/abstract/` - SCSS mixins and variables
- `src/styles/base/` - Base styles and resets
- `src/styles/utilities/` - Utility classes
- `src/styles/main.scss` - Main SCSS entry point

### Testing
- `test/setup.ts` - Test environment setup
- `test/components/` - Component tests
- `test/core/` - Core utility tests
- `test/benchmarks/` - Performance benchmarks
- `test/performance/` - Performance tests
- `test/svg/` - SVG-related tests
- `test/types/` - TypeScript type tests
- `test/utils/` - Test utilities and helpers

## Prohibited Actions

**❌ NEVER do these:**
- Use React or any framework (pure TypeScript/JavaScript only)
- Add external dependencies (zero dependencies policy)
- Create markdown documentation files in this package
- Hardcode CSS prefix in TypeScript or SCSS files
- Use `any` type in TypeScript
- Inline CSS in components or tests
- Compromise Material Design 3 specifications
- Enhance components while fixing bugs (stay focused)
- Run development servers (Bun/Node)
- Create workarounds or hacks

**✅ ALWAYS do these:**
- Write tests before implementing features
- Use TypeScript strict mode
- Follow BEM naming in SCSS
- Implement complete MD3 specifications
- Ensure accessibility compliance
- Ask before creating .md files
- Ask before committing changes
- Ask before pushing to remote

## Contributing

1. Follow all coding standards and guidelines
2. Write comprehensive tests
3. Ensure Material Design 3 compliance
4. Document in mtrl-app (not here)
5. Run type checking before committing
6. Ask for permission before git operations
7. Follow conventional commit format

## Conventional Commits

```bash
feat(component): add new button variant
fix(button): correct disabled state styling
refactor(core): optimize compose utility
perf(list): improve rendering performance
test(dialog): add accessibility tests
docs(readme): update installation guide
style(button): fix formatting
chore(deps): update bun version
```

---

**Remember:** This is a zero-dependency, performance-focused, Material Design 3 library. Every line of code matters. Stay minimal, stay fast, stay compliant. 🚀
