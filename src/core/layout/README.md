# Layout Module Documentation

## Overview

The Layout Module is a lightweight, flexible system for creating and managing visual arrangements and component hierarchies. It provides a declarative approach to building UI layouts using arrays, objects, JSX, or HTML strings, with efficient DOM operations, component instantiation, and visual arrangement.

## Features

- **Multiple Schema Formats** - Support for array-based, object-based, JSX-based, and HTML string schemas
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

### JSX-based Layout

The layout system now supports JSX syntax for creating layouts, offering a more familiar and readable approach:

```jsx
/** @jsx h */
import { h, Fragment, createJsxLayout } from 'mtrl';

// Create a layout using JSX
const layout = (
  <div className="container" layout={{ type: 'grid', columns: 3, gap: 4 }}>
    <header layoutItem={{ span: 3 }}>
      <h1>Dashboard</h1>
    </header>
    
    <aside layoutItem={{ span: 1, sm: 12, md: 4 }}>
      <nav>
        <ul>
          <li><a href="#home">Home</a></li>
          <li><a href="#stats">Statistics</a></li>
          <li><a href="#settings">Settings</a></li>
        </ul>
      </nav>
    </aside>
    
    <main layoutItem={{ span: 2, sm: 12, md: 8 }}>
      <section className="content">
        <h2>Welcome to the Dashboard</h2>
        <p>This layout was created using JSX syntax.</p>
        
        {/* Conditional rendering */}
        {hasNotifications && (
          <div className="notifications">
            You have {notificationCount} new notifications.
          </div>
        )}
        
        {/* Using components */}
        {createButton({
          text: "Click Me",
          variant: "filled"
        })}
      </section>
    </main>
    
    <footer layoutItem={{ span: 3 }}>
      © 2025 MTRL Framework
    </footer>
  </div>
);

// Create the actual DOM structure
const result = createJsxLayout(layout);
document.body.appendChild(result.element);
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
| `width` | Column width in a 12-column grid | `1` through `12` |
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
  - `schema`: Array, object, JSX, or HTML string
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

### `createJsxLayout(jsxElement, parentElement?)`

Creates a layout from a JSX element.

- **Parameters**:
  - `jsxElement`: JSX element created with the `h` function
  - `parentElement` (optional): Parent element to attach the layout to
- **Returns**: Layout result object with components and utility methods

```jsx
/** @jsx h */
import { h, createJsxLayout } from 'mtrl';

const jsxElement = <div className="container">Hello, world!</div>;
const layout = createJsxLayout(jsxElement);
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

## JSX Support

### Setting Up JSX

To use JSX, add these settings to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment"
  }
}
```

And add the JSX pragma comment to your `.tsx` files:

```jsx
/** @jsx h */
import { h, Fragment, createJsxLayout } from 'mtrl';
```

### JSX Features

- **HTML Elements & Components**: Mix standard HTML with MTRL components
- **Conditional Rendering**: Use conditional expressions (`condition ? x : y`)
- **Fragments**: Group elements without extra DOM nodes using `<Fragment>`
- **Iteration**: Generate lists using `.map()` 
- **Event Handling**: Direct event handler attachment
- **Inline Styles**: Support for object-style CSS properties
- **Layout Props**: Direct support for layout configuration

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

### JSX Schema Examples

#### Dashboard Grid with JSX Schema

```jsx
/** @jsx h */
import { h, Fragment, createJsxLayout } from 'mtrl';
import { createCard } from 'mtrl';

function createDashboard(stats) {
  const layout = (
    <div 
      className="dashboard-grid"
      layout={{ type: 'grid', columns: 3, gap: 4, autoHeight: true }}
    >
      <div layoutItem={{ span: 2, sm: 12, md: 6 }}>
        {createCard({
          title: 'Statistics',
          outlined: true,
          content: stats.totalUsers.toString()
        })}
      </div>
      
      <div layoutItem={{ span: 1, sm: 12, md: 6 }}>
        {createCard({
          title: 'Recent Activity',
          outlined: true,
          content: `${stats.activeUsers} active users`
        })}
      </div>
      
      <div layoutItem={{ span: 3, md: 6 }}>
        {createCard({
          title: 'Revenue',
          outlined: true,
          content: `$${stats.revenue.toLocaleString()}`
        })}
      </div>
    </div>
  );
  
  return createJsxLayout(layout);
}

// Usage
const dashboard = createDashboard({
  totalUsers: 12583,
  activeUsers: 4321,
  revenue: 1234567
});

document.body.appendChild(dashboard.element);
```

#### Form Layout with JSX Schema

```jsx
/** @jsx h */
import { h, createJsxLayout } from 'mtrl';
import { createTextField, createButton } from 'mtrl';

function createLoginForm(onSubmit) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const username = form.elements.username.value;
    const password = form.elements.password.value;
    onSubmit({ username, password });
  };

  const layout = (
    <form 
      className="login-form"
      onSubmit={handleSubmit}
      layout={{ type: 'stack', gap: 4 }}
    >
      <div layoutItem={{ width: 12 }}>
        {createTextField({
          label: 'Username',
          name: 'username',
          required: true
        })}
      </div>
      
      <div layoutItem={{ width: 12 }}>
        {createTextField({
          label: 'Password',
          name: 'password',
          type: 'password',
          required: true
        })}
      </div>
      
      <div
        layout={{ type: 'row', justify: 'end', gap: 2 }}
      >
        {createButton({
          text: 'Reset',
          variant: 'text',
          type: 'reset'
        })}
        
        {createButton({
          text: 'Login',
          variant: 'filled',
          type: 'submit'
        })}
      </div>
    </form>
  );
  
  return createJsxLayout(layout);
}

// Usage
const form = createLoginForm(credentials => {
  console.log('Login attempt:', credentials);
  alert(`Login attempt for: ${credentials.username}`);
});

document.body.appendChild(form.element);
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

**JSX schemas** offer:

- **Familiarity**: Syntax familiar to many developers
- **Readability**: Clear visual hierarchy mirroring the DOM
- **Features**: Natural support for conditionals and iteration
- **Performance**: Converted to efficient array schemas internally

**Recommendations**:
- For **performance-critical** applications, prefer array-based schemas
- For **complex, deeply nested** structures where maintainability is key, consider object-based schemas
- For **the best readability** and **familiar syntax**, use JSX schemas
- For the **best balance**, use array-based schemas for large structures and JSX for user interfaces

### Options Performance Considerations

- Setting `prefix: false` can improve performance slightly by avoiding class name processing
- Providing a `creator` function in options is more efficient than having many duplicate creator references in the schema
- Consider memoizing layout creation for frequently used UI patterns with the same options

### JSX Performance Considerations

- The JSX implementation is optimized for performance and converts to efficient array schemas
- Style objects are converted to strings at creation time, not during rendering
- Fragment support prevents unnecessary DOM nodes
- Children are flattened for more efficient processing

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