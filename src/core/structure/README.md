# Structure Module

A lightweight, flexible system for creating and managing DOM structures and component hierarchies.

## Overview

The Structure Module provides a declarative approach to building UI structures using either arrays or objects. It efficiently handles DOM operations, component instantiation, and lifecycle management in a bundle-optimized way.

## Features

- **Multiple Schema Formats** - Support for array-based, object-based, and HTML string schemas
- **Efficient DOM Operations** - Batched DOM manipulations with DocumentFragment
- **Component Management** - Easy access to component instances via consistent API
- **Optimized for Bundle Size** - Minimal footprint with maximum functionality
- **TypeScript Support** - Full type definitions for developer experience

## Basic Usage

### Array-based Structure

```javascript
import createStructure from 'core/structure';

const structure = createStructure([
  Button, 'submitButton', { text: 'Submit', variant: 'primary' },
  [
    Modal, 'confirmModal', { title: 'Confirm Action' },
    [
      Button, 'confirmButton', { text: 'Confirm' },
      Button, 'cancelButton', { text: 'Cancel' }
    ]
  ]
]);

// Access components
const submitButton = structure.get('submitButton');
const confirmModal = structure.get('confirmModal');

// Handle events
submitButton.on('click', () => confirmModal.show());
```

### Object-based Structure

```javascript
import createStructure from 'core/structure';

const structure = createStructure({
  element: {
    creator: createForm,
    options: { className: 'signup-form' },
    children: {
      nameField: {
        creator: createTextField,
        options: { label: 'Name', required: true }
      },
      emailField: {
        creator: createTextField,
        options: { label: 'Email', type: 'email', required: true }
      },
      submitButton: {
        creator: createButton,
        options: { text: 'Sign Up', variant: 'primary' }
      }
    }
  }
});

// Access components
const form = structure.element;
const nameField = structure.get('nameField');
const emailField = structure.get('emailField');
```

### HTML String Structure

```javascript
import createStructure from 'core/structure';

const structure = createStructure(`
  <div class="notification">
    <h3>Welcome!</h3>
    <p>Thank you for joining our platform.</p>
  </div>
`);

// Access the root element
const notification = structure.element;
document.body.appendChild(notification);
```

## API Reference

### Core Functions

#### `createStructure(schema, parentElement?)`

Creates a structure from a schema definition.

- **Parameters**:
  - `schema`: Array, object, HTML string, or function returning one of these
  - `parentElement` (optional): Parent element to attach the structure to
- **Returns**: Structure result object with components and utility methods

#### `processSchema(schema, parentElement?, level?)`

Low-level function for processing schemas directly.

- **Parameters**:
  - `schema`: Array or object schema
  - `parentElement` (optional): Parent element to attach to
  - `level` (optional): Current recursion level
- **Returns**: Structure result object

#### `createComponentInstance(Component, options?)`

Creates a component instance from a constructor or factory function.

- **Parameters**:
  - `Component`: Constructor or factory function
  - `options` (optional): Options to pass to the component
- **Returns**: Component instance

### Utility Functions

#### `isComponent(value)`

Checks if a value is a component-like object.

- **Parameters**:
  - `value`: Value to check
- **Returns**: Boolean indicating if the value is a component

#### `processClassNames(options)`

Processes class names in options to add prefixes.

- **Parameters**:
  - `options`: Element options containing className
- **Returns**: Updated options with prefixed classNames

#### `flattenStructure(structure)`

Flattens a nested structure for easier component access.

- **Parameters**:
  - `structure`: Structure object to flatten
- **Returns**: Flattened structure with components

### Result Object

The structure result object contains:

- `structure`: Raw structure object with all components
- `element`: Reference to the root element
- `component`: Flattened component map for easy access
- `get(name)`: Function to get a component by name
- `getAll()`: Function to get all components
- `destroy()`: Function to clean up the structure

## Integrating with Structure Manager

This module works well with the Structure Manager for advanced application structures:

```javascript
import createStructure from 'core/structure';
import createStructureManager from 'client/core/structure/structure-manager';

// Create application structure
const appStructure = createStructure([
  // Application components...
]);

// Create structure manager with the structure
const structureManager = createStructureManager({
  structure: appStructure.structure,
  structureAPI: appStructure
});

// Use structure manager API
structureManager.setContent('<h1>Welcome to the app</h1>');
structureManager.setPageTitle('Dashboard');
```

## Performance Considerations

### Schema Format Performance

**Array-based schemas** generally outperform object-based schemas:

- **Faster processing**: 15-30% faster for large structures
- **Lower memory usage**: Requires less memory without property names
- **Better bundle size**: More compact representation in code
- **Efficient iteration**: Arrays are optimized for sequential access

**Object-based schemas** excel in:

- **Readability**: More explicit structure with named properties
- **Maintainability**: Easier to understand complex nested structures
- **Self-documentation**: Property names describe the structure's purpose

**Recommendations**:
- For **performance-critical** applications, prefer array-based schemas
- For **complex, deeply nested** structures where maintainability is key, consider object-based schemas
- For the **best balance**, use array-based schemas for large structures and object-based for complex configurations

### General Optimization Tips

- Use DocumentFragment for batch DOM operations
- Create components only when needed
- Consider memoizing frequently created structures
- For large applications, lazy-load secondary structures

## Browser Compatibility

The Structure Module is compatible with all modern browsers (Chrome, Firefox, Safari, Edge).

## License

MIT