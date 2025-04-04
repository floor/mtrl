# Function Naming Convention Change

This document explains the transition from the `create*` function naming pattern to the new `f*` pattern in the MTRL library.

## Overview

Starting from version X.X.X, factory functions in the MTRL library are being gradually renamed from the `create*` prefix to the shorter `f*` prefix:

> **Note**: This transition is being done incrementally. Currently, the following components have been refactored:
> - Badge
> - Button
> - Card
> - Checkbox
> - Chip & ChipSet
> - DatePicker
> - Dialog
> - Divider
> - Fab
> - Extended-Fab
> - List
>
> Other components will be updated in future releases.

```javascript
// Old naming convention
import { createButton, createCard } from 'mtrl';

// New naming convention
import { fButton, fCard } from 'mtrl';
```

## Motivation

This change was made to:

1. **Reduce verbosity**: The shorter prefix makes for cleaner and more concise code
2. **Improve readability**: Function names are now more compact while still being descriptive
3. **Align with modern libraries**: Many modern UI libraries use shorter function names for component creation

## Backward Compatibility

For backward compatibility, the library still exports all functions with their original `create*` names. This means your existing code will continue to work without changes. However, we encourage using the new naming convention for all new code.

```javascript
// Both of these imports work
import { createButton } from 'mtrl';  // Legacy style
import { fButton } from 'mtrl';       // New style

// And both function calls work
const button1 = createButton({ text: 'Legacy' });
const button2 = fButton({ text: 'New Style' });
```

The compatibility layer is implemented through direct re-exports to ensure optimal tree-shaking. This means:

1. There's no runtime performance cost to the compatibility layer
2. If you only use the new function names, the old ones won't be included in your production bundle
3. The functions are identical - the old names simply refer to the new implementations

## Migration Guide

To migrate your code to the new naming convention:

1. Replace all imports that use `create*` functions with their `f*` equivalents:

   ```javascript
   // Before
   import { createButton, createCard, createDialog } from 'mtrl';

   // After
   import { fButton, fCard, fDialog } from 'mtrl';
   ```

2. Update all function calls in your code:

   ```javascript
   // Before
   const button = createButton({ text: 'Click me' });
   const card = createCard({ title: 'Card Title' });

   // After
   const button = fButton({ text: 'Click me' });
   const card = fCard({ title: 'Card Title' });
   ```

## Deprecation Notice

While the `create*` functions will be maintained for backward compatibility in the short term, they may be deprecated in a future major release. We recommend migrating to the new naming convention at your earliest convenience.

## Complete Function Name Mapping

Here's a complete list of the renamed functions:

| Old Name                | New Name          |
|-------------------------|-------------------|
| `createElement`         | `fElement`        |
| `createLayout`          | `fLayout`         |
| `createButton`          | `fButton`         |
| `createFab`             | `fFab`            |
| `createExtendedFab`     | `fExtendedFab`    |
| `createSegmentedButton` | `fSegmentedButton`|
| `createBottomAppBar`    | `fBottomAppBar`   |
| `createBadge`           | `fBadge`          |
| `createCard`            | `fCard`           |
| `createCarousel`        | `fCarousel`       |
| `createCheckbox`        | `fCheckbox`       |
| `createChip`            | `fChip`           |
| `createChipSet`         | `fChipSet`        |
| `createDatePicker`      | `fDatePicker`     |
| `createDialog`          | `fDialog`         |
| `createDivider`         | `fDivider`        |
| `createMenu`            | `fMenu`           |
| `createNavigation`      | `fNavigation`     |
| `createProgress`        | `fProgress`       |
| `createRadios`          | `fRadios`         |
| `createSearch`          | `fSearch`         |
| `createSegment`         | `fSegment`        |
| `createSheet`           | `fSheet`          |
| `createSlider`          | `fSlider`         |
| `createSnackbar`        | `fSnackbar`       |
| `createSwitch`          | `fSwitch`         |
| `createTabs`            | `fTabs`           |
| `createTextfield`       | `fTextfield`      |
| `createTimePicker`      | `fTimePicker`     |
| `createTopAppBar`       | `fTopAppBar`      |
| `createTooltip`         | `fTooltip`        |
| `createList`            | `fList`           |