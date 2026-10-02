# mtrl

Material Design 3 components for the web: as plain JavaScript, as web components, and as React, Vue, Svelte and Solid components. Written in TypeScript, with zero dependencies.

mtrl implements the M3 Expressive update: component sizes, shapes, colours and spring motion follow the Material 3 tokens. One implementation serves every way of using it, so a button looks and behaves the same in each. The documentation site, [md3.io](https://md3.io), has a live playground and examples in every framework for each component.

## Install

```bash
npm install mtrl
```

React, Vue, Svelte and Solid are optional peer dependencies: mtrl uses the one your app has and installs none of them.

## Use it your way

| Way | Import from | Good for |
|-----|-------------|----------|
| Web components | `mtrl/elements` | Plain HTML, server templates, Angular, any framework |
| React | `mtrl/react` | React 18 and 19, Next.js |
| Vue | `mtrl/vue` | Vue 3, Nuxt |
| Svelte | `mtrl/svelte` | Svelte 5, SvelteKit |
| Solid | `mtrl/solid` | SolidJS, SolidStart |
| Vanilla factories | `mtrl` | The smallest bundles and full control |

Every app imports the base stylesheet once: the theme, the tokens and the ripple.

```typescript
import 'mtrl/styles/base';
```

**Web components**: register them once, then write HTML.

```html
<script type="module">
  import 'mtrl/styles/base';
  import 'mtrl/elements/css';
  import { defineAll } from 'mtrl/elements';
  defineAll();
</script>

<form>
  <m-textfield name="email" type="email" label="Email" required></m-textfield>
  <m-switch name="news" checked>Newsletter</m-switch>
  <m-button type="submit">Sign up</m-button>
</form>
```

**React** (Vue, Svelte and Solid work the same way, see [below](#react-vue-svelte-and-solid)):

```tsx
import 'mtrl/styles/base';
import { Button, Switch, TextField } from 'mtrl/react';

export function Signup() {
  return (
    <form>
      <TextField name="email" type="email" label="Email" required />
      <Switch name="news" defaultChecked>Newsletter</Switch>
      <Button type="submit">Sign up</Button>
    </form>
  );
}
```

**Vanilla**: each component is a function that returns a DOM element and a small API.

```typescript
import 'mtrl/styles';
import { createButton, createTextField } from 'mtrl';

const name = createTextField({ label: 'Name' });
const save = createButton({ text: 'Save', variant: 'filled' });
save.disabled.disable();

name.on('input', ({ value }: { value: string }) => {
  if (value.trim()) save.disabled.enable();
  else save.disabled.disable();
});
save.on('click', () => console.log('Saved', name.getValue()));

document.body.append(name.element, save.element);

// When the view goes away, release listeners and DOM
name.destroy();
save.destroy();
```

The factories are the fastest way to render hundreds of components at once, such as a long editable table; the elements style a shadow root each. `mtrl/styles` loads every component's styles; for a smaller bundle, import only what you use (see [Styles](#styles)).

## Components

Every component comes three ways: a factory (`createButton`), an element (`<m-button>`) and a framework component (`Button`; `MButton` in Vue).

| Group | Components |
|-------|------------|
| Actions | Button, Icon button, Button group, Split button, FAB, Extended FAB, FAB menu, Toolbar |
| Selection and input | Checkbox, Switch, Radio buttons, Chips, Slider, Text field, Select, Search, Date picker, Time picker |
| Navigation | Navigation rail, Drawer, Tabs, Menu, Top app bar, Bottom app bar |
| Containment | Card, Carousel, List, Divider, Dialog, Bottom sheet, Side sheet |
| Communication | Badge, Progress, Loading indicator, Snackbar, Tooltip |

The factories are exported from `mtrl`: `createButton`, `createIconButton`, `createButtonGroup`, `createSplitButton`, `createFab`, `createExtendedFab`, `createFabMenu`, `createToolbar`, `createCheckbox`, `createSwitch`, `createRadios`, `createChips` (with `createAssistChip`, `createFilterChip`, `createInputChip` and `createSuggestionChip`), `createSlider`, `createTextField`, `createSelect`, `createSearch`, `createDatePicker`, `createTimePicker`, `createNavigationRail`, `createDrawer`, `createTabs` and `createTab`, `createMenu`, `createTopAppBar`, `createBottomAppBar`, `createCard` (with `createCardHeader`, `createCardContent`, `createCardMedia` and `createCardActions`), `createCarousel`, `createList`, `createDivider`, `createDialog`, `createBottomSheet`, `createSideSheet`, `createBadge`, `createProgress`, `createLoadingIndicator`, `createSnackbar` and `createTooltip`. Deprecated: `createSegmentedButton` and `createSegment`, replaced by `createButtonGroup` with `kind: 'connected'`.

## Styles

The web components and the framework components carry their own styles in their shadow roots; they need only the base stylesheet, `mtrl/styles/base`, for the theme and its tokens. The factories render in the page, so they use the page's stylesheets. Import the full stylesheet once:

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

The base includes the baseline theme in light and dark, the tokens, a reset, typography and the ripple. Each selective entry imports what it depends on (the select brings the text field and the menu), so use a CSS-capable bundler to resolve and deduplicate them. Choose either the full stylesheet or selective imports, not both.

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

Available themes: `baseline`, `ocean`, `desert`, `forest`, `sunset`, `spring`, `summer`, `autumn`, `brownbeige`, `sageivory`, `tealcaramel` and `highcontrast`. With selective styles, import the theme's entry, for example `mtrl/themes/ocean`.

Every theme supports `data-theme-contrast="standard"`, `"medium"` and `"high"` on the same element as `data-theme` and `data-theme-mode`:

```html
<html data-theme="desert" data-theme-mode="dark" data-theme-contrast="high">
```

Without `data-theme-contrast`, `prefers-contrast: more` selects high contrast on every themed element independently. An explicit `standard` opts out on that element; `medium` overrides the preference too. Contrast settings do not inherit from an ancestor across a nested theme: put `data-theme-contrast` on the same element as each `data-theme`, including nested sections. For example, opting out on the root does not opt out a nested theme without its own `data-theme-contrast="standard"`.

The default baseline also supports this setting without `data-theme`. On that unthemed root, both standard and higher contrast follow the OS color scheme and `.dark-theme`, ignoring `data-theme-mode`. Medium and high use M3 contrast levels 0.5 and 1.0; hand-authored themes derive them with Tonal Spot from their documented seed (falling back to their light primary), preserving their light secondary and tertiary hues and chroma. Neutral palettes come from the seed, while standard colors stay unchanged. Success, warning and info keep their existing status colors. The `highcontrast` theme is a theme in its own right and supports all three contrast settings.

M3's scheme variants, generated from the baseline seed, ship as their own entries only (not in the full stylesheet): `neutral`, `vibrant`, `expressive`, `fidelity`, `content`, `monochrome`, `rainbow` and `fruit-salad`, for example `mtrl/themes/vibrant`. `schemeToTokens` (`mtrl/core/theme`) turns any M3 scheme's role colours into these tokens.

Deprecated themes, removed in the package `material` 3.0.0: the theme `material` (use `baseline`), `winter` (use `ocean`), `browngreen` (use `brownbeige`) and `legacy`.

### Custom properties

Components read the theme's colour roles, so overriding a role restyles every component that uses it:

```css
:root {
  --mtrl-sys-color-primary: #6750a4;
  --mtrl-sys-color-on-primary: #ffffff;
}
```

The type scale, the typefaces and the corner scale are custom properties too (`--mtrl-sys-typescale-*`, `--mtrl-ref-typeface-brand` and `--mtrl-ref-typeface-plain`, `--mtrl-sys-shape-corner-*`): setting a typeface or a corner step on `:root` restyles every component that uses it. Component hooks follow one convention, `--mtrl-<component>-<name>`:

```css
.brand-slider {
  --mtrl-slider-color: #006a6a;
  --mtrl-slider-on-color: #ffffff;
}
```

## Web components

Overlays open in the browser's top layer (`showModal()` or `popover`) from inside their own shadow root, so they keep their styles, trap focus and make the page inert where M3 says so. Form controls are form-associated: `name`, the form value, reset, validation, `<label for>` and back-navigation restore work as on native controls.

Declaration children describe a component's items, as native `<select>` and `<option>` do:

```html
<m-tabs value="songs">
  <m-tab value="songs">Songs</m-tab>
  <m-tab value="albums">Albums</m-tab>
</m-tabs>
```

The page still loads mtrl's base styles and a theme (see [Styles](#styles)); the elements render in shadow DOM and pick up the theme's tokens. Attributes are defaults and properties the live state, as on native controls: a `checked` or `value` attribute sets the state until the user or a script changes it, and `form.reset()` goes back to it. Form controls take part in forms (their host's `name`), reset, validation and back-navigation restore.

A server-rendered page sends each element as its tag and light DOM; the element takes its real look once its script defines it. So that nothing moves meanwhile, put the pre-upgrade stylesheet in `<head>`: it gives every element not defined yet the box it will have (and its label the final type style), hides what it declares (`<m-tab>`, `<m-menu-item>`, …) and overlays. Its rules match only `:not(:defined)`, in the `mtrl.preupgrade` cascade layer.

```html
<link rel="stylesheet" href="/node_modules/mtrl/dist/elements/preupgrade.css">
```

With another tag prefix, `preupgradeStyles('x')` from `mtrl/elements/preupgrade` returns the same stylesheet for `<x-*>`, to inline on the server. The CSS modules (`mtrl/elements/css`) also apply these rules until the elements are defined, for the default prefix and the one given to `configure()` or `define()`.

## React, Vue, Svelte and Solid

The framework components render the elements, so everything above holds: forms, the top layer, the styling. `mtrl/react`, `mtrl/vue`, `mtrl/svelte` and `mtrl/solid` load the elements' CSS and register each element the first time it mounts.

| Framework | Import | Two-way binding |
|-----------|--------|-----------------|
| React 18 and 19 | `import { Switch } from 'mtrl/react'` | `checked` + `onChange`, or `defaultChecked` |
| Vue 3 | `import { MSwitch } from 'mtrl/vue'` | `v-model` |
| Svelte 5 | `import { Switch } from 'mtrl/svelte'` | `bind:checked` |
| Solid | `import { Switch } from 'mtrl/solid'` | `checked` + `onChange` |

Each framework is an optional peer dependency; mtrl installs none of them. All adapters render on the server and hydrate. Angular apps use the elements directly, with `CUSTOM_ELEMENTS_SCHEMA`.

Each framework has a guide on [md3.io](https://md3.io/docs/): props and events, controlled and uncontrolled state, named slots, refs and server rendering.

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

Some parts load on demand: a button's progress indicator, a card's action buttons, a menu's submenus and the FAB menu's desktop menu. Enable code splitting in your build to keep them out of the initial chunk.

## Building your own components

Components are composed from small features with `pipe`. The same building blocks are public:

```typescript
import { pipe, createBase, withEvents, withElement } from 'mtrl/core/compose';

const createNote = (config: { text?: string } = {}) =>
  pipe(
    createBase,
    withEvents(),
    withElement({ tag: 'div', componentName: 'note' }),
    (component) => ({
      ...component,
      setText(text: string) {
        component.element.textContent = text;
      },
    })
  )(config);

// The component's type is what the pipe builds
type NoteComponent = ReturnType<typeof createNote>;

const note: NoteComponent = createNote();
note.setText('Saved');
document.body.append(note.element);
```

The element gets the `mtrl-note` class, `withEvents` adds `on`, `off` and `emit`, and `destroy()` removes the element. Add `withLifecycle()` from `mtrl/core/compose/features` when features need to register cleanup.

## Markup and sanitizing

Icons and `content` options are markup strings, written with `innerHTML`. Every such write goes through one sink, so you can decide once how markup is treated. Set a policy when the strings can come from users or a CMS, or when your page enforces Trusted Types:

```typescript
import { configureHTML } from 'mtrl';

// A sanitizer
configureHTML({ sanitize: (html) => DOMPurify.sanitize(html) });

// Trusted Types: under `require-trusted-types-for 'script'` a plain string
// assignment throws, so return a TrustedHTML from a policy your CSP allows
const policy = window.trustedTypes.createPolicy('mtrl', {
  createHTML: (html) => DOMPurify.sanitize(html),
});
configureHTML({ sanitize: (html) => policy.createHTML(html) });
```

The policy sees every string, the library's own icons included; a `TrustedHTML` value passed as an icon or content skips it. With no policy set, markup is written as it is. Text options (`text`, a card's `text`) never go through `innerHTML`.

## Moving to `material`

This library continues as the npm package `material`, from version 3.0.0. Stay on the latest `mtrl` 0.10.x until you are ready; then change the package name to `material` (version 3) and follow its migration guide. The `@deprecated` notes and the [changelog](CHANGELOG.md) say what `material` 3.0.0 changes.

## Upgrading from 0.9

0.10.0 adds the elements and framework components; for factory users, most apps need nothing. The changes to check are listed in the [0.10.0 changelog's migration section](CHANGELOG.md#migrating-from-09x): setters no longer emit `change`, the time picker's events pass `{ value }`, the `--mtrl-sys-color-*-rgb` properties are gone, disabled non-form roots use `aria-disabled`, cards are `article`s, and the text field's DOM gained a `__field` wrapper.

## Upgrading from 0.7

0.8.0 aligns the components with Material 3 expressive, and some of that changes the API or the styles:

- `createSheet` is removed; use `createBottomSheet` or `createSideSheet`.
- FAB and extended FAB: `variant: 'primary'`, `'secondary'` and `'tertiary'` are now the tone styles; the former look is `'primary-container'` (the default), `'secondary-container'` and `'tertiary-container'`.
- `createSegmentedButton` is deprecated in favour of `createButtonGroup({ kind: 'connected' })`; its heights are now 40, 36 and 32px by density.
- Component custom properties are renamed to `--mtrl-<component>-<name>`, for example `--drawer-width` to `--mtrl-drawer-width` and `--item-offset` to `--mtrl-list-item-offset`.
- `title-large` uses weight 400, as M3 specifies.
- The slider draws with DOM and CSS; styles for `.mtrl-slider-canvas` no longer apply.

The full list, with every renamed property, is in the [0.8.0 changelog](CHANGELOG.md#080---2026-09-15).

## Browser support

Current Chrome, Edge, Firefox and Safari. The spring motion uses CSS `linear()` easing (Safari 17.2 or later); older browsers render every component but skip those transitions. The elements use form-associated custom elements and the top layer (`popover` and `<dialog>`), both available in every current browser.

## Contributing

Contributions are welcome. [CONTRIBUTING.md](.github/CONTRIBUTING.md) covers the development setup, conventions and the distribution checks.

## License

MIT, see [LICENSE](LICENSE).
