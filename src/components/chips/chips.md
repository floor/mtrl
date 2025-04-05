# Chip Component Documentation

## Overview

The Chip component is a lightweight, versatile UI element used to represent compact information, input, attributes, or actions. This TypeScript implementation provides a comprehensive API for creating and managing chip elements with various styles and behaviors.

## Features

- Multiple visual variants (filled, outlined, elevated, assist, filter, input, suggestion)
- Selection support for interactive filtering
- Leading and trailing icons
- Disabled state handling
- Ripple effect for touch feedback
- Keyboard accessibility
- Event handling API
- ChipSet container for grouping related chips

## Installation

```bash
npm install @your-lib/components
```

## Basic Usage

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

## Chip Configuration

### ChipConfig Interface

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
  prefix?: string;
  componentName?: string;
  rippleConfig?: {
    duration?: number;
    timing?: string;
    opacity?: [string, string];
  };
  selectable?: boolean;
  onTrailingIconClick?: (chip: ChipComponent) => void;
  onSelect?: (chip: ChipComponent) => void;
  onChange?: (chip: ChipComponent) => void;
}
```

### Chip Variants

| Variant | Description |
|---------|-------------|
| `filled` | Standard chip with solid background color (default) |
| `outlined` | Transparent background with outlined border |
| `elevated` | Chip with shadow effect |
| `assist` | Action suggestion chip |
| `filter` | Selectable filtering chip |
| `input` | Represents user input, often used in input fields |
| `suggestion` | Presents options or suggestions to the user |

## Chip API Methods

### Core Methods

| Method | Description |
|--------|-------------|
| `getValue()` | Gets the chip value (data-value attribute) |
| `setValue(value)` | Sets the chip's value |
| `setText(content)` | Updates the chip's text content |
| `getText()` | Gets the chip's text content |
| `setIcon(html)` | Sets the chip's leading icon (alias for `setLeadingIcon`) |
| `getIcon()` | Gets the chip's leading icon HTML |
| `setLeadingIcon(html)` | Sets the chip's leading icon |
| `setTrailingIcon(html, onClick?)` | Sets the chip's trailing icon with optional click handler |

### Selection Methods

| Method | Description |
|--------|-------------|
| `isSelected()` | Checks if the chip is in selected state |
| `setSelected(selected)` | Sets the chip's selected state |
| `toggleSelected()` | Toggles the chip's selected state |

### State Methods

| Method | Description |
|--------|-------------|
| `isDisabled()` | Checks if the chip is disabled |
| `enable()` | Enables the chip |
| `disable()` | Disables the chip |

### Event Handling

| Method | Description |
|--------|-------------|
| `on(event, handler)` | Adds an event listener to the chip |
| `off(event, handler)` | Removes an event listener from the chip |

### Lifecycle

| Method | Description |
|--------|-------------|
| `destroy()` | Removes the chip and cleans up resources |

## ChipSet Component

ChipSet provides a container for grouping related chips together, with additional functionality for selection management and layout control.

### ChipSet Configuration

```typescript
interface ChipSetConfig {
  chips?: any[];
  scrollable?: boolean;
  vertical?: boolean;
  class?: string;
  selector?: string | null;
  multiSelect?: boolean;
  onChange?: (selectedValues: (string | null)[], changedValue: string | null) => void;
}
```

### ChipSet API Methods

| Method | Description |
|--------|-------------|
| `addChip(chipConfig)` | Adds a new chip to the set |
| `removeChip(chipOrIndex)` | Removes a chip from the set |
| `getChips()` | Gets all chip instances in the set |
| `getSelectedChips()` | Gets currently selected chips |
| `getSelectedValues()` | Gets the values of selected chips |
| `selectByValue(values)` | Selects chips by their values |
| `clearSelection()` | Clears all selections |
| `setScrollable(isScrollable)` | Sets the scrollable state |
| `setVertical(isVertical)` | Sets the vertical layout state |
| `on(event, handler)` | Adds an event listener |
| `off(event, handler)` | Removes an event listener |
| `destroy()` | Destroys the chip set and all chips |

## Examples

### Creating a Basic Chip

```typescript
// Create a basic chip
const basicChip = createChip({
  text: 'Basic Chip',
  variant: 'filled'
});

// Add to DOM
document.body.appendChild(basicChip.element);
```

### Creating a Selectable Filter Chip

```typescript
const filterChip = createChip({
  text: 'Filter Option',
  variant: 'filter',
  leadingIcon: '<svg>...</svg>',
  onChange: (chip) => {
    console.log('Selection changed:', chip.isSelected());
  }
});

document.body.appendChild(filterChip.element);
```

### Creating a Chip with Trailing Icon

```typescript
const emailChip = createChip({
  text: 'user@example.com',
  variant: 'input',
  trailingIcon: '<svg>...</svg>',
  onTrailingIconClick: (chip) => {
    // Handle remove action
    chip.element.remove();
  }
});

document.querySelector('.email-container').appendChild(emailChip.element);
```

### Creating a ChipSet with Multiple Chips

```typescript
import { createChipSet } from './path/to/components/chip';

const tagChipSet = createChipSet({
  multiSelect: true,
  scrollable: true,
  onChange: (selectedValues) => {
    console.log('Selected tags:', selectedValues);
  },
  chips: [
    { text: 'JavaScript', variant: 'filter' },
    { text: 'TypeScript', variant: 'filter' },
    { text: 'HTML', variant: 'filter' },
    { text: 'CSS', variant: 'filter' }
  ]
});

document.querySelector('.tags-container').appendChild(tagChipSet.element);
```

### ChipSet with Single Selection

```typescript
const themeChipSet = createChipSet({
  multiSelect: false,
  onChange: (selectedValues) => {
    console.log('Selected theme:', selectedValues[0]);
  },
  chips: [
    { text: 'Light Theme', variant: 'filter' },
    { text: 'Dark Theme', variant: 'filter' },
    { text: 'System Theme', variant: 'filter' }
  ]
});

// Pre-select the first option
themeChipSet.selectByValue('light');

document.querySelector('.theme-selector').appendChild(themeChipSet.element);
```

## Accessibility

The Chip component follows accessibility best practices:
- Uses appropriate ARIA attributes (aria-selected, aria-disabled)
- Supports keyboard navigation and interaction
- Maintains proper focus states
- Provides semantic roles

## Browser Support

This component is compatible with all modern browsers that support ES6 and DOM manipulation.

## License

[Your license information here]