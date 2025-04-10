# Layout Module Documentation

## Overview

The Layout Module is a lightweight, flexible system for creating and managing visual arrangements and component hierarchies. It provides a declarative approach to building UI layouts using either arrays or objects, with efficient DOM operations, component instantiation, and visual arrangement.

## Features

- **Multiple Schema Formats** - Support for array-based, object-based, and HTML string schemas
- **Efficient DOM Operations** - Batched DOM manipulations with DocumentFragment
- **Component Management** - Easy access to component instances via consistent API
- **Layout System Integration** - Direct access to powerful CSS layout classes
- **Customizable Creation** - Control class prefixing and specify default creators
- **Optimized for Bundle Size** - Minimal footprint with maximum functionality
- **TypeScript Support** - Full type definitions for developer experience

## Installation

```bash
npm install mtrl
```

## Core Concepts

The Layout Module consists of several key parts:

1. **Schema Definition** - A declarative way to describe your layout
2. **Layout Processing** - Converting the schema into DOM elements
3. **Layout Configuration** - Setting up responsive layouts and grids
4. **Component Instance Management** - Accessing and controlling created components

## Basic Usage

### Array-based Layout

```javascript
import { createLayout, createButton, createDialog } from 'mtrl';

const layout = createLayout([
  // Root level contains primary components
  createButton, 'submitButton', { text: 'Submit', variant: 'primary' },
  
  // Dialog is a root component, not nested inside other elements
  createDialog, 'confirmDialog', { 
    title: 'Confirm Action',
    closeOnBackdrop: true,
    width: '350px' 
  }
]);

// Access components
const submitButton = layout.get('submitButton');
const confirmDialog = layout.get('confirmDialog');

// Handle events
submitButton.on('click', () => confirmDialog.open());
```

### Object-based Layout

```javascript
import { createLayout, createTopAppBar, createList, createListItem } from 'mtrl';

const layout = createLayout({
  element: {
    creator: createTopAppBar,
    options: { 
      title: 'Profile Settings',
      variant: 'small' 
    },
    children: {
      navigation: {
        creator: createNavigation,
        options: { 
          variant: 'drawer', 
          persistent: true,
          // CSS layout configuration
          layout: {
            type: 'stack',
            gap: 4,
            align: 'stretch'
          }
        },
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
              }
            }
          }
        }
      },
      content: {
        options: { 
          tag: 'main', 
          className: 'content',
          // Grid layout configuration
          layout: {
            type: 'grid',
            columns: 3,
            gap: 6,
            autoHeight: true 
          }
        }
      }
    }
  }
});
```

### HTML String Layout

```javascript
import { createLayout } from 'mtrl';

const layout = createLayout(`
  <div class="notification">
    <h3>Welcome!</h3>
    <p>Thank you for joining our platform.</p>
  </div>
`);

// Access the root element
const notification = layout.element;
document.body.appendChild(notification);
```

## Layout Configuration

The layout module supports direct integration with the CSS layout system through the `layout` property:

### Grid Layout

```javascript
createLayout({
  gridContainer: {
    options: {
      className: 'container',
      layout: {
        type: 'grid',
        columns: 3,         // Number of columns
        gap: 4,             // Gap size (using the gap scale)
        autoHeight: true,   // Allow natural heights
        dense: true,        // Dense packing algorithm
        align: 'center'     // Alignment of items
      }
    },
    children: {
      item1: {
        options: { 
          text: 'Item 1',
          // Individual item layout configuration
          layoutItem: {
            span: 2,        // Span 2 columns
            rowSpan: 1,     // Span 1 row
            align: 'start'  // Self-alignment
          }
        }
      }
    }
  }
});
```

### Stack Layout (Vertical)

```javascript
createLayout({
  stack: {
    options: {
      layout: {
        type: 'stack',
        gap: 4,             // Space between items
        align: 'center',    // Center items horizontally
        justify: 'between'  // Space between items vertically
      }
    },
    children: {
      header: { options: { text: 'Header' } },
      content: { options: { text: 'Content' } },
      footer: { options: { text: 'Footer' } }
    }
  }
});
```

### Row Layout (Horizontal)

```javascript
createLayout({
  row: {
    options: {
      layout: {
        type: 'row',
        gap: 4,             // Space between items
        align: 'center',    // Center items vertically
        justify: 'between', // Space between items horizontally
        wrap: true,         // Allow wrapping
        mobileStack: true   // Stack on mobile devices
      }
    },
    children: {
      // Row items...
    }
  }
});
```

## Layout Types

The layout system supports several layout types that can be used in the `layout.type` property:

| Type | Description | Key Options |
|------|-------------|------------|
| `stack` | Vertical column of elements | `align`, `justify`, `gap` |
| `row` | Horizontal row of elements | `align`, `justify`, `wrap`, `gap`, `mobileStack` |
| `grid` | CSS Grid-based layout | `columns`, `gap`, `autoHeight`, `dense` |
| `masonry` | Masonry-style layout | `masonryColumns`, `gap` |
| `split` | Two-column split layout | `ratio`, `gap` |
| `sidebar` | Sidebar with main content | `sidebarPosition`, `sidebarWidth` |

## Layout Item Properties

When using the `layoutItem` property to configure individual items:

| Property | Description | Example Values |
|----------|-------------|----------------|
| `width` | Column width in 12-column grid | `1` through `12` |
| `span` | Grid column span | `1` through `12` |
| `rowSpan` | Grid row span | `1` through `12` |
| `sm`, `md`, `lg`, `xl` | Responsive widths | `1` through `12` |
| `order` | Item ordering | `'first'`, `'last'`, or a number |
| `align` | Self-alignment | `'start'`, `'center'`, `'end'`, `'stretch'` |
| `auto` | Auto width (flex) | `true`, `false` |

## Layout Functions

### `createLayout(schema, parentElement?, options?)`

Creates a layout from a schema definition.

- **Parameters**:
  - `schema`: Array, object, HTML string, or function returning one of these
  - `parentElement` (optional): Parent element to attach the layout to
  - `options` (optional): Configuration options for layout creation
- **Returns**: Layout result object with components and utility methods

```javascript
const layout = createLayout(schema, document.getElementById('container'), {
  creator: createCard,  // Default creator for elements without a specific one
  prefix: true,         // Whether to apply automatic class prefixing
  theme: 'dark'         // Custom options (passed to components)
});
```

### Layout Result Object

The object returned by `createLayout` contains:

- `layout`: Raw layout object with all components
- `element`: Reference to the root element
- `component`: Flattened component map for easy access
- `get(name)`: Function to get a component by name
- `getAll()`: Function to get all components
- `destroy()`: Function to clean up the layout

```javascript
// Access components in different ways
const header = layout.get('header');       // By name
const footer = layout.component.footer;    // Via flattened map
const rootElement = layout.element;        // Root element
```

## Examples

### Array Schema Examples

#### Grid Layout with Array Schema

```javascript
import { createLayout, createElement, createCard } from 'mtrl';

// Create a grid layout using array syntax
const dashboard = createLayout([
  // Container element with layout configuration  
  'dashboardGrid', { 
    className: 'dashboard-grid', 
    layout: {
      type: 'grid',
      columns: 3,
      gap: 4,
      autoHeight: true
    }
  },
  [
    // First card
    createCard, 'statsCard', {
      title: 'Statistics',
      outlined: true,
      layoutItem: {
        span: 2,  // Span 2 columns
        sm: 12,   // Full width on small screens
        md: 6     // Half width on medium screens
      }
    },
    // Second card
    createCard, 'activityCard', {
      title: 'Recent Activity',
      outlined: true,
      layoutItem: {
        span: 1,  // Span 1 column
        sm: 12,   // Full width on small screens
        md: 6     // Half width on medium screens
      }
    },
    // Third card
    createCard, 'revenueCard', {
      title: 'Revenue',
      outlined: true,
      layoutItem: {
        span: 3,  // Full width
        md: 6     // Half width on medium screens
      }
    }
  ]
]);

// Access components
const statsCard = dashboard.get('statsCard');
statsCard.update({ content: 'Updated statistics data' });
```

#### Application Layout with Array Schema

```javascript
import { createLayout, createTopAppBar, createDrawer, createList, createListItem, createElement } from 'mtrl';

// Create an application layout using array syntax
const appLayout = createLayout([
  // Create a container element
  'appContainer', { 
    className: 'app-container', 
    layout: { type: 'stack', gap: 0 }
  },
  [
    // Header
    createTopAppBar, 'header', { 
      title: 'My Application',
      actions: ['menu', 'account']
    },
    
    // Main content area
    'main', { 
      className: 'app-main', 
      layout: { type: 'row', gap: 0 }
    },
    [
      // Sidebar
      createDrawer, 'sidebar', {
        persistent: true,
        layout: { type: 'stack', gap: 2 }
      },
      [
        // Navigation list
        createList, 'nav', { interactive: true },
        [
          createListItem, 'homeLink', { text: 'Home', leading: 'home' },
          createListItem, 'settingsLink', { text: 'Settings', leading: 'settings' }
        ]
      ],
      
      // Main content
      'content', {
        tag: 'main',
        className: 'app-content',
        layout: { 
          type: 'grid', 
          columns: 'auto-fit',
          gap: 4 
        }
      }
    ]
  ]
]);

// Access and modify components
const header = appLayout.get('header');
header.setTitle('Dashboard');

// Add items to the grid content area
const content = appLayout.get('content');
const card = createCard({ title: 'Statistics', content: 'App usage data...' });
content.appendChild(card.element);
```

#### Form Layout with Array Schema

```javascript
import { createLayout, createTextfield, createButton } from 'mtrl';

// Create a form with fields and submit button using array syntax
const form = createLayout([
  'formContainer', { 
    tag: 'form', 
    className: 'login-form', 
    layout: { type: 'stack', gap: 4 }
  },
  [
    createTextfield, 'username', {
      label: 'Username',
      required: true,
      layoutItem: {
        width: 12  // Full width
      }
    },
    createTextfield, 'password', {
      label: 'Password',
      type: 'password',
      required: true,
      layoutItem: {
        width: 12  // Full width
      }
    },
    'buttonRow', {
      layout: { 
        type: 'row', 
        justify: 'end',
        gap: 2 
      }
    },
    [
      createButton, 'resetButton', { 
        text: 'Reset',
        variant: 'text'
      },
      createButton, 'submitButton', { 
        text: 'Login',
        variant: 'filled'
      }
    ]
  ]
]);

// Access form elements
const usernameField = form.get('username');
const submitButton = form.get('submitButton');

// Add event handlers
submitButton.on('click', (e) => {
  e.preventDefault();
  console.log('Username:', usernameField.getValue());
});
```

### Object Schema Examples

#### Dashboard Grid with Object Schema

```javascript
import { createLayout, createElement, createCard } from 'mtrl';

const dashboard = createLayout({
  dashboardGrid: {
    options: {
      className: 'dashboard-grid',
      layout: {
        type: 'grid',
        columns: 3,
        gap: 4,
        autoHeight: true
      }
    },
    children: {
      statsCard: {
        creator: createCard,
        options: {
          title: 'Statistics',
          outlined: true,
          layoutItem: {
            span: 2,  // Span 2 columns
            sm: 12,   // Full width on small screens
            md: 6     // Half width on medium screens
          }
        }
      },
      activityCard: {
        creator: createCard,
        options: {
          title: 'Recent Activity',
          outlined: true,
          layoutItem: {
            span: 1,  // Span 1 column
            sm: 12,   // Full width on small screens
            md: 6     // Half width on medium screens
          }
        }
      },
      // More dashboard cards...
    }
  }
});
```

#### Application Layout with Object Schema

```javascript
import { createLayout, createTopAppBar, createDrawer, createList, createListItem, createButton } from 'mtrl';

const appLayout = createLayout({
  app: {
    options: {
      className: 'app-container',
      layout: { type: 'stack', gap: 0 }
    },
    children: {
      header: {
        creator: createTopAppBar,
        options: { 
          title: 'My Application',
          actions: ['menu', 'account']
        }
      },
      main: {
        options: {
          className: 'app-main',
          layout: { type: 'row', gap: 0 }
        },
        children: {
          sidebar: {
            creator: createDrawer,
            options: {
              persistent: true,
              layout: { type: 'stack', gap: 2 }
            },
            children: {
              nav: {
                creator: createList,
                options: { interactive: true },
                children: {
                  home: {
                    creator: createListItem,
                    options: { text: 'Home', leading: 'home' }
                  },
                  settings: {
                    creator: createListItem,
                    options: { text: 'Settings', leading: 'settings' }
                  }
                }
              }
            }
          },
          content: {
            options: {
              tag: 'main',
              className: 'app-content',
              layout: { 
                type: 'grid', 
                columns: 'auto-fit',
                gap: 4 
              }
            }
          }
        }
      }
    }
  }
});
```

## Performance Considerations

### Schema Format Performance

**Array-based schemas** generally outperform object-based schemas:

- **Faster processing**: 15-30% faster for large layouts
- **Lower memory usage**: Requires less memory without property names
- **Better bundle size**: More compact representation in code
- **Efficient iteration**: Arrays are optimized for sequential access

**Object-based schemas** excel in:

- **Readability**: More explicit structure with named properties
- **Maintainability**: Easier to understand complex nested structures
- **Self-documentation**: Property names describe the layout's purpose

**Recommendations**:
- For **performance-critical** applications, prefer array-based schemas
- For **complex, deeply nested** structures where maintainability is key, consider object-based schemas
- For the **best balance**, use array-based schemas for large structures and object-based for complex configurations

### Options Performance Considerations

- Setting `prefix: false` can improve performance slightly by avoiding class name processing
- Providing a `creator` function in options is more efficient than having many duplicate creator references in the schema
- Consider memoizing layout creation for frequently used UI patterns with the same options

### General Optimization Tips

- Use DocumentFragment for batch DOM operations
- Create components only when needed
- Consider memoizing frequently created layouts
- For large applications, lazy-load secondary layouts

## Responsive Design

The layout system provides several ways to create responsive designs:

### Responsive Grid

```javascript
createLayout({
  grid: {
    options: {
      layout: {
        type: 'grid',
        // Different columns at different breakpoints using CSS media queries
        class: 'md:layout--grid-cols-2 lg:layout--grid-cols-3 xl:layout--grid-cols-4'
      }
    }
  }
});
```

### Layout Items with Responsive Widths

```javascript
createLayout({
  row: {
    options: {
      layout: { type: 'row', gap: 4 }
    },
    children: {
      sidebar: {
        options: {
          layoutItem: {
            width: 3,    // Default: 3/12 (25%)
            sm: 12,      // Small screens: 12/12 (100%)
            md: 4,       // Medium screens: 4/12 (33.3%)
            lg: 3        // Large screens: 3/12 (25%)
          }
        }
      },
      main: {
        options: {
          layoutItem: {
            width: 9,    // Default: 9/12 (75%)
            sm: 12,      // Small screens: 12/12 (100%)
            md: 8,       // Medium screens: 8/12 (66.6%)
            lg: 9        // Large screens: 9/12 (75%)
          }
        }
      }
    }
  }
});
```

### Mobile Behavior Options

```javascript
createLayout({
  row: {
    options: {
      layout: {
        type: 'row',
        gap: 4,
        mobileStack: true,    // Stack on mobile instead of row
        // OR
        mobileScroll: true    // Enable horizontal scrolling on mobile
      }
    },
    children: {
      // Row items...
    }
  }
});
```

## Layout CSS Classes

The layout system uses a consistent naming convention for CSS classes:

### Layout Container Classes

- **Base Layout**: `.layout--[type]` (e.g., `.layout--stack`, `.layout--grid`)
- **Alignment**: `.layout--[type]-[align]` (e.g., `.layout--stack-center`)
- **Justification**: `.layout--[type]-justify-[justify]` (e.g., `.layout--row-justify-between`)
- **Spacing**: `.layout--[type]-gap-[size]` (e.g., `.layout--grid-gap-4`)
- **Specific Options**: `.layout--[type]-[option]` (e.g., `.layout--grid-dense`)

### Layout Item Classes

- **Base Item**: `.layout__item`
- **Width**: `.layout__item--[width]` (e.g., `.layout__item--4` for 4/12 width)
- **Responsive Widths**: `.layout__item--[breakpoint]-[width]` (e.g., `.layout__item--md-6`)
- **Ordering**: `.layout__item--order-[order]` (e.g., `.layout__item--order-first`)
- **Alignment**: `.layout__item--self-[align]` (e.g., `.layout__item--self-center`)
- **Grid Span**: `.layout__item--span-[span]` (e.g., `.layout__item--span-2`)

## Browser Compatibility

The Layout Module is compatible with all modern browsers (Chrome, Firefox, Safari, Edge).

## License

MIT