# Testing MTRL Components

This document provides guidelines for writing and running tests for the MTRL library. We use Bun's built-in test runner for fast, efficient testing.

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode (re-runs tests when files change)
bun test --watch

# Run tests with coverage report
bun test --coverage

# Run tests with UI
bun test --watch --ui

# Run specific test file or pattern
bun test test/components/button.test.ts
```

## Test Structure

Tests are organized to mirror the source code structure:

```
test/
├── setup.ts                # Global test setup and DOM mocking
├── components/             # Component tests
│   ├── button.test.ts
│   ├── textfield.test.ts
│   └── ...
└── core/                   # Core functionality tests
    ├── dom.classes.test.ts
    ├── dom.attributes.test.ts
    ├── dom.events.test.ts
    ├── utils.normalize.test.ts
    ├── utils.object.test.ts
    ├── emitter.test.ts
    ├── ripple.test.ts
    └── state.store.test.ts
```

## Writing Tests

When writing tests for MTRL components, follow these guidelines:

### 1. Test Component Creation

Always verify that components are created correctly with default options:

```typescript
test('should create a component element', () => {
  const component = createComponent();
  expect(component.element).toBeDefined();
  expect(component.element.tagName).toBe('DIV');
  expect(component.element.className).toContain('mtrl-component');
});
```

### 2. Test Configuration Options

Test that configuration options properly affect the component:

```typescript
test('should apply variant class', () => {
  const variant = 'filled';
  const component = createComponent({
    variant
  });
  
  expect(component.element.className).toContain(`mtrl-component--${variant}`);
});
```

### 3. Test Events

Verify that events are properly emitted and handled:

```typescript
test('should handle click events', () => {
  const component = createComponent();
  const handleClick = mock(() => {});
  
  component.on('click', handleClick);
  
  // Simulate event
  const event = new Event('click');
  component.element.dispatchEvent(event);
  
  expect(handleClick).toHaveBeenCalled();
});
```

### 4. Test State Changes

Test component state changes through its API:

```typescript
test('should support disabled state', () => {
  const component = createComponent();
  
  // Initially not disabled
  expect(component.disabled.isDisabled()).toBe(false);
  
  // Disable
  component.disable();
  expect(component.disabled.isDisabled()).toBe(true);
  expect(component.element.classList.contains('mtrl-component--disabled')).toBe(true);
  
  // Enable
  component.enable();
  expect(component.disabled.isDisabled()).toBe(false);
  expect(component.element.classList.contains('mtrl-component--disabled')).toBe(false);
});
```

## JSDOM Setup

We use JSDOM to create a DOM environment for component tests. Each test file that requires DOM manipulation should include the proper JSDOM setup:

```typescript
// Setup jsdom environment
let dom: JSDOM;
let window: Window;
let document: Document;
let originalGlobalDocument: any;
let originalGlobalWindow: any;

beforeAll(() => {
  // Create a new JSDOM instance
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true
  });
  
  // Get window and document from jsdom
  window = dom.window;
  document = window.document;
  
  // Store original globals
  originalGlobalDocument = global.document;
  originalGlobalWindow = global.window;
  
  // Set globals to use jsdom
  global.document = document;
  global.window = window;
  global.Element = window.Element;
  global.HTMLElement = window.HTMLElement;
  global.Event = window.Event;
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  
  // Clean up jsdom
  window.close();
});
```

## Component Testing Approach

For most component tests, we use a mock implementation approach that creates components with the same interface as the real components, but with simplified internals. This approach:

1. Avoids circular dependency issues in tests
2. Makes tests faster and more isolated
3. Allows testing component interfaces without implementation details
4. Provides better control over the test environment

A typical mock component setup might look like:

```typescript
const createMockComponent = (config: ComponentConfig = {}): ComponentInterface => {
  // Create base elements
  const element = document.createElement('div');
  element.className = 'mtrl-component';
  
  // Apply configuration
  if (config.variant) {
    element.classList.add(`mtrl-component--${config.variant}`);
  }
  
  // Event tracking
  const eventHandlers: Record<string, Function[]> = {};
  
  // Return component interface
  return {
    element,
    
    // Component methods matching the real component API
    setValue(value: string) {
      element.setAttribute('value', value);
      return this;
    },
    
    getValue() {
      return element.getAttribute('value') || '';
    },
    
    on(event: string, handler: Function) {
      if (!eventHandlers[event]) eventHandlers[event] = [];
      eventHandlers[event].push(handler);
      element.addEventListener(event, handler as EventListener);
      return this;
    },
    
    // Additional methods as needed...
  };
};
```