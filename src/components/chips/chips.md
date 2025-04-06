# MTRL Chips Component

## Overview

The Chips component is a lightweight, composable UI element used to represent discrete information, such as attributes, selections, filters, or user input. This TypeScript implementation provides a comprehensive API with zero dependencies, focusing on performance, accessibility, and extensibility.

## Features

- **Multiple Variants**: Filled, outlined, elevated, assist, filter, input, and suggestion chips
- **Selection Support**: Single or multi-select modes with clear API for selection management
- **Layout Options**: Horizontal or vertical arrangement with optional scrolling
- **Icon Support**: Leading and trailing icons with customizable click handlers
- **Keyboard Navigation**: Full accessibility support with keyboard controls
- **Type Safety**: Comprehensive TypeScript interfaces for improved developer experience
- **Zero Dependencies**: Built with vanilla TypeScript for minimal bundle size
- **Composition-based Architecture**: Functional composition for extensibility
- **Accessibility**: ARIA attributes and keyboard support built-in

## Installation

```bash
# Using npm
npm install mtrl

# Using yarn
yarn add mtrl

# Using bun
bun add mtrl
```

## Basic Usage

### Single Chip

```typescript
import { createChip } from 'mtrl';

// Create a basic chip
const basicChip = createChip({
  text: 'Basic Chip',
  variant: 'filled'
});

// Add to DOM
document.querySelector('.container').appendChild(basicChip.element);
```

### Chips Container

```typescript
import { createChips } from 'mtrl';

// Create a chips container with multiple chips
const filterChips = createChips({
  multiSelect: true,
  label: 'Categories',
  chips: [
    { text: 'JavaScript', variant: 'filter', value: 'js' },
    { text: 'TypeScript', variant: 'filter', value: 'ts' },
    { text: 'HTML', variant: 'filter', value: 'html' },
    { text: 'CSS', variant: 'filter', value: 'css' }
  ],
  onChange: (selectedValues) => {
    console.log('Selected categories:', selectedValues);
  }
});

// Add to DOM
document.querySelector('.filters').appendChild(filterChips.element);
```

## Component API

### Chip Configuration

```typescript
interface ChipConfig {
  variant?: 'filled' | 'outlined' | 'elevated' | 'assist' | 'filter' | 'input' | 'suggestion';
  disabled?: boolean;
  selected?: boolean;
  text?: string;
  icon?: string;
  leadingIcon?: string;
  trailingIcon?: string;
  class?: string;
  value?: string;
  ripple?: boolean;
  selectable?: boolean;
  onTrailingIconClick?: (chip: ChipComponent) => void;
  onSelect?: (chip: ChipComponent) => void;
  onChange?: (selected: boolean, chip: ChipComponent) => void;
}
```

### Chips Configuration

```typescript
interface ChipsConfig {
  chips?: ChipConfig[];
  scrollable?: boolean;
  vertical?: boolean;
  class?: string;
  selector?: string | null;
  multiSelect?: boolean;
  onChange?: (selectedValues: (string | null)[], changedValue: string | null) => void;
  label?: string;
  labelPosition?: 'start' | 'end';
}
```

### Chip Variants

| Variant | Description |
|---------|-------------|
| `filled` | Standard chip with solid background color (default) |
| `outlined` | Transparent background with outlined border |
| `elevated` | Chip with subtle shadow effect |
| `assist` | For suggesting actions to the user |
| `filter` | For filtering content with selection behavior |
| `input` | Represents user input in form fields |
| `suggestion` | For presenting options and suggestions |

## Chip API Methods

### Content Management

| Method | Description |
|--------|-------------|
| `setText(content)` | Sets the chip's text content |
| `getText()` | Gets the chip's text content |
| `setIcon(html)` | Sets the chip's leading icon |
| `getIcon()` | Gets the chip's leading icon HTML |
| `setLeadingIcon(html)` | Sets the chip's leading icon |
| `setTrailingIcon(html, onClick?)` | Sets the chip's trailing icon with optional click handler |

### State Management

| Method | Description |
|--------|-------------|
| `setValue(value)` | Sets the chip's value attribute |
| `getValue()` | Gets the chip's value attribute |
| `isSelected()` | Checks if the chip is selected |
| `setSelected(selected)` | Sets the chip's selected state |
| `toggleSelected()` | Toggles the chip's selected state |
| `isDisabled()` | Checks if the chip is disabled |
| `enable()` | Enables the chip |
| `disable()` | Disables the chip |

### Event Handling

| Method | Description |
|--------|-------------|
| `on(event, handler)` | Adds an event listener |
| `off(event, handler)` | Removes an event listener |

### Lifecycle

| Method | Description |
|--------|-------------|
| `destroy()` | Cleans up the chip and removes it from the DOM |

## Chips Container API Methods

### Chip Management

| Method | Description |
|--------|-------------|
| `addChip(chipConfig)` | Adds a new chip to the container |
| `removeChip(chipOrIndex)` | Removes a chip by instance or index |
| `getChips()` | Gets all chip instances |
| `scrollToChip(chipOrIndex)` | Scrolls to make a specific chip visible |

### Selection Management

| Method | Description |
|--------|-------------|
| `getSelectedChips()` | Gets currently selected chip instances |
| `getSelectedValues()` | Gets values of selected chips |
| `selectByValue(values, triggerEvent?)` | Selects chips by their values |
| `clearSelection()` | Clears all selections |

### Layout Management

| Method | Description |
|--------|-------------|
| `setScrollable(isScrollable)` | Sets the scrollable state |
| `setVertical(isVertical)` | Sets the vertical layout state |

### Label Management

| Method | Description |
|--------|-------------|
| `setLabel(text)` | Sets the label text |
| `getLabel()` | Gets the label text |
| `setLabelPosition(position)` | Sets the label position ('start' or 'end') |
| `getLabelPosition()` | Gets the label position |

### Other Methods

| Method | Description |
|--------|-------------|
| `enableKeyboardNavigation()` | Enables keyboard navigation between chips |
| `on(event, handler)` | Adds an event listener |
| `off(event, handler)` | Removes an event listener |
| `destroy()` | Destroys the chips container and all contained chips |

## Events

### Chip Events

| Event | Description |
|-------|-------------|
| `change` | Fired when chip selection state changes |
| `select` | Fired when a chip is selected |
| `deselect` | Fired when a chip is deselected |
| `remove` | Fired when a chip is about to be removed |

### Chips Container Events

| Event | Description |
|-------|-------------|
| `change` | Fired when any chip selection changes |
| `add` | Fired when a chip is added to the container |
| `remove` | Fired when a chip is removed from the container |

## Advanced Examples

### Filter Chips with Icons

```typescript
import { createChips } from 'mtrl';

const filterChips = createChips({
  multiSelect: true,
  scrollable: true,
  label: 'Filter by:',
  chips: [
    { 
      text: 'Completed', 
      variant: 'filter',
      value: 'completed',
      leadingIcon: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
    },
    { 
      text: 'In Progress', 
      variant: 'filter',
      value: 'in-progress',
      leadingIcon: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path fill="currentColor" d="M12 5v7l5 5-1.41 1.41L10.59 13H7V11h3.59l3-3H12z"/></svg>'
    },
    { 
      text: 'Pending', 
      variant: 'filter',
      value: 'pending',
      leadingIcon: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path fill="currentColor" d="M7 12h10v2H7z"/></svg>'
    }
  ],
  onChange: (selectedValues) => {
    console.log('Selected filters:', selectedValues);
    updateTaskList(selectedValues);
  }
});

document.querySelector('.filters-container').appendChild(filterChips.element);

// Pre-select certain values
filterChips.selectByValue(['completed', 'in-progress']);
```

### Input Chips for Email Tags

```typescript
import { createChips } from 'mtrl';

const emailChips = createChips({
  chips: [],
  label: 'Recipients:',
  onChange: (values) => {
    document.querySelector('#recipients-input').value = values.join(',');
  }
});

// Add to form
const emailForm = document.querySelector('.email-form');
emailForm.insertBefore(emailChips.element, emailForm.firstChild);

// Handle input for adding emails
const input = document.querySelector('#email-input');
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    
    const email = input.value.trim().replace(',', '');
    if (validateEmail(email)) {
      emailChips.addChip({
        text: email,
        variant: 'input',
        value: email,
        trailingIcon: '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
        onTrailingIconClick: (chip) => {
          emailChips.removeChip(chip);
        }
      });
      input.value = '';
    }
  }
});

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}
```

### Theme Selector with Single Selection

```typescript
import { createChips } from 'mtrl';

const themeChips = createChips({
  multiSelect: false, // Single selection mode
  label: 'Select theme:',
  chips: [
    { 
      text: 'Light Theme', 
      variant: 'filter', 
      value: 'light',
      selected: true // Pre-select Light theme
    },
    { 
      text: 'Dark Theme', 
      variant: 'filter', 
      value: 'dark' 
    },
    { 
      text: 'System Theme', 
      variant: 'filter', 
      value: 'system' 
    }
  ],
  onChange: (selectedValues) => {
    if (selectedValues.length > 0) {
      applyTheme(selectedValues[0]);
    }
  }
});

document.querySelector('.theme-settings').appendChild(themeChips.element);

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
```

### Vertical Layout with Category Groups

```typescript
import { createChips } from 'mtrl';

const categoryChips = createChips({
  vertical: true,
  multiSelect: true,
  label: 'Categories:',
  labelPosition: 'start',
  chips: [
    { text: 'Technology', variant: 'filter', value: 'tech' },
    { text: 'Science', variant: 'filter', value: 'science' },
    { text: 'Health', variant: 'filter', value: 'health' },
    { text: 'Business', variant: 'filter', value: 'business' },
    { text: 'Entertainment', variant: 'filter', value: 'entertainment' },
    { text: 'Sports', variant: 'filter', value: 'sports' },
    { text: 'Politics', variant: 'filter', value: 'politics' },
    { text: 'Travel', variant: 'filter', value: 'travel' }
  ],
  onChange: (selectedValues) => {
    updateArticlesList(selectedValues);
  }
});

document.querySelector('.sidebar-filters').appendChild(categoryChips.element);
```

### Dynamic Chip Creation and Removal

```typescript
import { createChips } from 'mtrl';

// Create empty chips container
const dynamicChips = createChips({
  scrollable: true,
  label: 'Tags:',
  onChange: (selectedValues) => {
    console.log('Selected tags:', selectedValues);
  }
});

document.querySelector('.tags-container').appendChild(dynamicChips.element);

// Add new tag button
document.querySelector('#add-tag').addEventListener('click', () => {
  const tagInput = document.querySelector('#tag-input');
  const tagText = tagInput.value.trim();
  
  if (tagText) {
    dynamicChips.addChip({
      text: tagText,
      variant: 'input',
      value: tagText.toLowerCase().replace(/\s+/g, '-'),
      trailingIcon: '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
      onTrailingIconClick: (chip) => {
        if (confirm(`Remove tag "${chip.getText()}"?`)) {
          dynamicChips.removeChip(chip);
        }
      }
    });
    
    tagInput.value = '';
  }
});
```

## Accessibility

The MTRL Chips component is built with accessibility in mind:

- **ARIA Attributes**: Proper `aria-selected`, `aria-disabled`, and `aria-multiselectable` attributes
- **Keyboard Navigation**: Navigate between chips using arrow keys, select with Space/Enter
- **Focus Management**: Visible focus indicators and proper focus handling
- **Semantic Structure**: Appropriate roles and accessible names
- **Screen Reader Support**: Meaningful announcements for selection changes

## Technical Architecture

The MTRL Chips component follows a functional composition pattern:

1. **Base Component**: Core structure with element creation
2. **Feature Enhancement**: Functional mixins that add specific capabilities
3. **DOM Generation**: Creates the actual DOM elements from the structure
4. **Controller**: Manages state, events, and behavior
5. **Lifecycle Management**: Handles component lifecycle events
6. **Public API**: Exposes a clean, consistent interface

This architecture enables:
- Efficient code reuse and maintainability
- Clear separation of concerns
- Extensibility through composition
- Predictable behavior and clean API surface

## CSS Customization

MTRL Chips use BEM-style class naming for easy styling. Primary classes:

```
.mtrl-chip               /* Base chip class */
.mtrl-chip--{variant}    /* Variant classes */
.mtrl-chip--selected     /* Selected state */
.mtrl-chip--disabled     /* Disabled state */
.mtrl-chip-content       /* Content container */
.mtrl-chip-text          /* Text element */
.mtrl-chip-leading-icon  /* Leading icon */
.mtrl-chip-trailing-icon /* Trailing icon */

.mtrl-chips             /* Chips container */
.mtrl-chips--scrollable /* Scrollable state */
.mtrl-chips--vertical   /* Vertical layout */
.mtrl-chips-container   /* Inner container */
.mtrl-chips-label       /* Label element */
```

## Browser Support

This component supports all modern browsers that implement ES6+ standards:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MTRL is licensed under the MIT License.