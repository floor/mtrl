# mtrl

Material Design 3 components for the web, written in TypeScript with zero dependencies.

mtrl implements the M3 expressive update: component sizes, shapes, colours and spring motion follow the Material 3 tokens. Each component is a plain function that returns a DOM element and a small API, so mtrl works with any framework or none. The documentation site, [mtrl.app](https://mtrl.app), shows every component with live examples.

## Quick start

```bash
npm install mtrl
```

```typescript
import 'mtrl/styles';
import { createButton, createTextfield } from 'mtrl';

const name = createTextfield({ label: 'Name' });
const save = createButton({ text: 'Save', variant: 'filled' });
save.disabled.disable();

name.on('input', ({ value }: { value: string }) => {
  if (value.trim()) save.disabled.enable();
  else save.disabled.disable();
});

save.on('click', () => {
  console.log('Saved', name.getValue());
});

document.body.append(name.element, save.element);

// When the view goes away, release listeners and DOM
name.destroy();
save.destroy();
```

`mtrl/styles` loads every component and theme. For a smaller bundle, import only what you use (see [Styles](#styles)).

## Components

Every component is created by a `create*` function exported from `mtrl`, and renders with `mtrl-` prefixed classes.

- **Actions:** `createButton`, `createButtonGroup`, `createSplitButton`, `createIconButton`, `createFab`, `createExtendedFab`
- **Selection and input:** `createCheckbox`, `createChips` and `createChip`, `createRadios`, `createSwitch`, `createSlider`, `createSelect`, `createTextfield`, `createSearch`, `createDatePicker`, `createTimePicker`
- **Navigation:** `createNavigationRail`, `createDrawer`, `createTabs` and `createTab`, `createTopAppBar`, `createBottomAppBar`, `createMenu`, `createNavigation`, `createNavigationSystem`
- **Containment:** `createCard` with `createCardHeader`, `createCardContent`, `createCardMedia` and `createCardActions`, `createCarousel`, `createList`, `createDivider`, `createDialog`, `createBottomSheet`, `createSideSheet`
- **Communication:** `createSnackbar`, `createTooltip`, `createBadge`, `createProgress`, `createLoadingIndicator`
- **Deprecated:** `createSegmentedButton` and `createSegment`, replaced by `createButtonGroup` with `kind: 'connected'`

Virtual scrolling and data-driven lists live in [mtrl-addons](https://github.com/floor/mtrl-addons).

## Styles

Import the full stylesheet once:

```typescript
import 'mtrl/styles';
```

Or import the base once, followed by the components you use:

```typescript
import 'mtrl/styles/base';
import 'mtrl/styles/button';
import 'mtrl/styles/textfield';

// Optional: an alternate theme and the utility classes
import 'mtrl/themes/ocean';
import 'mtrl/styles/utilities';
```

The base includes the baseline theme in light and dark, the tokens, a reset, typography and the ripple. Each selective entry imports what it depends on (the select brings the text field and the menu), so use a CSS-capable bundler to resolve and deduplicate them. Choose either the full stylesheet or selective imports, not both. The date picker has no selective entry yet; it is in the full stylesheet.

Library styles sit in ordered `mtrl` cascade layers, so unlayered application CSS overrides them without specificity battles.

### Themes

The baseline theme applies by default and follows the system light or dark preference. Choose a theme and mode on the root element:

```html
<html data-theme="ocean" data-theme-mode="dark">
```

```typescript
document.documentElement.dataset.theme = 'ocean';
document.documentElement.dataset.themeMode = 'dark';
```

Available themes: `baseline`, `ocean`, `desert`, `forest`, `sunset`, `spring`, `summer`, `autumn`, `winter`, `brownbeige`, `browngreen`, `sageivory`, `tealcaramel`, `material`, `legacy` and `highcontrast`. With selective styles, import the theme's entry, for example `mtrl/themes/ocean`.

### Custom properties

Components read the theme's colour roles, so overriding a role restyles every component that uses it:

```css
:root {
  --mtrl-sys-color-primary: #6750a4;
  --mtrl-sys-color-on-primary: #ffffff;
}
```

The type scale and shape scale are custom properties too (`--mtrl-sys-typescale-*`, `--mtrl-sys-shape-*`). Component hooks follow one convention, `--mtrl-<component>-<name>`:

```css
.brand-slider {
  --mtrl-slider-color: #006a6a;
  --mtrl-slider-on-color: #ffffff;
}
```

## Imports and tree-shaking

mtrl publishes ESM with type declarations, so bundlers drop unused exports and split dynamic imports. CommonJS remains available through `require('mtrl')`.

| Import | Path |
|--------|------|
| Component creators | `import { createButton } from 'mtrl'` |
| One component directly | `import createSlider from 'mtrl/components/slider'` |
| Component constants | `import { BUTTON_VARIANTS } from 'mtrl/components/button/constants'` |
| Core utilities | `import { addClass, removeClass } from 'mtrl/core/dom'` |

Constants are not exported from the root; import them from the component's `constants` entry:

```typescript
import { createButton } from 'mtrl';
import { BUTTON_VARIANTS, BUTTON_SIZES } from 'mtrl/components/button/constants';

const button = createButton({
  text: 'Submit',
  variant: BUTTON_VARIANTS.FILLED,
  size: BUTTON_SIZES.L,
});
```

Button progress and card actions load on demand; enable code splitting in your build to keep them out of the initial chunk.

## Building your own components

Components are composed from small features with `pipe`. The same building blocks are public:

```typescript
import { pipe, createBase, withEvents, withElement } from 'mtrl/core/compose';
import type { ElementComponent } from 'mtrl/core/compose';

interface NoteConfig {
  text?: string;
}

interface NoteComponent extends ElementComponent {
  setText: (text: string) => NoteComponent;
}

const createNote = (config: NoteConfig): NoteComponent =>
  pipe(
    createBase,
    withEvents(),
    withElement({ tag: 'div', componentName: 'note' }),
    (component) => ({
      ...component,
      setText(text: string) {
        component.element.textContent = text;
        return this;
      },
    })
  )(config);
```

The element gets the `mtrl-note` class, `withEvents` adds `on`, `off` and `emit`, and `destroy()` removes the element. Add `withLifecycle()` from `mtrl/core/compose/features` when features need to register cleanup.

## Upgrading from 0.7

0.8.0 aligns the components with Material 3 expressive, and some of that changes the API or the styles:

- `createSheet` is removed; use `createBottomSheet` or `createSideSheet`.
- FAB and extended FAB: `variant: 'primary'`, `'secondary'` and `'tertiary'` are now the tone styles; the former look is `'primary-container'` (the default), `'secondary-container'` and `'tertiary-container'`.
- `createSegmentedButton` is deprecated in favour of `createButtonGroup({ kind: 'connected' })`; its heights are now 40, 36 and 32px by density.
- Component custom properties are renamed to `--mtrl-<component>-<name>`, for example `--drawer-width` to `--mtrl-drawer-width` and `--item-offset` to `--mtrl-list-item-offset`.
- `title-large` uses weight 400, as M3 specifies.
- The slider draws with DOM and CSS; styles for `.mtrl-slider-canvas` no longer apply.

The full list, with every renamed property, is in [changelog.txt](changelog.txt).

## Browser support

Current Chrome, Edge, Firefox and Safari. The spring motion uses CSS `linear()` easing (Safari 17.2 or later); older browsers render every component but skip those transitions.

## Contributing

Contributions are welcome. [CONTRIBUTING.md](CONTRIBUTING.md) covers the development setup, conventions and the distribution checks; [TESTING.md](TESTING.md) covers the test suite.

## License

MIT, see [LICENSE](LICENSE).
