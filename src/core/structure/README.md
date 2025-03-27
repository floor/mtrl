# Structure Module

A lightweight, flexible system for creating and managing DOM structures and component hierarchies.

## Overview

The Structure Module provides a declarative approach to building UI structures using either arrays or objects. It efficiently handles DOM operations, component instantiation, and lifecycle management in a bundle-optimized way.

## Features

- **Multiple Schema Formats** - Support for array-based, object-based, and HTML string schemas
- **Efficient DOM Operations** - Batched DOM manipulations with DocumentFragment
- **Component Management** - Easy access to component instances via consistent API
- **Customizable Creation** - Control class prefixing and specify default creators
- **Optimized for Bundle Size** - Minimal footprint with maximum functionality
- **TypeScript Support** - Full type definitions for developer experience

## Basic Usage

### Array-based Structure

```javascript
import { createStructure, createButton, createDialog, createList, createListItem } from 'mtrl';

const structure = createStructure([
  // Root level contains primary components
  createButton, 'submitButton', { text: 'Submit', variant: 'primary' },
  
  // Dialog is a root component, not nested inside other elements
  createDialog, 'confirmDialog', { 
    title: 'Confirm Action',
    closeOnBackdrop: true,
    width: '350px' 
  }
]);

// Add content to the dialog separately
const dialogContent = createStructure([
  createList, 'actionsList', {},
  [
    createListItem, 'confirmAction', { text: 'Confirm', leading: 'check' },
    createListItem, 'cancelAction', { text: 'Cancel', leading: 'close' }
  ]
], structure.get('confirmDialog').contentElement);

// Access components
const submitButton = structure.get('submitButton');
const confirmDialog = structure.get('confirmDialog');

// Handle events
submitButton.on('click', () => confirmDialog.open());
```

### Object-based Structure

```javascript
import { createStructure, createTopAppBar, createNavigation, createList, createListItem, createTextfield, createButton } from 'mtrl';

const structure = createStructure({
  element: {
    creator: createTopAppBar,
    options: { 
      title: 'Profile Settings',
      variant: 'small' 
    },
    children: {
      navigation: {
        creator: createNavigation,
        options: { variant: 'drawer', persistent: true },
        children: {
          navList: {
            creator: createList,
            options: { interactive: true },
            children: {
              profileLink: {
                creator: createListItem,
                options: { text: 'Profile', leading: 'person' }
              },
              settingsLink: {
                creator: createListItem,
                options: { text: 'Settings', leading: 'settings' }
              },
              logoutLink: {
                creator: createListItem,
                options: { text: 'Logout', leading: 'logout' }
              }
            }
          }
        }
      },
      form: {
        creator: createElement,
        options: { tag: 'form', className: 'profile-form' },
        children: {
          nameField: {
            creator: createTextfield,
            options: { label: 'Full Name', required: true }
          },
          emailField: {
            creator: createTextfield,
            options: { label: 'Email', type: 'email', required: true }
          },
          saveButton: {
            creator: createButton,
            options: { text: 'Save Changes', variant: 'filled' }
          }
        }
      }
    }
  }
});

// Access components
const topAppBar = structure.element;
const nameField = structure.get('nameField');
const saveButton = structure.get('saveButton');

// Use the components
nameField.setValue('John Doe');
saveButton.on('click', () => console.log('Profile updated'));
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

### Using Options Parameter

### Using Options Parameter

```javascript
import { createStructure, createButton, createTextfield, createCard, createChip, createTopAppBar, createBottomAppBar } from 'mtrl';

// With default creator and disabled prefix
const formStructure = createStructure(
  [
    // Using string keys relies on the default creator
    'nameField', { label: 'Name', required: true },
    'emailField', { label: 'Email', type: 'email', required: true },
    'phoneField', { label: 'Phone', type: 'tel' },
    
    // Explicitly override the default creator
    createButton, 'submitButton', { text: 'Submit', variant: 'filled' }
  ],
  document.getElementById('form-container'),
  {
    creator: createTextfield, // Default creator for all elements without a specific constructor
    prefix: false // Disable automatic class prefixing
  }
);

// With theme options for a complete dashboard layout
const dashboardStructure = createStructure(
  [
    createTopAppBar, 'header', { 
      title: 'Dashboard', 
      actions: ['notifications', 'account'] 
    },
    
    createCard, 'statsCard', { 
      title: 'Performance Metrics',
      outlined: true 
    },
    [
      createChip, 'visitsChip', { text: 'Visits: 1.2K', leadingIcon: 'visibility' },
      createChip, 'conversionChip', { text: 'Conversion: 5.4%', leadingIcon: 'trending_up' }
    ],
    
    createCard, 'activityCard', { 
      title: 'Recent Activity',
      outlined: true
    },
    
    createBottomAppBar, 'footer', {
      actions: [
        { icon: 'home', label: 'Home' },
        { icon: 'search', label: 'Search' },
        { icon: 'settings', label: 'Settings' }
      ]
    }
  ],
  document.getElementById('app'),
  {
    theme: 'dark', // Custom theme option
    density: 'comfortable', // Custom density option
    animations: true // Custom animation option
  }
);

// Access and use the structure
const nameField = formStructure.get('nameField');
nameField.setValue('John Doe');

const statsCard = dashboardStructure.get('statsCard');
statsCard.setTitle('Updated Metrics - ' + new Date().toLocaleDateString());
```

## API Reference

### Core Functions

#### `createStructure(schema, parentElement?, options?)`

Creates a structure from a schema definition.

- **Parameters**:
  - `schema`: Array, object, HTML string, or function returning one of these
  - `parentElement` (optional): Parent element to attach the structure to
  - `options` (optional): Configuration options for structure creation:
    - `creator`: Default creator function to use when not specified in schema
    - `prefix`: Boolean to control whether CSS class prefixing is applied (default: true)
    - Custom options can be added and accessed in component creators
- **Returns**: Structure result object with components and utility methods

#### `processSchema(schema, parentElement?, level?, options?)`

Low-level function for processing schemas directly.

- **Parameters**:
  - `schema`: Array or object schema
  - `parentElement` (optional): Parent element to attach to
  - `level` (optional): Current recursion level
  - `options` (optional): Structure creation options
- **Returns**: Structure result object

#### `createComponentInstance(Component, options?, structureOptions?)`

Creates a component instance from a constructor or factory function.

- **Parameters**:
  - `Component`: Constructor or factory function
  - `options` (optional): Options to pass to the component
  - `structureOptions` (optional): Global structure options
- **Returns**: Component instance

### Utility Functions

#### `isComponent(value)`

Checks if a value is a component-like object.

- **Parameters**:
  - `value`: Value to check
- **Returns**: Boolean indicating if the value is a component

#### `processClassNames(options, skipPrefix?)`

Processes class names in options to add prefixes.

- **Parameters**:
  - `options`: Element options containing className
  - `skipPrefix` (optional): Whether to skip adding prefixes
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

### Options Performance Considerations

- Setting `prefix: false` can improve performance slightly by avoiding class name processing
- Providing a `creator` function in options is more efficient than having many duplicate creator references in the schema
- Consider memoizing structure creation for frequently used UI patterns with the same options

### General Optimization Tips

- Use DocumentFragment for batch DOM operations
- Create components only when needed
- Consider memoizing frequently created structures
- For large applications, lazy-load secondary structures

## Browser Compatibility

The Structure Module is compatible with all modern browsers (Chrome, Firefox, Safari, Edge).

## License

MIT