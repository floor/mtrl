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
bun test test/components/button.test.js
```

## Test Structure

Tests are organized to mirror the source code structure:

```
test/
├── setup.js                # Global test setup and DOM mocking
├── components/             # Component tests
│   ├── button.test.js
│   ├── textfield.test.js
│   └── ...
└── core/                   # Core functionality tests
    ├── build/
    │   └── ripple.test.js
    ├── dom/
    │   └── ...
    └── state/
        └── emitter.test.js
```

## Writing Tests

When writing tests for MTRL components, follow these guidelines:

### 1. Test Component Creation

Always verify that components are created correctly with default options:

```javascript
test('should create a component element', () => {
  const component = createComponent();
  expect(component.element).toBeDefined();
  expect(component.element.tagName).toBe('DIV');
  expect(component.element.className).toContain('mtrl-component');
});
```

### 2. Test Configuration Options

Test that configuration options properly affect the component:

```javascript
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

```javascript
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

```javascript
test('should support disabled state', () => {
  const component = createComponent();
  
  // Initially not disabled
  expect(component.element.has