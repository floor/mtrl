# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This changelog starts at 0.8.0, the first release with written notes (September 2026).
Earlier versions are in the [git history](https://github.com/floor/mtrl/commits/main).

## [Unreleased]

### Deprecated

Comments only: nothing changes at run time. Each is changed in 1.0.0, decided after 0.10.6.

- **Told in the TSDoc, for 1.0, the overlays' open and close:** when `open()` or `close()`
  returns, the state has changed and the event has been emitted.
  - **Dialog:** `open` is emitted inside `open()` (without `layer: "top"` it comes about 10 ms
    later today), so a listener added after calling `open()` no longer hears it: add it
    before the call, or listen to `afteropen`. `close()` on a closed dialog emits nothing.
  - **Menu, and the select and split button that hold one:** `close` is emitted inside
    `close()` (about 50 ms later today), while the menu is still in the document, and
    `close()` then `open()` at once reopens it. The `open` and `close` payloads of the menu
    and the select, and the select's `change` payload, lose `preventDefault` and
    `defaultPrevented`, which did nothing there.
  - **FAB menu, `menu` presentation:** `open()` sets `isOpen()` and emits `open` in the call
    (after the menu's module has loaded today), and `close` is emitted inside `close()`.
  - **`<m-menu>` and `<m-fab-menu>`:** the `open` attribute or property set by script is
    applied at once and dispatches no `open` and no `close`, as on `<m-dialog>` (a microtask
    later today, dispatching both). Code that sets it and waits for the event must read the
    state on the next line, or call `show()` / `hide()`, which still dispatch.
  - **Snackbar:** `state` is `"queued"`, not `"visible"`, while a snackbar waits behind
    another, and `hide()` on a queued one emits nothing. 1.0 adds `isOpen()`.
  - **Time picker:** `isOpen` is a method, `isOpen()`, not a property; the config option
    `isOpen` is named `open`, and `TIMEPICKER_DEFAULTS.IS_OPEN` is `OPEN`.
- **Told in the TSDoc, for 1.0, chips:** a chip's `onClick` runs before the chip toggles, so
  `isSelected()` inside it is the state before the click (read the new one in `onChange`); a
  refused deselect in a `selectionRequired` set emits no `change` and calls no `onChange` or
  `onSelect`.
- **Told in the TSDoc, for 1.0, types:** the search's `expand` and `collapse` listeners are
  typed with what they carry, `{ component, state, viewMode }`; the `<m-search>` and
  `<m-timepicker>` components' `on` and `off` take a closed map of event names.
- **`splitButton.menu`:** its note now names what 1.0 gives in its place for the items,
  `setItems()` and `getItems()`.
- **Typography leaves `mtrl/styles/base` in 1.0.** The type classes (`.mtrl-display-large` …
  `.mtrl-label-small`), the text utilities, mtrl's styles for `h1`–`h6` and `p`, and the
  `--mtrl-sys-typescale-*` properties other than body-medium's then need
  `import 'mtrl/styles/typography'`. The full stylesheet, `mtrl/styles`, is unchanged. There
  is nothing to change on 0.10.x: the new entry does not exist here.
- **Explicit contrast levels leave `mtrl/styles/base` and the themes in 1.0.**
  `data-theme-contrast="medium"` and `"high"` then need `import 'mtrl/styles/contrast'`
  (and `mtrl/themes/<name>-contrast` for a theme imported on its own); without it the
  attribute changes no colour and nothing warns. Standard contrast and `prefers-contrast: more`
  stay in the base, and the full stylesheet, `mtrl/styles`, still includes the levels. There
  is nothing to change on 0.10.x: the new entries do not exist here.

### Changed

- **Documented, three limits of 0.10.x that 1.0 fixes and 0.10.x does not** (each is a
  sentence in the TSDoc):
  - a `layer: "top"` dialog that refuses Escape (`closeOnEscape: false`, or a `beforeclose`
    listener that prevents it) is still closed by the third press (to be fixed in 1.0);
  - a snackbar waiting behind another, then dropped by a `queueBehavior: 'replace'` snackbar
    or by `clearSnackbars()`, keeps `state` `"visible"` and cannot be shown again: create a
    new one;
  - a docked date picker opened with `open()` from a click outside it is closed by that same
    click: call `open()` once the click has finished.

## [0.10.6] - 2026-10-02

The release that announces 1.0.0. Everything decided for 1.0.0 as of this release that 0.10.x
had not yet marked is now told in the code, as `@deprecated` or as an "In 1.0 …" note in the
TSDoc, so your editor shows each one before you move to 1.0.0. Later decisions will be
announced in a further 0.10.x release before 1.0.0: upgrade to the latest 0.10.x first. None
of those notes changes anything at run time. Also three fixes: reduced motion inside the
elements (an accessibility fix), the button group's press, and the tooltip's placement.

### Deprecated

Comments only: nothing changes at run time. Each is removed or changed in 1.0.0.

- **`select.textfield`: 1.0 renames it `textField` and keeps no alias.** This corrects 0.10.5's
  note, which said `textfield` "remains as an alias through 1.x": in 1.0 `select.textfield` is
  `undefined`. 0.10.x has no `textField`, so rename it when you upgrade, as with
  `SELECT_CLASSES.TEXTFIELD` (FLO-383).
- **The icon button's DOM `toggle` event** is removed in 1.0: listen to `change`, which the
  factory's button and `<m-icon-button>` have emitted since 0.10.0 (FLO-295). The deprecation,
  until now only in 0.10.0's notes, is on the `toggle` option and on the element's event.
- **`RADIO_DEFAULTS.VARIANT`, `.LABEL_POSITION` and `.SIZE`** (`mtrl/components/radios/constants`):
  the radios have no such options, and nothing reads the keys. `DIRECTION` stays.
- **Told in the TSDoc, for 1.0:** `emit` on the card and the tabs accepts only the component's
  own events; the radio factory's `change` reports `null`, not `""`, when nothing is selected;
  `withInput`'s `change` reports the checked boolean as `value`, with the input's string value
  as `valueAttribute`.
- **`select.menu` and `splitButton.menu`** (the inner menu component) are removed in 1.0. Use
  the component's own methods and events: on the select `open()`, `close()`, `isOpen()`,
  `getOptions()`, `setOptions()` and `open`, `close`, `change`; on the split button `expand()`,
  `collapse()`, `isExpanded()` and `expand`, `collapse`, `select` (FLO-543).
- **Told in the TSDoc, for 1.0, values and payloads:**
  - the radio factory's `getValue()` returns `null` when nothing is selected, and `setValue`
    accepts `null` to clear;
  - `withInput`'s `getValue()` and `setValue()` work on the checked boolean, the string is
    `getValueAttribute()` / `setValueAttribute()`, and `setValue` emits no `value` event;
  - the carousel's `change` carries the index as `value`, and `index` is gone.
- **Told in the TSDoc, for 1.0, the `on*` options that become their event's listener:** each
  receives what a listener passed to `on(event)` receives.
  - Time picker `onConfirm`: `{ value }`, not the time string.
  - Search `onSubmit` and `onInput`: the `SearchEvent` (the query is `event.value`), not the
    string. `onClear`: the `SearchEvent`. `onSuggestionSelect`: the `SearchEvent` (the
    suggestion is `event.suggestion`). `onExpand` and `onCollapse`: the event's object.
  - Navigation rail `onExpand` and `onCollapse`: `{ expanded: true }` and `{ expanded: false }`.
  - A chip's `onChange`: one object, `{ selected, chip, value }`, not `(selected, chip)`. A
    chip's `onClick`: `{ event, originalEvent, element }`, not the chip. The chip set's
    `onChange`: one object, `{ value, selected, changed }`, and it also hears
    `selectByValue(values, true)`.
- **Told in the TSDoc, for 1.0, the button group's `on` map** (`click`, `focus`, `blur`,
  `change`): on 0.10.x it is accepted and never called, so subscribe with
  `on(event, handler)` on the group. In 1.0 those handlers run, with the listener's argument.

### Fixed

- **Accessibility: reduced motion is honoured inside the elements (FLO-549).** With the system's
  reduced-motion preference on, mtrl limits transitions to fades and ends animations at once,
  from a rule in the page's stylesheet. That rule did not reach an element's shadow root, so
  inside `<m-button>`, `<m-button-group>`, `<m-icon-button>`, `<m-fab>`, `<m-extended-fab>`,
  `<m-card>`, `<m-chips>`, `<m-tabs>`, `<m-slider>`, `<m-radios>`, `<m-tooltip>` and `<m-badge>`
  movement ran as if the preference were off (the button's corner morph, the button group's
  width and corner springs), and in the other elements only the parts their own stylesheet
  names were reduced. Every element's shadow root now carries the same rule. The ripple and
  the motion driven from script (progress, loading indicator, carousel, date picker, FAB menu)
  already honoured the preference, and so did the factories outside a shadow root.
- **Button group (FLO-537):** Pressing a button in a standard group briefly showed an ellipsis
  on a neighbour's label. The neighbour's width and padding now ease together, and the width
  returns to the label's own size when the press ends. In a right-to-left page the
  neighbour's padding now gives way on the side facing the pressed button; it was the
  opposite side.
- **Tooltip placement (FLO-535):** With motion enabled, a tooltip could settle 5% of its width off
  centre while animating in and be squeezed at the viewport edge. Placement now uses its full
  layout size; the first placement under reduced motion is unchanged.

## [0.10.5] - 2026-10-02

Preparing for 1.0.0, continued: every exported identifier writes "text field" as two words
(`createTextField`, `TextFieldConfig`, …), beside the old names, which are deprecated with the
other names and members 1.0.0 removes. Also contrast levels on every theme, opt-in wheel
scrolling on the carousel, and the text field's required asterisk, announced errors and trailing
icon button.

### Added

- **Canonical names (FLO-383):** `createTextField`, `TextFieldConfig` and `TextFieldComponent` (M3
  writes "text field" as two words), `CardConfig`, `TopAppBarComponent` and
  `BottomAppBarComponent`, from `mtrl` and from each component's subpath. They are the same
  factory and types as the old names. `createTopAppBar` now returns the one public `TopAppBar`
  declaration (`top-app-bar.ts` had a second); assignability is unchanged.
- **"Text field" in two words everywhere in the API (FLO-383):** `TextFieldDensity`,
  `TextFieldEvents`, `TextFieldValuePayload`, `TextFieldFocusPayload` and
  `TextFieldTrailingPayload` (`mtrl/components/textfield`); `TEXT_FIELD_VARIANTS`, `_STATES`,
  `_TYPES`, `_EVENTS`, `_DENSITY`, `_DEFAULTS` and `_CLASSES`
  (`mtrl/components/textfield/constants`); `textFieldElement`, `defineTextField`,
  `TextFieldSpec`, `TextFieldElement` and `TextFieldElementComponent` (`mtrl/elements`); and the
  `TextField` component in `mtrl/react`, `mtrl/solid` and `mtrl/svelte`, `MTextField` in
  `mtrl/vue`. Each is the same binding as the old spelling. Every exported identifier is two
  words; string values are unchanged: the `<m-textfield>` tag, CSS classes, event strings and
  the constants' values, as are folders.
- **API gaps from the 1.0 audit (FLO-384).**
  - `isDisabled()` on every component that can be disabled and lacked it: button, icon button,
    FAB, extended FAB, checkbox, switch, text field, select, radios, button group and a tab.
  - Exported beside their factories: `ButtonEvents` (`mtrl/components/button`), `MenuEvents`,
    `SelectEvents`, the button group's `ButtonGroupKind`, `ButtonGroupSelection` and
    `ButtonGroupChangeEvent`, and `createTab` from `mtrl/components/tabs`.
  - Event maps that now declare what is already emitted: a toggle button's `change`
    (`{ selected }`), the card's `expandedChanged` and the list's `keydown`. The list's
    `scroll` is typed as the forwarded payload; its `component` field, never sent, is optional
    and deprecated (1.0 removes it).
  - The `mtrl/components/<name>/constants` subpaths' exports are pinned beside the indexes
    (`bun run component-exports:check`).
- **Contrast on every theme (FLO-406).** `data-theme-contrast="standard"`, `"medium"`
  and `"high"` select M3 contrast levels in light and dark. Put the attribute on the
  same element as `data-theme`, including each nested theme. With no contrast attribute,
  `prefers-contrast: more` selects high on every themed element independently; explicit
  `standard` opts out on that element. A nested theme does not inherit an ancestor's
  contrast setting or opt-out. The unthemed root follows the OS color scheme and
  `.dark-theme` at every contrast level, ignoring `data-theme-mode`.
  Hand-authored medium and high palettes use each theme's documented seed, falling back
  to its light primary, and preserve the light secondary and tertiary hues and chroma.
  M3 supplies the contrast tones; neutral palettes come from the seed. Generated headers
  name all three inputs, and browser checks share the generator's input selection.
  Hand-authored standard colors and success, warning and info roles stay unchanged.
  The `highcontrast` theme is a theme in its own right and supports all three contrast settings.

- **Carousel: opt-in mouse wheel scrolling (FLO-395).** Set `wheel: true`, call
  `setWheel(true)`, or add `<m-carousel wheel>` (also toggleable after creation).
  Horizontal layouts accumulate wheel momentum and preserve glide velocity to the snap
  point at or beyond that distance, at least one item per notch. Targets advance
  through whole items; 120 ms of quiet or a reversal starts a new gesture. Edges let
  the page scroll, horizontal trackpad gestures and zoom stay native, and reduced
  motion jumps straight to the target. Pointer, touch and keyboard input interrupt the
  glide; CSS snap resumes at rest. Full-screen carousels keep native vertical scrolling.

- **Every release gets its GitHub Release.** The release workflow published to npm only, so
  GitHub showed 0.9.8 as the latest release. Once npm has the version, it now creates the
  release for the tag from the version's CHANGELOG section, with links to npm, md3.io and this
  file; a pre-release (`-next.N`) is marked one and never becomes Latest. 0.10.0 to 0.10.4 were
  created by hand.
- **Text field: a required field's label ends in an asterisk (FLO-301).** M3's text field
  guidelines mark a required field with an asterisk after its label; it is in the label's colour,
  as Material Web draws it, and hidden from screen readers, which the input's native `required`
  already tells. `setRequired()` and `isRequired()` move it with the input, and `<m-textfield>`'s
  `required` attribute does too. `noAsterisk: true` leaves it off, for a form that marks its
  optional fields instead.
- **Text field: an interactive trailing icon is a button (FLO-301).** `trailingIconLabel` (or
  `setTrailingIcon(html, label)`) renders the trailing icon as a `<button>` with that accessible
  name, as Compose's trailing slot holds an `IconButton`: a 40dp state layer, a 48dp target, a
  keyboard focus ring, in the tab order after the input and disabled with the field. Activating
  it emits `trailing` with `{ value, event }` and calls `onTrailingClick`. Without a label the icon
  stays the decorative span it was. (`<m-textfield>` and the framework adapters follow in a later
  release.)
- **Text field: errors are announced when they appear (FLO-301).** The supporting text is a polite
  live region, so an error set with `setError(true, message)` is read without the field being
  refocused. Its element now stays and its text changes in place.

### Changed

- **A plain filled text field sets no placement up (FLO-378).** Every text field installed a
  class observer, a resize observer and a window `resize` listener, and scheduled a first
  measure, even a filled field with no prefix, suffix or leading icon, which has nothing to
  place. They now wait for the first setter that gives it something to place (variant, label,
  icons, affixes, required, density). Mounting 1,000 filled fields takes 16% less script time
  (49.9 to 41.8 ms; 192 to 165 ms at 4× CPU), with 1,000 fewer listeners. Nothing renders
  differently.
- **CI runs the same checks in less time.** The browser checks run in four groups instead of
  three, the package checks no longer hold the browser groups back, and Playwright's browser and
  its system packages come from a cache that every pull request can read (a slow Ubuntu mirror
  made one install step take 26 minutes). `test/build/ci-commands.test.ts` lists the commands CI
  runs and fails when one is dropped.

### Deprecated

- **The ripple defaults of options never applied (FLO-268):** `DEFAULT_RIPPLE_CONFIG.TIMING` and
  `.OPACITY` (`mtrl/components/button/constants`, `mtrl/components/icon-button/constants`) and
  `BUTTON_GROUP_DEFAULTS.RIPPLE_TIMING` and `.RIPPLE_OPACITY`. They have no effect: the options they
  are the defaults of, `rippleConfig`'s `timing` and `opacity`, are never applied (deprecated in
  0.10.0). Removed in 1.0. Comments only; nothing changes at run time.

- **The small FAB's class and icon size:** `FAB_CLASSES.SMALL` and `FAB_ICON_SIZES.SMALL`
  (`mtrl/components/fab/constants`). The small size they belong to, `FAB_SIZES.SMALL`, is already
  deprecated (M3 Expressive). Removed in 1.0. Comments only; nothing changes at run time.

- **`CheckboxVariant`** (`mtrl/components/checkbox`): the type of the checkbox's `variant` option,
  deprecated in 0.10.0, which has no effect (M3 has one checkbox style). Removed in 1.0. Comments
  only.

- **`SELECT_CLASSES.TEXTFIELD`** (`mtrl/components/select/constants`): 1.0 renames the key
  `TEXT_FIELD`, as every text field name (FLO-383). The class string, `select__textfield`, stays.
  Comments only; the new key is not on 0.10.x.

- **`select.textfield`** (the select's property): renamed `textField` in 1.0, as every text field
  name (FLO-383); `textfield` remains as an alias through 1.x. Comments only.

- **`CardComponent`'s `loading`, `expandable` and `swipeable`** (`mtrl/components/card`): `createCard`
  never sets them; only the deprecated `withLoading`, `withExpandable` and `withSwipeable` features
  add them. Removed in 1.0 with those features (FLO-381). Comments only.

- **The text field's Sass map and function: `$textfield` and `textfield()` (FLO-383).** Use
  `$text-field` and `v.text-field()`, the same map: a theme may configure either name until 1.0
  removes the old one. The built CSS is unchanged.

- **The old names, renamed (FLO-383):** `createTextfield` → `createTextField`, `TextfieldConfig` →
  `TextFieldConfig`, `TextfieldComponent` → `TextFieldComponent`, `CardSchema` → `CardConfig`,
  `TopAppBar` → `TopAppBarComponent`, `BottomAppBar` → `BottomAppBarComponent`; and the
  rest of the old text field spelling: `TextfieldDensity`, `TextfieldEvents`, the three
  `Textfield*Payload` types, the seven `TEXTFIELD_*` constants, `textfieldElement`,
  `defineTextfield`, `TextfieldSpec`, `TextfieldElement`, `TextfieldElementComponent`, the
  `Textfield` adapter component and Vue's `MTextfield`. Each is flagged
  where it is imported and removed in 1.0. Tags, CSS classes, folders and events keep their
  names.
- **Component internals on their subpaths (FLO-381).** `mtrl/components/<name>` is public API, and
  some indexes re-exported implementation details. These are deprecated there and removed in
  1.0.0, with no replacement (they are internal):
  - **card:** `withAPI`, `withLoading`, `withExpandable`, `withSwipeable`, `withElevation`, and the
    types `LoadingFeature`, `ExpandableFeature`, `SwipeableFeature`;
  - **tabs:** `withTabsManagement`, `withScrollable`, `withDivider`, `withIndicator`,
    `addScrollIndicators`, `createTabsState`, `createTabIndicator`, `updateTabPanels`,
    `setupKeyboardNavigation`, and the types `TabsManagementConfig`, `TabsManagementComponent`,
    `ScrollableConfig`, `ScrollableComponent`, `DividerConfig`, `IndicatorFeatureConfig`,
    `IndicatorComponent`;
  - **switch:** `withSupportingText` and `SupportingTextComponent`;
  - **datepicker:** `DEFAULT_DATE_FORMAT`;
  - **chips:** `ChipConfig`'s `managedSelection` and `cell`, set by the chip set, leave `ChipConfig`.

  **Nested subpaths:** `./components/*` also matched folders inside a component, so these resolved
  and leave in 1.0.0, when the components are listed one by one: `mtrl/components/bottom-sheet/features`,
  `carousel/features`, `chips/chip`, `chips/features`, `drawer/features`, `list/features`,
  `menu/features`, `progress/features`, `search/features` (the low-level `withInput`),
  `side-sheet/features`, `slider/features`, `textfield/features`, and
  `mtrl/components/chips/chip/constants`.

  Kept public: `SlidesAPI`, `IconAPI`, `ToggleManager` and `IndicatorConfig`, which public members
  are typed with, and tabs' documented `setupResponsiveBehavior`. Each component's export list is
  now pinned (`bun run component-exports:check`).

- `TOOLTIP_DEFAULTS.RICH` is deprecated: the tooltip's `rich` option, already deprecated, has no
  effect, and 1.0 removes both (FLO-324).

### Fixed

- Arrow keys used soon after opening a menu keep their selected focus when the initial-focus timer runs (FLO-515). A menu opened with ArrowUp on its opener now keeps focus on the last item (it was pulled back to the first; FLO-524).
- A search view dismissed before its opening focus frame runs stays closed (FLO-514).
- The top-layer menu steps of `elements:check` no longer read focus before the menu has given it
  back. A menu returns focus to its opener in the animation frame after it closes; the check read
  the state after a fixed 450ms, and on a runner that produced no frame in that time it found
  focus nowhere. It now waits for the opener's focus, after the same 450ms.
- The menu keyboard step of `elements:check` no longer ends one item short when a runner pauses
  (FLO-423). It waited a fixed 450ms after opening the menu with a key, then sent the arrows; it
  now waits for the first item to take focus, which is what the arrows depend on.
- The search check in `core:check` no longer times out when a frame arrives late (FLO-420). It
  pressed the scrim before the view's opening had put focus back on the input, and that focus
  re-opened the view. The check now waits for the opening's frame, and reads the scrim press at
  once, which it could not tell from the input's blur before.
- **ArrowLeft and Escape work in a submenu whose parent item's id holds a quote or a backslash
  (FLO-429).** They threw, or did nothing, because the id was put into a CSS selector.
- CI's `static` job prints the output of a failing check again. Under the job's shell a failing
  check ended before its status was recorded, and the step stopped with "exit code 1" and nothing
  else, so the failure could not be read from CI.
- The checkbox and switch change payload docs said setters emit `change`; they are silent, as
  they have been since FLO-328 (FLO-384).

- **Search keeps custom root classes (FLO-421).** Both contained and divided
  search variants apply the `class` option, including space-separated classes.
- **Tabs with quotes or backslashes in their value no longer fail to link panels (FLO-417).**
  Panel lookup compares `aria-labelledby` directly with the tab id, so values
  that are CSS selector syntax are handled as data.

- The carousel wheel check in `core:check` no longer fails when a CI runner stalls a frame. A
  283ms stall split its 30-event wheel gesture in two, and the carousel correctly went one slide
  further than the recording expected. A recording with a frame over 50ms is now taken again
  (three in a row fail); the assertions are unchanged (FLO-395).
- **Status text meets 4.5:1 (FLO-407).** Success, warning and info are one fixed
  pair per mode, shared by every theme. White on the light warning (`#DD6D06`)
  was 3.35:1. Each colour keeps its hue and chroma at the tones M3 uses for a
  role and its on-role (light tone 40 on 100, dark tone 80 on 20). Ratios, old
  then new: light success 5.28 → 6.45, warning 3.35 → 6.48, info 6.47 unchanged;
  dark success 7.08 → 7.76, warning 8.57 → 7.76, info 7.75 → 7.69.
- **Custom root classes survive configuration (FLO-403).** Top and bottom app bars,
  button groups, segmented buttons, tabs and individual tabs, toolbars, FAB menus,
  and selects now apply the `class` option to their root element, including
  space-separated classes. They read the normalized `className` field or forward
  it to their underlying control.

- **Progress and loading indicators draw the theme of the section they're in, not only the
  page's (FLO-389).** The progress canvas read its colours from `<body>` and `:root`, so in a
  themed section, a card or a dark panel it drew the page's colours: light ones in a dark section.
  It now reads them on its own element, where the section's theme (or a shadow host's) inherits.
  A `data-theme` or `data-theme-mode` change on any element, not only `<html>` and `<body>`,
  redraws both indicators. `getThemeColor` takes an `element` option to read the theme where that
  element sits.
- **`<m-dialog>`'s buttons and dividers are styled (FLO-386).** A shadow root adopts only the sheets
  its element names, and the dialog named only its own: its action buttons (from `buttons` or the
  global defaults) rendered without the button stylesheet, 70 computed properties apart from the
  same button in the page, and its dividers without theirs. It now carries both. A new check,
  `shadow-styles:check`, fails on any component class drawn in a shadow root without its sheet,
  across all 36 elements.
- **A FAB or icon button opening a menu keeps its shape while the menu is open (FLO-386).** The
  menu gave any `<button>` opener the button's `--active` class, whose pressed rule turned the FAB
  menu's FAB from 16 to 8px corners and took its shadow away (`presentation: 'menu'`). Only an mtrl
  button, such as the split button's trailing button, keeps its pressed shape now; other openers
  get `mtrl-menu__opener--active`.
- **Text field: the leading icon is hidden from screen readers (FLO-301).** It is decorative; the
  label names the field.

## [0.10.4] - 2026-10-01

Preparing for 1.0.0: the internal helpers re-exported from the package root are deprecated there,
each with its subpath, so apps can move their imports before 1.0.0 removes them. The date
picker's range band now runs to the container edge where a range wraps a week, as in M3.

### Deprecated

- **137 internal names on the package root (FLO-351).** Every root export is public API, and the
  root re-exported all of `mtrl/core`: the composition core, DOM and timing helpers, the store,
  the progress indicator's canvas code. In 1.0.0 the root keeps the components, `configureHTML`,
  the theme helpers (`schemeToTokens`, `THEME_ROLES`) and the global defaults; everything else
  leaves it. Each name is the same export at its subpath, so only the import changes, and the
  deprecation shows in your editor on the root import alone. The
  [migration table](https://github.com/floor/mtrl/blob/main/scripts/fixtures/root-exports.md)
  lists every name and its path; the largest group is the composition core:

  ```ts
  import { pipe, createBase, withEvents } from 'mtrl';            // deprecated
  import { pipe, createBase, withEvents } from 'mtrl/core/compose';
  ```

  **The subpaths are ESM-only, and 1.0.0 is ESM-only.** CommonJS (`require('mtrl')`) reaches only
  the root, so on 0.10.x a CommonJS app keeps its root imports and moves to ESM for 1.0.0.

  No runtime change: the root's runtime exports and the bundles are the same. The root's export
  list is now pinned (`bun run root-exports:check`).

### Fixed

- **Date picker: the range band runs to the container edge where it wraps a week.** As in
  m3.material.io's range picker, the row a range leaves runs the band out to the end edge and the
  row it continues on starts it from the start edge; it stopped at the day grid, 12dp short on
  each side. Docked, modal and full screen, mirrored right to left. The grid's inline padding is
  `--mtrl-datepicker-grid-inset` (12px), which the band follows. Days of another month shown in
  the grid are no longer in range (no band, `aria-selected="false"`): the band stays in the shown
  month.

## [0.10.3] - 2026-10-01

Text field fixes: a disabled, empty field no longer shows its placeholder over the label, and
prefix and suffix text wait for the label to float. The corner scale gains M3's two largest steps,
the search bar's corners follow the theme, and the three shape steps outside M3's scale are
deprecated ahead of 1.0.0.

### Added

- **M3's two largest corner steps (FLO-345).** `extra-large-increased` (32px) and
  `extra-extra-large` (48px), from Compose's `ShapeTokens`, join the shape scale:
  `v.shape('extra-large-increased')` in Sass, `--mtrl-sys-shape-corner-extra-large-increased` and
  `--mtrl-sys-shape-corner-extra-extra-large` on `:root`, and both in the `ShapeStep` type.

### Fixed

- **A disabled, empty text field no longer shows its placeholder over the label (FLO-354).** The
  disabled input's `-webkit-text-fill-color` was inherited by the placeholder and painted over its
  transparent colour, in both variants and in every engine. The placeholder now shows only while
  the label floats (or when there is no label), disabled or not.
- **A resting label no longer sits between the prefix and suffix (FLO-355).** An empty, unfocused
  field with `prefixText` and `suffixText` showed "$ Name … USD". While the label rests in the input
  area it is now all that area shows; the prefix and suffix fade in as the label floats, in both
  variants, with or without an icon, enabled or disabled, and in `<m-textfield>`.
- **The search bar's corners follow the theme (FLO-345).** The bar was rounded with the mtrl-only
  `pill` step (100px), so a theme's `--mtrl-sys-shape-corner-full` never reached it, and opening
  the view held the corners still before they snapped square. The bar is now M3's full corner
  as half its height, `min(var(--mtrl-sys-shape-corner-full, 9999px), 28px)`, and the corners
  ease from the first frame.
- **The checkbox's 2px corner is a literal (FLO-345),** as `CheckboxTokens.ContainerShape` defines
  it outside the shape scale, instead of the mtrl-only `tiny` step.

### Deprecated

- **The shape steps `extra-tiny`, `tiny` and `pill` (FLO-345)** are not on M3's scale and are
  removed in 1.0.0, with their `--mtrl-sys-shape-corner-*` properties. Write `extra-tiny` and
  `tiny` as a literal radius; replace `pill` with `full`, or with half the component's height when
  its corners animate.
- **The `$mtrl-sys-shape` map in `abstract/theme` (FLO-345)** is unused and removed in 1.0.0. Use
  `v.shape()`.

## [0.10.2] - 2026-10-01

The full Material 3 Expressive shape library: all 35 of Compose's shapes in `mtrl/core/shapes`,
verified against Google's own geometry code, with the loading indicator's shapes now exact. Also
keyboard fixes in tabs and chips, and the chip set's keyboard switch typed.

### Added

- **The 35 Material 3 Expressive shapes in `mtrl/core/shapes` (FLO-346).**
  - **Shapes:** every one of Compose Material 3's `MaterialShapes`, from `shapeCircle` and
    `shapeSquare` to `shapeCookie12Sided`, `shapePixelTriangle` and `shapeHeart`. Each is a
    `RoundedPolygon` normalised into the unit square, built once on first use.
  - **One export per shape,** so a bundle carries only the shapes it names: one shape and
    `polygonPath` are 2.6 KB gzip.
  - **`materialShape(name)` and `materialShapePath(name, size)`** look any shape up by name, and
    carry all 35 (4.2 KB gzip). `MaterialShapeName` lists Compose's names, camelCased; `'cookie4'`
    and `'cookie9'` stay as deprecated aliases of `'cookie4Sided'` and `'cookie9Sided'`.
  - **`polygonPath(polygon, size)`** gives a polygon's outline as an SVG path. Also new are
    `rectangle()` and `splitCubic()`.
  - **Verification:** a port of Compose (Apache 2.0) at androidx `080d2b3e`, held cubic for cubic
    to Compose's own builders run on graphics-shapes 1.0.1, the version Compose depends on
    (`test/fixtures/material-shapes.json`, from `scripts/generate-material-shapes.kt`).
  - **`radialProfile`** now throws for a shape that is not star-shaped around its centroid, rather
    than return a wrong profile. Of the Material shapes, `puffy` and `pixelTriangle` are not.
  - Not exported from the package root.
- **`chips.keyboard` is typed (FLO-352).** A chip set had `keyboard.enable()` and
  `keyboard.disable()` at runtime without them in `ChipsComponent`, so TypeScript needed a cast to
  turn the arrow keys off.

### Fixed

- **The loading indicator's shapes match Compose exactly (FLO-346).** Rounded polygons now start
  their outline in the middle of the first corner's arc, as graphics-shapes does. Normalised from
  that outline, each shape is up to about 1.6% larger, and its outline starts where Compose's does. Its
  shapes' names are now `'cookie9Sided'` and `'cookie4Sided'` in `LOADING_INDICATOR_SHAPES`.
- **Keyboard fixes in tabs and chips**, found while moving them onto `createRoving` (FLO-343, not
  merged):
  - The arrows skip a tab marked `aria-disabled`, as they skip a disabled one.
  - In a right-to-left page, the arrows follow the reading direction inside `<m-chips>`: the
    chips read the direction with `:dir(rtl)`, which crosses the shadow root, where
    `closest("[dir]")` did not.
  - `keyboard.disable()` on a chip set stops the arrows. The set's own listener kept handling them.

## [0.10.1] - 2026-10-01

The first patch after 0.10.0: the FAB menu's open and close motion now follows Compose, its
`select` carries `value` like every other component, the dialog, time picker and sheets no longer
show their headline as a tooltip, and the published `package.json` is only what consumers use.

### Changed

- **The FAB menu's `select` also carries `value`** (the item's id, as `id` does). It matches the
  `value` in `<m-fab-menu>`'s `select` detail and the menu's own payload (FLO-320), so one handler
  reads the same field from the factory and the element.

- **The published `package.json` carries only what consumers use (FLO-350).** npm packs the
  repository's root manifest, which since 0.10.0 also held the repository's `eslintConfig` and
  `typedocOptions`, beside its `scripts`. The release now builds as its own step and drops those
  three fields before publishing. Nothing a consumer reads changes.

### Fixed

- **The dialog, the time picker and the sheets no longer show their headline as a tooltip
  (FLO-347).** Their `title` option is the headline, and it was also written as the element's
  `title` attribute, so hovering anywhere in an open dialog showed the browser's native tooltip.
  The headline still names each surface through `aria-labelledby`. The dialog's role is
  unchanged: a basic dialog is an `alertdialog`, as the M3 site asks on the web, and a full-screen
  one is a `dialog`; `role` overrides it.
- **The FAB menu's motion follows Compose (FLO-348).**
  - The close button's corner now morphs from the FAB's 16, 20 or 28dp to 28dp. It was animated
    towards the full-shape 9999px, so it went round in one frame, and on closing the spring's
    undershoot squared it for about 120ms.
  - The items reveal their width as pills, their content anchored to the end, with FastSpatial's
    overshoot. They were clipped with a square leading edge.
  - Colours move on the spring with its progress clamped, so they no longer pass their target.

## [0.10.0] - 2026-09-30

mtrl 0.10.0 is on npm `latest` (`npm install mtrl`), after four prereleases on `next`. Every
component now ships three ways from one implementation: the factory (`createButton`), a custom
element (`<m-button>`, from `mtrl/elements`) and React, Vue, Svelte and Solid components
(`mtrl/react`, `mtrl/vue`, `mtrl/svelte`, `mtrl/solid`), generated from the element specs, which
render on the server and hydrate. Overlays open in the browser's top layer. The M3 Expressive
toolbar and FAB menu are new, colour roles follow M3's current baseline with eight generated
scheme variants, and the typeface and corner shapes are themeable through tokens. The
documentation and playgrounds moved to [md3.io](https://md3.io).

This section lists what changed since 0.10.0-next.3; the prerelease sections below describe the
rest. Everything since 0.9.8 is in this release.

### Migrating from 0.9.x

Most apps need nothing. Check these if you use them:

- **Setters are silent.** `check()`, `setValue()`, `select()` and the like no longer emit
  `change`, `input` or `select`; only the user's input does, as on the platform. Update your own
  state where you call them. Exceptions: the carousel's navigation, the progress indicator's
  `setValue()`, the split button's `expand()` / `collapse()`.
- **Time picker events pass `{ value }`.** `(time) => …` becomes `({ value }) => …` for
  `change`, `input`, `onChange` and `onInput`; `confirm` still passes the string.
- **`--mtrl-sys-color-*-rgb` are gone.** `rgba(var(--mtrl-sys-color-X-rgb), N)` becomes
  `color-mix(in srgb, var(--mtrl-sys-color-X) N%, transparent)`.
- **Disabled non-form roots use `aria-disabled`.** Read `[aria-disabled="true"]` or the
  `--disabled` class instead of `[disabled]` on progress, date picker and other `div` roots.
- **Cards are `article`s.** A card that acts on activation sets `clickable`; `interactive` alone
  is visual. Tests reading `[role="region"]`, `[role="heading"]` or the subtitle's `h4` read the
  `article` role and the `__header-title` / `__header-subtitle` classes.
- **Text field DOM.** The label, input and outline sit in `__field`, and supporting text in
  `__supporting`: selectors like `.mtrl-textfield > .mtrl-textfield__input` go through
  `.mtrl-textfield__field`.
- **Deprecated, removed in 1.0:** the themes `material`, `winter`, `browngreen` and `legacy`
  (use `baseline` or a generated variant), the chips set's array payload, tooltip `rich`, dialog
  button `color`, card `withElevation`, `getThemeColor('…-rgb')`.

Each item's full entry, with the reason, is below.

### Added

- **FAB menu: M3 Expressive's FAB menu (FLO-306).** `createFabMenu` makes a FAB that opens 2 to 6
  related actions, in two presentations, as m3.material.io lays them out:
  - **List (compact windows).** The FAB turns into a 56dp round close button, pinned to its top
    trailing corner. Pill items (56dp high, a 24dp icon and a title-medium label) rise above it,
    8dp away and 4dp apart. They stagger in from the one nearest the FAB, with delays taken from
    Compose's SlowEffects spring; under reduced motion they fade in without a stagger.
  - **Menu (the site's rule on the web).** The FAB opens the baseline menu, 4dp away. The menu is
    loaded with `import()` when first needed, and preloaded in a wide window or when the FAB is
    first pointed at or focused. `menu` lets an app bring its own.
  - **Choosing:** `presentation: 'auto'` (the default) takes the list below 600px and the menu from
    600px, and never switches while open.
  - **Options:** `color` is `primary`, `secondary` or `tertiary` (the FAB on the role's container,
    the close button on the role, the items on its container). `size` is `default`, `medium` or
    `large`. `placement: 'bottom-end' | 'bottom-start'` sits 16dp from the window edges, 24dp in
    large windows.
  - **Accessibility:** the FAB is a menu button (`aria-haspopup`, `aria-expanded`, `aria-controls`)
    named after the menu, and the items are `menuitem`s of a `menu`. Opening the list keeps focus
    on the close button. ArrowDown or Tab goes to the top item and ArrowUp to the nearest; in the
    list the arrows wrap and Home and End go to the ends. Escape or Tab out closes the list on the
    FAB, and so does choosing an item. A press outside closes it.
  - **Events:** `select` with the item's `id`, plus `open` and `close`.
- **`<m-fab-menu>` (FLO-306).** The FAB menu as an element and in every adapter.
  - `<m-fab-menu-item value icon>Label</m-fab-menu-item>` children declare the actions.
  - `icon` and `aria-label` go to the FAB. `color`, `size`, `presentation` and `placement` are the
    factory's options.
  - `open` is state, as on `<m-menu>`: it reflects whether the menu is open, and setting it opens
    the menu.
  - `show()`, `hide()` and `toggle()`, and the events `open`, `close` and `select` (with
    `{ value }`).
  - The menu presentation's baseline menu renders in the element's shadow root, next to the FAB,
    in the top layer.
  - Pre-upgrade styles give the undefined host the closed FAB's box and colour.
- **Size budgets for lazy chunks.** `scripts/size.ts` budgets what a component loads with
  `import()` apart from its initial graph: the menu's submenu feature, and the FAB menu's menu.

- **Toolbar: M3 Expressive's docked and floating toolbars (FLO-304).** `createToolbar` makes
  the docked toolbar (full width, 64dp, square corners, items spread or centred 32dp apart) or the
  floating one (a 64dp pill, 8dp padding, items 4dp apart, elevation level 1 unless
  `elevated: false`), horizontal or vertical, in `standard` (surface container) or `vibrant`
  (primary container) colour. `placement` docks it at the bottom, or floats it 16dp from the
  window edge (24dp when vertical). Items are icon button or button configs, or any element or
  component, such as a text field. A paired `fab` sits beside the toolbar, outside its tab stop.
  `overflow` adds a "more" button and hands it to a menu the caller builds
  (`(opener) => createMenu({ opener, items })`), so the toolbar does not pull in the menu.
  `scrollBehavior: 'exit'` moves it off screen, and out of the focus order, while the content
  scrolls forward (40px threshold, window or `scrollTarget`). The element with the `toolbar` role
  is one tab stop: the arrow keys along the layout, Home and End, disabled items skipped, the keys
  left to a text field's caret.
- **`<m-toolbar>` (FLO-304).** The toolbar as an element and in every adapter.
  - Its children are the items (`<m-icon-button>`, `<m-button>`, a text field). The toolbar walks
    their hosts as one tab stop; each host delegates focus to its control.
  - `slot="fab"` takes a FAB, beside the toolbar and outside its tab stop.
  - `slot="overflow"` takes an `<m-menu>`, which the toolbar anchors to the "more" button it adds.
  - `variant`, `orientation`, `placement`, `arrangement`, `fab-position`, `scroll-behavior`,
    `scroll-threshold` and `overflow-label` are the factory's options. `color` and `flat` (no
    elevation) change in place.
  - `show()` and `hide()` dispatch `show` and `hide`.
  - Pre-upgrade styles give the undefined host its docked or floating box.
- **Colour hooks for icon buttons and text buttons.** `--mtrl-icon-button-standard-color`,
  `--mtrl-icon-button-selected-container`, `--mtrl-icon-button-selected-color` and
  `--mtrl-button-text-color` default to the M3 roles. A container can set them, and they reach
  into an element's shadow root. The vibrant toolbar uses them for its items.
- **`createRoving` in `mtrl/core/dom`.** The roving tab index behind the toolbar: one tab stop over
  a composite's targets, the arrow keys following the orientation and the reading direction,
  Home and End, disabled targets skipped (`disabled` or `aria-disabled`), text inputs keeping
  their keys.

- **React and Solid: named slots as props (FLO-333).** A prop named after a slot the element
  declares takes nodes (`<Dialog actions={<Button>Discard</Button>}>`), rendered into a
  `<span slot="actions">` the component owns; `headerAction` is the `header-action` slot. A text
  prop of a slot's name (`headline` on the dialog, card and sheets, `subhead` on the card) takes
  its text, as the attribute, or nodes, into the slot. Typed per element, as in Svelte and Vue.
- **`mtrl/react/jsx` and `mtrl/solid/jsx`: the bare `m-*` tags in JSX (FLO-333).** Types only,
  opt in once with `import type {} from "mtrl/react/jsx";` (or `mtrl/solid/jsx`): `<m-switch
  checked>` then type-checks, with each tag's attributes as markup writes them
  (`supporting-text`). Solid's entry also types `prop:` (the elements' live properties) and `on:`
  (their events). A separate entry, so an app without React or Solid is not affected.

- **Named slots in the specs and the adapters (FLO-325).** An element spec declares `slots`, the
  named slots it reads (`slot="headline"`), and `describe()` lists them. Seven elements have them:
  the bottom app bar (`fab`), card (`avatar`, `header-action`, `headline`, `subhead`, `media`,
  `actions`), dialog (`headline`, `actions`), navigation rail (`header`), bottom and side sheet
  (`headline`) and top app bar (`leading`, `trailing`). Svelte takes each as a named snippet
  (`{#snippet actions()}`; `headerAction` for `header-action`), and a text prop of the same name
  (`headline` on the dialog, card and sheets, `subhead` on the card) takes its text or a snippet.
  Vue types them as the component's slots (`VueSlots`). check-elements proves every element renders
  exactly the slots it declares.
- **Svelte: `bind:this` reads the element (FLO-325).** A component's `element` is its `<m-*>`
  element, as Vue's template ref exposes it.
- **The typeface and corner shapes are themeable (FLO-330).** Components read
  `--mtrl-ref-typeface-brand` and `--mtrl-ref-typeface-plain` for their font family, following
  M3: display, headline and title roles use the brand face, and body and label use the plain
  one. They read `--mtrl-sys-shape-corner-*` for their corners. Each reference falls back to the
  compiled value, so nothing changes until an app or a theme sets a token:
  `:root { --mtrl-ref-typeface-plain: Inter, sans-serif; --mtrl-sys-shape-corner-medium: 4px; }`.
  - **Corners that follow a token:** those written through the shape scale, including the
    button's square and pressed shapes, and the card, chip and text field corners.
  - **Not yet:** the round button, which is half its height rather than a token so the press
    morph animates, and literal radii in 16 components: split button, badge, navigation rail,
    segmented button, dialog, tabs, list, menu, chips, slider, search, tooltip, drawer, switch,
    carousel and the icon button's sizes. Those are a follow-up. State-layer opacities stay
    compiled.
  - The full stylesheet grows by about 1% (494 bytes gzipped).

- **Elements: `::part` on every element (FLO-328).** Each piece of a component is a CSS part named
  after its BEM class without the prefix: the block by its name (`mtrl-button` is
  `::part(button)`), an element by its element name (`mtrl-switch__track` is `::part(track)`);
  modifiers name none. The piece holding the slot also takes the slot attribute's name, so
  `m-button::part(label)` styles the button's label. Each element's module doc lists its parts.
- **Elements: `HTMLElementTagNameMap` entries for every `m-*` tag (FLO-328).**
  `document.querySelector("m-switch")` returns a `SwitchElement`, and `createElement` likewise; a
  declaration child (`m-tab`, `m-radio`, …) is `HTMLElement` with its attributes. The default `m-`
  prefix only.

- **`inertOutside(element)` (`mtrl/core/dom`) (FLO-324).** Makes everything but one element inert,
  across shadow roots, as `showModal()` does for a top-layer dialog, and returns the undo, which
  clears exactly what it set. The modal sheets use it outside the top layer.

- **Card: typed `on` / `off` and `CardEvents` (FLO-323).** The card always emitted `click`
  (clickable), `mouseenter`, `mouseleave`, `keydown`, `focus`, `blur` (interactive), `dragstart`
  and `dragend` (draggable), but its type declared no `on`, so TypeScript couldn't listen to them.
- **Time picker: `format`, `type` and `orientation` take their string values (FLO-323).**
  `format: '24h'`, `type: 'input'`, `orientation: 'horizontal'` and the setters' string forms
  type-check, as every other component's options do; the enums still work, and the getters
  still return them (`TimeFormat`, `TimePickerType`, `TimePickerOrientation`).

- **Switch: `setError()` and `isError()` (FLO-318).** The switch's error state (its class and
  `aria-invalid`) now has one owner, as the text field's does.

- **M3's fixed colour roles, in every theme (FLO-315).** `primary-fixed`, `primary-fixed-dim`,
  `on-primary-fixed`, `on-primary-fixed-variant`, and the same four for `secondary` and
  `tertiary`: the accents that stay the same in light and dark. Baseline takes Compose's
  values; the generated themes Google's; the hand-kept themes (ocean, forest, spring, sunset,
  autumn) tones 90, 80, 10 and 30 of their own primary, secondary and tertiary, written by the
  theme generator. `THEME_ROLES` and `schemeToTokens` include them.

- **Eight M3 scheme-variant themes, generated (FLO-308).** `neutral`, `vibrant`, `expressive`,
  `fidelity`, `content`, `monochrome`, `rainbow` and `fruit-salad`, M3's dynamic-scheme variants
  from its baseline seed `#6750A4`, light and dark (Tonal Spot is `baseline`, within ΔE00 1.31).
  Each ships only as its own entry, `mtrl/themes/<name>`, so it costs nothing until imported;
  the full stylesheet's themes are unchanged.
- **`schemeToTokens` (`mtrl/core/theme`, also `mtrl/core`) (FLO-308).** An M3 scheme's role
  colours in, the theme's `--mtrl-sys-color-*` declarations out, light and dark, one per role
  (no `-rgb` twins, FLO-311). The themes are generated with it (`scripts/generate-themes.ts`, from Google's
  material-color-utilities, a devDependency only) and md3.io's theme builder uses it too.

- **Text field: a character counter (FLO-300).** While the input has a `maxlength`, the
  supporting text row ends with `count/max`, as Material Web shows it. It follows typing,
  `setValue()` and a limit set or removed later (`<m-textfield maxlength>`), describes the input
  for screen readers, and takes the error colour while the field is in error.
- **Text field: `field` (FLO-300).** The container under the root: the label, input, outline,
  icons and affixes, above the supporting text row. Anchor popovers to it.
- **Menu: `positionTarget` (FLO-300).** The element a menu is placed against, when it is not
  its opener. The select passes its field, so the supporting text row never pushes the menu down.

- **Pre-upgrade styles for server-rendered elements (FLO-293, SSR Phase A).** Until its script
  defines it, a server-rendered element no longer shows as unstyled text that then jumps: rules
  scoped to `:not(:defined)` give each of the 34 elements its upgraded box, set its label in the
  final type style, hide declaration children (`<m-tab>`, `<m-menu-item>`, …) while keeping
  their space, and hide overlays. They ship as `mtrl/elements/preupgrade.css` for a page's
  `<head>`, as `preupgradeStyles(prefix)` from `mtrl/elements/preupgrade` for another tag
  prefix, and inside each element's CSS module. `bun run preupgrade:check` measures the layout
  shift of every element and of a React server render, which must stay under 0.01.

- **Date picker: read-only, required and supporting text (FLO-289).** `readOnly` /
  `setReadOnly()` keep the value and the calendar closed; `required` / `setRequired()` with
  `checkValidity()` and `reportValidity()`, as on native inputs (a modal variant's read-only
  input is otherwise outside constraint validation); `supportingText` / `setSupportingText()`
  replace the format hint, which returns without them. A range also takes `{ start, end }`.
  `<m-datepicker>` maps `readonly`, `required` and `supporting-text` to them in place of its
  own workarounds, so a read-only element's trigger is disabled.

### Changed

- **The documentation site is md3.io.** The package's `homepage`, the README and the contributing
  guide point to [md3.io](https://md3.io), which replaces mtrl.app; mtrl.app redirects there.

- **Corners follow the shape tokens in 16 more components (FLO-331).** After FLO-330's scale, the
  literal radii read `--mtrl-sys-shape-corner-*` too: badge and switch (`full`), plain tooltip
  (`extra-small`), list selected row and video, navigation rail indicator, badge and modal
  container, drawer container and indicators, slider handle, track and value indicator, carousel
  (`extra-large`), the icon button's square and pressed shapes, the button's square icon shape,
  the connected button group's inner and pressed corners, the split button's inner corners and
  the contained search view; and the pre-upgrade switch and search. Radii set from script follow
  as well (button group, slider track, carousel). Nothing set, they render as before. Values off
  the scale stay literal, each with its reason: the round shapes that morph on press (half their
  height), outer corners beside smaller inner ones, the tab indicator's 3dp, the segmented menu's
  24dp, the slider's 2dp inside corners, scrollbars. The full stylesheet grows by 120 bytes gzipped.

- **Event payloads carry the element's `value` (FLO-320).** A handler reading `value` now works
  on the factory and on the element. The button group's `change` has `value`: a string or null for
  a single-select group, an array for a multi-select one. The split button's `select` has `value`,
  the chosen item's `id`. The chips set's `change` is one object with `value` (in the `value`
  property's shape), `selected` (the selected chips' values) and `changed` (the toggled chip's
  value, null for a method). The existing fields stay. Part 2: the navigation rail's and the drawer's `select` add `value` (the item's
  id), the menu's `select` too (the item's id, beside `itemId`), and the list's `select` the row's
  id as a string. The date picker's `change` adds `iso`, the value as ISO 8601 text, the
  `<m-datepicker>` element's `value`; the factory's `value` stays a `Date`. The element's `change`
  adds `date`, the factory's `Date` form, as a native input's `valueAsDate`. Search already
  carried the same `value`.

- **Tooltip colours per M3 (FLO-324).** The plain tooltip is `inverse-surface` /
  `inverse-on-surface`, opaque and without elevation (`PlainTooltipTokens`); the `plain` variant
  had its own `surface-container-high` with an outline, and every tooltip showed at 90% opacity
  with a shadow. The rich variant is `surface-container` with `on-surface-variant` text, medium
  corners, elevation 2, Body Medium and 320px wide at most (`RichTooltipTokens`); it was only a
  padding.
- **Bottom sheet: the drag handle is a button (FLO-324).** As Compose's, it is reachable by
  keyboard and activates: a partially open sheet expands, an expanded one closes. Its name says
  which ("Expand sheet" / "Close sheet"). It is 48dp tall, the bar in its middle, where it was
  36px of margin and bar.
- **Standard sheets close on Escape only from inside (FLO-324).** A standard bottom or side sheet
  sits beside the page, so Escape pressed elsewhere (closing a menu, say) no longer closes it;
  modal sheets are unchanged.
- **Side sheet: the standard sheet is square (FLO-324).** Only the modal sheet rounds, on the
  edge facing the page (MDC: docked `Corner.None`, modal `CornerLarge` inner edge).

- **Baseline on M3's current baseline values (FLO-315).** It mixed the 2021 `surface`
  `#FFFBFE` with newer roles. Every role now is Compose's `ColorLightTokens` /
  `ColorDarkTokens` value (primary `#6750A4`). Eleven change: light `surface` and
  `surface-bright` `#FEF7FF` (ΔE00 2.95, 4.31), `on-surface` `#1D1B20` (1.04),
  `inverse-surface` `#322F35` (2.46), `inverse-on-surface` `#F5EFF7` (1.52); dark `surface`
  `#141218` (2.84), `outline-variant` `#49454F` (8.53, the one clearly visible), `on-surface`
  and `inverse-surface` `#E6E0E9` (2.45), `inverse-on-surface` `#322F35` (2.46),
  `surface-bright` `#3B383E` (0.60).
- **Typescale classes and `h1`–`h6`, `p` read the typescale tokens (FLO-315).**
  `.mtrl-display-large` … `.mtrl-label-small` are emitted from the typescale map and set
  `font-family: var(--mtrl-sys-typescale-<role>-font)`, and the same for size, line height,
  tracking and weight, instead of `"Roboto", sans-serif` and pixel values; the document rules
  too. Setting `--mtrl-ref-typeface-brand` / `-plain`, or a size token, now reaches them.

- **Button: one state layer in `currentColor` (FLO-311).** Each colour style and toggle state
  drew its own hover, focus and pressed layer in its content role; the button now has one
  `::before` in `currentColor`, whose opacity alone changes (0.08, 0.10, 0.10). Every style
  already painted the layer in its content colour, so nothing looks different; a page that sets
  its own `color` on a button now gets a state layer in that colour too. `button.css` goes from
  23,254 to 13,635 bytes (2,591 to 2,188 gzipped).

- **Themes regenerated from their seeds (FLO-308).** `desert`, `summer`, `brownbeige`,
  `sageivory` and `tealcaramel` are now generated from their primary seeds with M3's tones, each
  keeping its second colour as a custom secondary; their hand-set values failed contrast (desert
  at 3.23:1, sageivory at 2.31:1). Every text pair now reaches 4.5:1. `highcontrast` is M3's
  high-contrast scheme (contrastLevel 1.0), 7:1 or more on every pair, which its old values missed.
  Their colours change. `autumn` drops its `quaternary-*` roles, which nothing used.

- **Text field: the field and its supporting text row (FLO-300). DOM change.** The root now
  holds two children, as M3's anatomy has them: `__field`, the 56px container with the label,
  input, outline, icons and affixes, and, when there is supporting text or a counter,
  `__supporting`, a row in the flow under it with `__helper` at the start and `__counter` at the
  end. The helper was absolute, 18px under the field, so it overlapped what followed and never
  wrapped; now it pushes what follows down and wraps. A field without supporting text is still
  56px, and `element`, `input`, `supportingTextElement` and the setters are unchanged; the new
  `field` property is the container. Migration: selectors that assumed the old flat structure,
  such as `.mtrl-textfield > .mtrl-textfield__input` or `> .mtrl-textfield__label`, now go
  through the field (`.mtrl-textfield__field > …`); the filled indicator is
  `.mtrl-textfield__field::before`. The select's never-effective viewport scrim
  (`.mtrl-select--open::before`, which the old indicator squashed to a 2px strip) is removed;
  a click outside closes the menu, as before.

- **Menu: the submenu feature loads on demand (FLO-310).** It is a chunk of its own, no
  longer part of every menu: 1.0–1.3 KB gzip less on the initial load of an app with a menu
  (Vite, `createMenu` and `<m-menu>`), and `bun run size` measures the menu at 12.0 KB
  instead of 12.8 KB. A menu with nested items starts loading the chunk when it is created,
  or when `setItems` gives it nested items; a menu without them never loads it. A click,
  hover or ArrowRight on a nested item before the chunk arrives is queued and run once it
  has. No API change: `MenuItem.submenu`, `hasSubmenu`, the submenu events and the options
  are as they were.

- **An unsized text field, select or date picker is 280px wide** (`TextFieldDefaults.MinWidth`),
  instead of as wide as its input's 20 average characters. Chrome measures that differently per
  platform for the same Roboto (167px on macOS, 220px on Linux), so the same page laid out
  differently, and no pre-upgrade style could match it (FLO-293). A width from the page still
  applies.

- **Date picker: one `change` shape, one-day ranges, and a value typed by the mode
  (FLO-295).** `change` carried `{ value, formattedValue }` from the API but
  `{ value: start, rangeEndDate }` from the calendar, and a docked range emitted once for its
  start and again for its end. Every `change` is now `{ value, rangeEndDate, formattedValue }`,
  `value` as `getValue()` returns it, and a docked range emits once, when whole. In range mode
  a lone date (`setValue(d)`, a config `value`, `<m-datepicker value="d">`) is the one-day
  range `[d, d]` (`d/d` on the element), not a range with only its start. `getValue()` and the
  payloads are `[Date, Date] | null` for `selectionMode: 'range'` and `Date | null`
  otherwise. Migration: read the range from `value` (`const [start, end] = value`), not from
  `value` plus `rangeEndDate`; a range with only its start now reads `[d, d]`.

- **Icon button: `change` with `{ selected }`, and `toggle` deprecated (FLO-295).** A toggle
  icon button dispatched a DOM `toggle` on its element, which shares its name with the native
  ToggleEvent, so TypeScript typed its listeners wrongly. It now emits `change` through its
  emitter, as a switch or checkbox reports its state; `<m-icon-button>` dispatches `change`
  with `{ selected }`, as `<m-switch>` and `<m-checkbox>` do, and the adapters get
  `onChange` / `@change`. Migration: `<m-icon-button>` and `createIconButton`: `toggle` →
  `change` (`{ selected }`); `toggle` still fires, deprecated, until the next minor.

- **Progress: `on()` uses the emitter, and handlers get `{ value, max }` (FLO-295).** They
  were DOM listeners on the element, handed a `CustomEvent` with the payload in `detail`,
  unlike every other component. Migration: `progress.on('change', (e) => e.detail.value)`
  becomes `progress.on('change', ({ value }) => value)`. `ProgressEvents` types the two
  events, `change` and `complete`.

### Changed (breaking, prerelease)

- **Card semantics (FLO-109).** A card is an `article`, not a `region` landmark: one named region
  per card flooded landmark navigation. A `clickable` card stays a `button` with a tab stop, and
  Enter and Space activate it. `interactive` alone is now the hover and press states only: the
  card was a focusable `button` that did nothing on Enter or Space, and now takes no button role
  and no tab stop. The header drops `role="heading"`, so its title is the heading, its real `h3`;
  the subtitle is a `p`, not an `h4`. A content block takes no role (each was an unnamed region).
  Migration: a card that acts on activation sets `clickable`; a selector or test reading
  `[role="region"]`, `[role="heading"]` or the subtitle's `h4` reads the card's `article` role and
  the `__header-title` / `__header-subtitle` classes.
- **`disable()` on a root that is not a form control writes `aria-disabled`, not `disabled`
  (FLO-119).** The shared disabled feature set a bare `disabled="true"` on a `div` root, which is
  not valid there and tells assistive technology nothing. It now sets `aria-disabled="true"`,
  removed by `enable()`, and `isDisabled()` reads it. One rule for every component: a native
  control (a button) keeps its own `disabled`, and a component with an inner input disables the
  input, as before. The progress indicator, which also wrote `aria-disabled` itself (FLO-324), now
  gets it from the same rule; the date picker's root takes `aria-disabled` instead of `disabled`.
  Migration: a selector or a script reading `[disabled]` on these roots reads `[aria-disabled="true"]`
  (or the component's `--disabled` class, which is unchanged).

- **Time picker `change` and `input` pass `{ value }` (FLO-320).** They passed the time as a
  string; they now pass one object, the same shape as every other component's and the
  `<m-timepicker>` element's (`TimePickerValueEvent`), and so do `onChange` and `onInput`.
  Migration: `(time) => …` becomes `({ value }) => …`. `confirm` still passes the string.

- **The `--mtrl-sys-color-*-rgb` custom properties are gone (FLO-311).** Every theme declared
  each colour role twice, as `#6750a4` and as `103, 80, 164`, for `rgba(var(--…-rgb), a)`. No
  mtrl style reads the twins any more (`alpha()` builds on `color-mix` of the role), so the
  baseline, the status colours, the dark block and every theme in `mtrl/themes/*` drop them,
  and the internal Sass `rgb($key)` helper in `src/styles/abstract/_theme.scss`, which returned
  `var(--…-rgb)`, is removed with them. Migration: `rgba(var(--mtrl-sys-color-X-rgb), N)`
  becomes `color-mix(in srgb, var(--mtrl-sys-color-X) N%, transparent)` (N as a percentage).

- **Setters and selection methods no longer emit `change`, `input` or `select` (FLO-328).** As on
  the platform, a change made by script is silent: only the user's click, key, drag or entry
  emits. A switch's `check()` emitted `change` while a text field's `setValue()` did not; they
  now agree. The methods whose behaviour changed:
  - checkbox and switch: `check()`, `uncheck()`, `toggle()`, `setValue()` (the shared
    `withCheckable` manager's `check`, `uncheck` and `toggle` with them);
  - radios: `setValue()` with a value no option carries (it still clears and warns);
  - select: `setValue()` with a value no option carries (it still clears and warns);
  - tabs: `setActiveTab()`, by tab or by value, known or not;
  - segmented button: `select()` and `deselect()`;
  - button group: `select()`, `deselect()` and `toggle()`;
  - chips: `setValue()`, `selectByValue()` (now silent by default; `selectByValue(values, true)`
    still emits, and the flag, which was dropped on the way to the controller, now reaches it)
    and `clearSelection()`;
  - slider: `setValue()` and `setSecondValue()` (silent by default; pass `true` to emit);
  - search: `setValue()` no longer emits `input` by default (pass `true` to emit), and `clear()`
    emits neither `input` nor `clear` (the clear button still emits both);
  - date picker: `setValue()` and `clear()` (clearing the field by hand still emits);
  - time picker: `setValue()`, which no longer calls `onChange` either.

  The custom elements already set their properties silently; their methods (`toggle()`,
  `check()` and `uncheck()` on `<m-switch>` and `<m-checkbox>`) are now silent too, and their form
  value and default-attribute tracking follow them without the event. Code that listened for
  `change` after calling one of these methods updates its own state instead, as it would after
  setting a native input's `checked` or `value`. Unchanged on purpose: the carousel's `goTo()`,
  `next()` and `prev()` emit `change` (the index follows the scroll position, and a scroll by
  script fires `scroll` natively too); the progress indicator's `setValue()` emits `change` (it
  has no user input, so the event is its value's only notification); the split button's
  `expand()` and `collapse()` emit (an expanded state, as `<details>` fires `toggle` when its
  `open` is set by script).

### Fixed

- **A closed `<m-menu>` is out of the tab order (FLO-304).** The element keeps its closed menu in
  its shadow root, where the first item kept `tabindex="0"`: Tab stopped inside a menu nobody
  could see. A closed menu is now `visibility: hidden`, which also takes it out of the
  accessibility tree. A transition keeps it visible while it opens and closes.
- **Menu and select: a long list stays in the viewport (FLO-272).** A select with a few hundred
  options ran past the bottom of the screen: a menu mounted in its field (the select's default)
  skipped the viewport checks, and one flipped above its anchor kept its full height and was
  clamped over it. A menu above or below its anchor is now capped to the room on that side, the
  side with more room when the list fits on neither, and scrolls; in the page, in a container and
  in the top layer alike. An open menu also follows its anchor when a panel around it scrolls,
  not only the window; its own list scrolling does not move it.

- **Menu: the divider no longer collapses in a menu that scrolls (FLO-273).** The list is a flex
  column, and the divider, the one item without a minimum size, shrank to 0 once the list was
  taller than the menu: a long select showed the divider's margins but no line.

- **Checkbox: the check icon without the HTML sink, and form sync without repeated validity
  (FLO-336).** Each checkbox parsed the icon's markup through `innerHTML`; it is now built once with
  DOM APIs and cloned, the same nodes, so no Trusted Types policy is involved. A web component set
  its validity on its internals on every property set; it now skips it while the control stays
  valid, and the form value and validity still read exactly right straight after a set.
- **Progress: the indeterminate circular indicator keeps its track (FLO-338).** It drew only the
  moving arc. M3 shows indeterminate indicators moving along a fixed track, and the Expressive
  `CircularWavyProgressIndicator` draws one; the track now runs around the rest of the circle,
  clear of both ends of the arc by the determinate gap, turning with it and never waved, flat and
  wavy alike.
- **Text field: no computed-style read per field, and one layout pass for many (FLO-335).** Each
  field started a timer that read `getComputedStyle(input)` to guess an autofill from its
  background colour, a forced style recalculation per field. The stylesheet already runs an
  `onAutoFillStart` animation on `:-webkit-autofill`, which the input listens for; it now runs on
  `:autofill` too, and the check reads the `:autofill` state, not styles, so the timer is gone.
  The label still floats on autofill (the stylesheet's `:has(:autofill)`). The placement of the
  outlined notch and of prefix and suffix is batched: fields scheduled together are all measured,
  then all written, instead of one forced layout each.

- **Svelte: callbacks are not snippets (FLO-334).** Any function prop but `children` and a
  lower-case `on…` was rendered as a named snippet, so `onClick`, `onChange` or a callback in a
  spread object was called during render. Only a prop named after a slot the element declares is
  a snippet now, as in React and Solid.
- **`mtrl/react/jsx` and `mtrl/solid/jsx`: the slot attribute, and React's events (FLO-334).**
  `<m-button label="Save">` type-checks: the slot attribute (`label`) is markup too. On a bare tag
  React 19 gives an `on<event>` prop in lower case the element's own event, so
  `onchange={(e) => e.detail.checked}` is typed; `onChange` stays React's synthetic event, which
  has no `detail`. React 18 sets no event props on a custom element.
- **Solid: named slots keep their wrappers (FLO-334).** New default-slot children rebuilt every
  named slot's wrapper; each is rebuilt only when its own prop changes now.

- **Adapters: named slots and snippets are no longer dropped (FLO-325).** Vue rendered only the
  default slot, so `<template #actions>` disappeared; each named slot's nodes now carry
  `slot="<name>"`, and text is wrapped to carry it. Svelte passed a snippet to the attribute of its
  name (`headline`) and rendered none; each named snippet now renders into its slot. Svelte
  attachments (`{@attach}`) reach the element: they are symbol-keyed props, which the spread
  skipped.

- **Elements: a slot's `label` is a real property (FLO-328).** `button.label = "Save"` created a
  plain JavaScript property and changed nothing (Solid, which always sets properties, hit it).
  On `<m-button>`, `<m-extended-fab>`, `<m-switch>` and `<m-checkbox>` the property now reads the
  `label` attribute, else the element's text, as `label` on a native `<option>`; setting it
  writes the attribute, which updates the text, also on an element created without one.

- **Baseline declares the status colours (FLO-329).** The default theme had no `success`,
  `warning` or `info` role, nor their `on-` pairs, which every generated theme has, so
  `createBadge({ color: 'success' })` (and warning, info) had no background under it. Baseline
  now declares them light and dark, in `mtrl/styles/base` and `mtrl/themes/baseline`, with the
  generated themes' values (one `status-roles-*` mixin in `_base-theme.scss` for both).

- **`surface-variant` is a theme role (FLO-329).** The disabled filled card's container reads
  it (Compose's `FilledCardTokens.DisabledContainerColor`), and no theme declared it, so that
  card lost its background. It is in `THEME_ROLES` now, so `schemeToTokens` requires it (as
  `surfaceVariant` from material-color-utilities). The generated themes take
  material-color-utilities' value. Baseline takes Compose's (`#E7E0EC` light, `#49454F`
  dark), and each hand-kept theme takes tones 90 and 30 of its own neutral variant palette.

- **The framework adapters tree-shake (FLO-327).** One component from `mtrl/react`, `mtrl/vue`,
  `mtrl/solid` or `mtrl/svelte` shipped the whole library: the switch was 174.9 KB gzip against
  11.7 KB for its element. Each adapter component is now its own module, importing only its
  element and that element's CSS; the index only re-exports, and the calls are `/*#__PURE__*/`.
  The switch is now 12.6 KB, and every component's adapter import is within 2 KB of its element's.
  `bun run adapters:size` checks it in CI with Bun (every component) and Vite (the switch, and a
  switch with a button).

- **Divider insets follow the writing direction (FLO-324).** They were physical margins, so in
  right-to-left the start inset landed on the end; they are logical margins now.

- **A small badge is visible when created (FLO-324).** Its empty label, a dot's normal state,
  counted as nothing to show, so `createBadge({ variant: 'small' })` started hidden;
  `setLabel` already knew better.
- **Progress: one disabled state (FLO-324).** Created disabled, the bar had `aria-disabled`;
  `disable()` later set only the class, and `enable()` left a creation-time `aria-disabled`
  behind. Both ways now set and clear the same state.
- **Modal sheets outside the top layer are modal (FLO-324).** A bottom or side sheet with
  `variant: 'modal'` and no `layer: 'top'` kept neither Tab inside nor the page inert. While
  open, the page is inert and Tab wraps in the sheet; closing or destroying it restores the page.
- **Dialog buttons: `size` applies (FLO-324).** It was accepted and dropped.

- **Dialog: `confirm()` settles however the dialog closes, confirms last, and shows its message as
  text (FLO-324).** It resolved only through its two buttons, so closing the dialog with Escape,
  the scrim or `close()` left the promise pending forever; it now resolves `false` then. The
  confirming button came first; it now comes last, as M3 orders a dialog's actions. The message
  went into `innerHTML`; it is text now, so a message carrying user input can't inject markup.
- **Progress: a value past the range is clamped everywhere (FLO-324).** `setValue(150)` drew 100
  but reported 150 in `aria-valuenow`, the label, `getValue()` and `change`; and a value past the
  range at creation was stored as given. The value is clamped to 0…max once, and that value is
  the one drawn, announced, labelled and emitted.

- **Dead declarations removed (FLO-323).** The card wrote a `--mtrl-card-elevation` property on
  hover, drag and creation that no stylesheet read; elevation comes from the card's classes, so
  the writes and the unread default are gone. The bottom app bar's corners referenced an
  undefined `--mtrl-sys-shape-medium` (they rendered square, which is M3's); the declarations
  are gone.

- **`<m-switch>`: `error` updates, and supporting text no longer ends the error (FLO-318).** The
  `error` attribute had no update, so setting or removing it after creation did nothing; and
  `setSupportingText()` / `removeSupportingText()` set the error state themselves, so changing
  the text ended an error the switch was still in. `setError()` owns it now;
  `setSupportingText(text, true)` colours the text only, and a helper on screen follows the
  switch's error state.
- **Extended FAB: `collapse` and `expand` reach `on()`, `<m-extended-fab>` and the adapters
  (FLO-319).** They were only DOM events on the inner element, without `composed`, so they never
  left the element's shadow root and the emitter never had them. They now also go through the
  emitter (`ExtendedFabEvents` types them), the element re-dispatches them from the host, and
  the adapters get `onCollapse` / `onExpand`.

- **Checkbox and switch: Space (and Enter, with `enterToggles`) activate the control as a click
  does (FLO-316).** The key handler set `checked` by hand, so on a checkbox in the mixed state it
  left `indeterminate` true, keeping the dash and the mixed class, and it fired `change` with no
  `input` before it. It now clicks the input: `indeterminate` clears, `checked` toggles, `input`
  then `change` fire once, and a disabled control stays as it is.

- **`--mtrl-sys-state-focus-state-layer-opacity` and `…-pressed-…` read 0.1, not 0.12
  (FLO-311).** The baseline theme wrote the state opacities out by hand, with the Material 2
  0.12 for focus and pressed, while every component compiles in M3's 0.1 from `$state`. Only
  CSS that read the custom properties saw 0.12. The theme now emits them from `$state`, so the
  two cannot drift again.

- **Text field colours and states, per the M3 tokens (FLO-298).** The placeholder was always
  transparent; it shows in on-surface-variant while the field is focused or has no label. The
  outlined label rested at 50% opacity (under 4.5:1); it is on-surface-variant at full strength.
  The filled indicator is on-surface-variant, not outline; the filled field has a hover state (an
  on-surface 8% layer and an on-surface indicator), and in error the indicator is 1dp at rest,
  2dp only when focused, with on-error-container on hover, as the outlined label and trailing
  icon now have too; the outlined label turns on-surface on hover. Only the label, the trailing
  icon and the caret take the error colour, not the leading icon or the affixes; prefix and
  suffix are on-surface-variant. The caret is primary (error in error). Icons are 24px at full
  colour, not 20px at 85%. Disabled text is on-surface at 38% rather than the whole input faded,
  so the filled container is the 4% it should be and the outlined field gets none; the
  supporting text dims too.

- **Text field: label rules that never matched, and supporting text and error state out of step
  (FLO-303).** The label comes before the input, so every `input ~ label` rule matched nothing:
  a value the script hadn't seen, or autofill, left the label resting over the text, and an input
  disabled directly kept a full-strength label. They key off the field with `:has()` now; the
  wrong autofill colours and backgrounds they carried are gone. `supportingTextElement` is the
  element on screen, not the one the field was created with; ending an error restores helper
  text set through the API; and replacing or removing the supporting text no longer ends the
  field's error state, which `setError()` alone owns (`setSupportingText(text, true)` colours
  the text only). `density` reaches the input. `<m-textfield>` drops its workaround for the
  error class.

- **Event handlers typed `never` (FLO-295).** `EventCallback`, the handler type of every
  `on()` that doesn't name its events, was `(...args: never[]) => void`, so a handler's
  inferred parameter was `never` and no payload could be read without a cast. It now gets
  `unknown`, to narrow; a handler that declares its payload type is accepted as before.
  `withEvents<Events>()` and `EventComponent<Events>` take an optional event map, so a factory
  built on them (mtrl-addons' form and color picker, for one) gets `on` and `off` that check
  each event's name and payload. Without a map nothing changes.

- **Types the runtime already took (FLO-295).** `DrawerConfig` has `ariaLabel`, which the drawer
  always read; a segmented button's `mode` takes `'single'` / `'multi'` as well as the enum, as
  its `density` already did.
- **Select's menu class and Progress's duplicate classes (FLO-295).** Found by md3.io's docs
  audit. Since `class` stopped being prefixed, the select passed `select__menu` bare, so
  `.mtrl-select__menu` matched nothing; it is prefixed now, and the rules under it, which never
  applied (a 460px max width, a 4px margin, fade classes nothing set), are gone. Progress roots
  no longer carry unprefixed `progress progress--linear` copies of their classes.

### Deprecated

- **Chips set `change`: the array and the second argument (FLO-320).** The payload is still the
  array of selected values, and the changed value still comes second, so `(selectedValues,
  changedValue)` handlers keep working. Read `selected` and `changed` instead: both go in the next
  prerelease.

- **Tooltip: `rich` (FLO-324).** It was never read. A rich tooltip is `variant: 'rich'`, and the
  content is always text. Removed in 1.0.

- **Dialog buttons: `color` (FLO-324).** It never had an effect: the button has no colour option,
  and M3's dialog actions are text buttons in the dialog's own colours. Removed in 1.0.

- **Card: `withElevation` (FLO-323).** It only wrote the unread `--mtrl-card-elevation`; it is a
  no-op now, and the card no longer composes it. Removed in 1.0.

- **Themes `material`, `winter`, `browngreen` and `legacy` (FLO-308).** Still importable and in
  the full stylesheet in 0.10, removed in 1.0. Use `baseline` for `material` (which never matched
  it), `ocean` for `winter` and `brownbeige` for `browngreen`, their near-duplicates; `legacy` has
  no replacement.

- **Text field:** `TEXTFIELD_CLASSES.LABEL_FLOATING`, applied and styled nowhere (FLO-295).
- **`getThemeColor('sys-color-X-rgb')`** (`mtrl/core/utils`): the `-rgb` twins are no longer
  declared (FLO-311), so the call now derives the `'r, g, b'` triplet from `sys-color-X`. It
  keeps working until the next major; read `getThemeColor('sys-color-X', { alpha })` instead.

### Removed

- **`_bluekhaki.scss` and `_greenbeige.scss` (FLO-308).** Two theme sources that were never
  built, exported or referenced.

## [0.10.0-next.3] - 2026-09-29

The third prerelease of 0.10.0, on the npm `next` tag (`npm install mtrl@next`); `latest`
stays at 0.9.8. Every component now ships as a custom element with React, Vue, Svelte and
Solid components: 20 more since next.2, among them the overlays (menu, select, split button,
tooltip, snackbar, dialog, sheets, the modal drawer and rail), which open in the browser's top
layer from inside their shadow root through a new `layer: "top"` option on their factories.
The element API gained state events, which leave a form value untouched, and the options
md3.io's playgrounds needed. On the conformance side, search is reworked (contained style,
combobox semantics, top layer), the time picker edits a draft until OK, and focus is read from
the component's own root in every factory, inside shadow roots too.

### Added

- **Elements: state events that leave the model clean.** An event spec with `state: true`
  reports a change beside the model (`open`, `expanded`): dispatching it does not mark the
  element dirty, so the model's attribute still moves it. The open and close events of
  `<m-dialog>`, the sheets, `<m-menu>`, `<m-snackbar>` and `<m-drawer>` are state events;
  `<m-drawer>`'s marked its `value` dirty before.
- **Elements: `<m-navigation-rail>` `expand` and `collapse` events (#257).** Dispatched when the
  user or a method changes `expanded`, after the attribute reflects it, and not when the
  attribute is what changed. They leave the rail clean, so frameworks can keep `expanded` as
  state and drive a modal rail from it.
- **Elements: `<m-dialog>` `size`, `close-button`, `subtitle`, `divider`, `footer-alignment`,
  `no-close-on-scrim-click` and `no-close-on-escape` (#257).** The factory's `size`,
  `closeButton`, `subtitle`, `divider`, `footerAlignment`, `closeOnOverlayClick: false` and
  `closeOnEscape: false`; `cancel` is still dispatched on Escape.
- **Elements: `<m-bottom-sheet>` `expanded`, with `expand` and `collapse` events (#257).**
  `expanded` reflects the full height as `open` reflects showing; set while closed, the sheet
  opens expanded. The events come from the user and the methods, closing from the full height
  included, and leave the element clean.
- **Elements: `<m-side-sheet>` `width` (#257).** The factory's `width`, in pixels.
- **Elements: `no-close-on-scrim-click` and `no-close-on-escape` on the sheets and
  `<m-drawer modal>` (#257).** The sheets' `closeOnScrimClick: false` and `closeOnEscape:
  false`; on the drawer, whose factory has one `dismissible` for both, each is refused on its
  own, in place.
- **Elements: `<m-menu>` `color`, `no-close-on-select`, and `<m-menu-item gap>` (#257).** The
  factory's `color` (`vibrant` for the vertical menu), `closeOnSelect: false`, and its gap
  items, which split the vertical menu into groups; `<m-split-button>` reads gap items too.
- **Elements: `<m-tooltip>` `no-show-on-hover` and `no-show-on-focus` (#257).** The factory's
  `showOnHover: false` and `showOnFocus: false`.

- **Elements: `<m-search>` with `<m-search-suggestion>`.** Form-associated: the query is
  `value`, the model and the form value, under the host's `name`. Suggestions are declared
  as children (`value`, text or `label`, `icon`, `group`) and redrawn in place once per
  change, not at all when they come back the same, so an app can replace them as the user
  types. `placeholder`, `variant`, `view-mode` (`docked`/`fullscreen`), `full-width`,
  `disabled`, `aria-label` and `open` (reflected) update in place; `leading-icon`,
  `trailing-icon`, `avatar` and their labels recreate it. Events: `input`, `change` on
  Enter, `select`, `open`, `close`, and `action` for the trailing icon and avatar; methods
  `show()`, `close()` and `focus()`. The open view is the factory's, in the top layer.
- **Tooltip: `layer: "top"`.** With the option the tooltip renders after its target instead
  of on `document.body` (or stays where its owner put it), in the target's tree, a shadow
  root's included, and is shown in the top layer as a `popover="manual"` element, placed in
  viewport coordinates. It leaves the top layer after its exit transition. Without popover
  support the option does nothing. The default tooltip is unchanged.
- **Snackbar: `layer: "top"`.** With the option the snackbar is a `popover="manual"` element,
  shown in the top layer where its owner put it or on the body, at its usual place. While a
  modal `<dialog>` is open, the rest of the page is inert, so it opens inside the topmost
  one (found from focus, or in the document and its open shadow roots), carried in a shadow
  root with its own root's stylesheets when it comes from another tree. It follows the
  modals while it shows: into one that opens, back to the one below or home when its modal
  closes, staying open with its timer running and closing once. Without popover support the
  option does nothing. The default snackbar is unchanged.
- **Elements: `<m-tooltip>`.** The target is `for` (an id in the element's root, then the
  document) or the `target` property; the text is `text` or the element's text; `position`,
  `variant`, `show-delay`, `hide-delay`, and `show()`/`hide()`. The surface stays in the
  element's shadow root, in the top layer. The target is described by the text: its
  `aria-describedby` names the host, which carries the text as an `aria-hidden` label.
- **Elements: `<m-snackbar>`.** The message is `message` or the element's text; `action`,
  `dismissible`, `close-label`, `duration`, `position`, `queue-behavior`, the `open`
  property, `show()`/`hide()`, and the `open`, `action` and `close` events (`detail.reason`).
  It shares the factory's queue and opens in the top layer, above modal dialogs.
- **Menu: `layer: "top"`**, and a top-layer helper in `mtrl/core/dom`. With the option the
  menu renders next to its opener instead of on `document.body` or `container`, and is shown
  in the browser's top layer as a `popover="manual"` element: above any z-index, out of any
  clipping parent, and inside the opener's shadow root with that root's styles. It is placed
  in viewport coordinates with the same flip and clamp, keeps its own dismissal (a close
  emits `close` once), and closes if something else hides it; submenus open in the top layer
  too. Without popover support the option does nothing. The helper is `showInTopLayer`
  (`popover-auto`, `popover-manual` or `modal`), `hideFromTopLayer`, `onTopLayerClose`, which
  reports the browser's own closes, and `supportsTopLayer`. The default menu is unchanged.
- **Menu: a top-layer menu in another shadow root than its opener** stays open when focus
  moves into it. The opener's blur names the shadow host there, not the menu, and closed it
  right after a pointer opened it. Menus without `layer` are unchanged.
- **Select: `layer: "top"`**, passed to its menu: the listbox renders beside the field, in the
  field's tree, and opens in the top layer; focus moving into it does not count as leaving
  the select. The default select is unchanged.
- **Split button: `layer: "top"`**, passed to its menu, which then renders beside the trailing
  button in the top layer. The default split button is unchanged.
- **Elements: `<m-menu>` with `<m-menu-item>` children**, and `Menu` and `MenuItem` in the
  adapters. Items declare `value`, their text or `label`, `icon`, `shortcut`,
  `supporting-text`, `disabled`, or `divider`; nested items are a submenu. `anchor` is the
  opener's id (the menu's root first, then the document), or as a property an element. The
  surface stays in the element's shadow root and opens in the top layer. `open` reflects the
  state as on `<details>`, with `show()`, `hide()` and `toggle()`; `open`, `close` and
  `select` (`{ value }`) are dispatched. Items update in place.
- **Elements: `<m-select>` with `<m-select-option>` children**, and `Select` and
  `SelectOption` in the adapters. A form-associated select: `value` is the model and the form
  value, with `change`; `label`, `variant`, `required` (reported as `valueMissing`),
  `disabled`, `supporting-text`, reset, restore and `<label for>` as on `<m-textfield>`.
  Options declare `value`, their text or `label`, `icon` and `disabled`, and update in place.
  The listbox opens in the top layer.
- **Elements: `<m-split-button>`**, with `<m-menu-item>` children as its menu, and
  `SplitButton` in the adapters. The text or `label` is the leading action, whose native
  `click` is the element's; a chosen item dispatches `select` (`{ value }`). `variant`,
  `size`, `disabled` and `icon`; the menu opens in the top layer.
- **Dialog: `layer: "top"`**. The dialog itself becomes a `<dialog>`, rendered in place in
  `container` and kept there when it closes, and opens with `showModal()`: in the top layer,
  the page outside inert (a shadow root's page too), the scrim its `::backdrop`, fading as
  the overlay did; the overlay element is not used. Escape arrives as the dialog's `cancel`
  and closes it through `close()`, once; a press and release on the backdrop closes it as a
  click on the overlay did; focus goes in on open and back to the opener; Tab wraps through
  slotted content. It animates out in the top layer. Without `showModal()` the option does
  nothing, and the default dialog is unchanged.
- **Bottom sheet: `layer: "top"`** for the modal variant: the root is a `<dialog>` shown with
  `showModal()`, the scrim its `::backdrop`, Escape its `cancel`, a click beside the sheet the
  scrim's click, Tab wrapped inside; the sheet slides as before, in and out of the top layer.
  Standard sheets and the default modal sheet are unchanged.
- **Side sheet: `layer: "top"`** for the modal variant, as for the bottom sheet.
- **Drawer: `layer: "top"`** for the modal variant: the root is a `<dialog>` shown with
  `showModal()`, which makes the whole page inert where the drawer's own `inert` walk stopped at
  a shadow root (#249); the scrim is its `::backdrop`, Escape its `cancel`, and a drawer opened
  before it is on the page is shown once it is. The standard drawer and the default modal
  drawer are unchanged.
- **Elements: `<m-dialog>`**, and `Dialog` in the adapters. The top-layer dialog in the
  element's shadow root. Slots: `headline` (the `headline` attribute is its fallback), which
  names it, the default slot, which describes it, and `actions`. `open` shows it and reflects
  it, as on `<dialog open>`; `fullscreen` is the full-screen dialog; `aria-label` names one
  without a headline. `show()` and `close()`; `open`, `close`, and `cancel` on Escape, which
  `preventDefault()` refuses.
- **Elements: `<m-bottom-sheet>`**, and `BottomSheet` in the adapters. Slots `headline` and
  the default one; `open` (reflected), `modal` (the top-layer modal sheet; standard without
  it), `headline`, `no-drag-handle`, `aria-label`; `show()`, `close()`, `expand()`,
  `collapse()`; `open` and `close` events.
- **Elements: `<m-side-sheet>`**, and `SideSheet` in the adapters. Slots `headline` and the
  default one; `open` (reflected), `modal`, `headline`, `position`, `no-close-button`,
  `aria-label`; `show()` and `close()`; `open` and `close` events.
- **Elements: `<m-drawer modal>`**: the modal drawer in the top layer. `open` reflects it
  closing on Escape or the backdrop, and the drawer dispatches `open` and `close`.
- **Elements: `<m-navigation-rail layout="modal">`**: the modal rail, a `<dialog>` shown with
  `showModal()` while expanded; `expanded` reflects Escape and the backdrop collapsing it.
- **Elements: `<m-navigation-rail>` with `<m-navigation-rail-item>` children**, and
  `NavigationRail` and `NavigationRailItem` in the React, Vue, Svelte and Solid adapters.
  The standard rail: a navigation landmark named by `aria-label`, each item a button, or a
  link with `href`, declaring `value`, `icon`, `selected-icon`, `badge` (empty for the dot),
  `badge-label` and `disabled`. `value` is the model, with `change` on a click or Enter;
  `expanded` reflects the menu button as `open` does on `<details>`, `no-toggle` drops it,
  and `slot="header"` takes a FAB. Items update in place.
- **Elements: `<m-drawer>` with `<m-drawer-item>` children**, and `Drawer` and `DrawerItem`
  in the adapters. The standard (in-page) drawer, named by its `headline` or `aria-label`:
  items declare `value`, `icon`, `badge` and `disabled`, or with `type="section"` and
  `type="divider"` a section headline and a divider. `value` is the model, with `change`;
  `open` and `headline` apply in place, `position`, `width` and `dense` recreate it.
- **Elements: `<m-top-app-bar>`**, and `TopAppBar` in the adapters. Children are the
  headline (`headline` is the text when there are none), `slot="leading"` the navigation
  icon button and `slot="trailing"` the actions. `type` (`small`, `center`, `medium`,
  `large`) changes in place; `scroll-threshold`, `no-scroll` and `no-compress` set the
  scrolled state, and `scroll-target` follows an element's scroll instead of the window,
  as `setScrollState()` does from script.
- **Elements: `<m-bottom-app-bar>`**, and `BottomAppBar` in the adapters. Children are the
  actions and `slot="fab"` the FAB, at the end or with `fab-position="center"` in the
  middle; `auto-hide` hides it on a scroll down, `show()` and `hide()` from script.
- **Elements: `<m-button-group>` with `<m-button-group-item>` children**, and `ButtonGroup`
  and `ButtonGroupItem` in the React, Vue, Svelte and Solid adapters (`MButtonGroup` and
  `MButtonGroupItem` in Vue). Each item declares a button (its text or `label`, `value`,
  `icon`, `selected-icon`, `aria-label`, `disabled`, `selected`); the group takes the
  factory's `variant`, `kind`, `selection`, `required`, `size`, `shape`, `labels`,
  `orientation`, `density`, `equal-width` and `disabled`, and is named by `aria-label`. With
  `selection="single"` or `"multi"`, `value` is the default selection (comma-separated when
  multi) and the live property (a string, or an array when multi), with `change` and
  `{ value }`; every press dispatches `action` with `{ value, index }`. Items relabelled,
  given an icon or disabled update the group in place; the rest rebuilds it, keeping the
  selection.
- **Elements: `<m-chips>` with `<m-chip>` children**, and `Chips` and `Chip` in the React,
  Vue, Svelte and Solid adapters (`MChips` and `MChip` in Vue). Each `<m-chip>` declares a
  chip (its text or `label`, `value`, `variant`: filter by default, assist, input or
  suggestion, `icon`, `trailing-icon`, `avatar`, `remove-label`, `selected`, `disabled`,
  `elevated`); the set is a grid with one Tab stop, named by `aria-label` or its `label`,
  multi-select unless `selection="single"`, with `selection-required`, `scrollable`,
  `vertical` and `label-position`. `value` is the default selection (comma-separated when
  multi) and the live property (an array, or a string when single), with `change` and
  `{ value }`; removing an input chip dispatches `remove` with `{ value }`. Chips added at the
  end, removed, relabelled or disabled update the set in place. In-place updates of any
  element's children no longer re-dispatch what they make the factory emit.
- **Elements: `<m-list>` with `<m-list-item>`**, and `List` and `ListItem` in the React,
  Vue, Svelte and Solid adapters. Each item declares a row (its text or `headline`,
  `overline`, `supporting-text`, a leading icon, avatar or image, a trailing icon or text,
  `value`, `disabled`, `selected`), or a divider or subheader with `kind`. `selection` is
  `single`, `multiple` or `none`; `value` is the live selection and the model, `values` all
  of it, and a row dispatches `activate` and then `change`. Items update in place.
- **Elements: `<m-card>`**, and `Card` in the adapters. A container whose regions are
  slots: `media`, the header's `avatar`, `headline`, `subhead` and `header-action`, the
  default slot for supporting content, and `actions`. `variant`, `clickable` (a button
  named by its headline), `full-width`, `disabled` and `aria-label`.
- **Elements: `<m-carousel>` with `<m-carousel-item>`**, and `Carousel` and `CarouselItem`
  in the adapters. Items declare `src`, `alt`, a label, `description`, `button-text`,
  `button-url` and `value`; the carousel takes the layout `variant` and the item sizing
  attributes, with the current `index` as the model, `change` as it moves, and `next`,
  `prev` and `goTo`. Items update in place.
- **Elements: `<m-datepicker>`**, and `Datepicker` in the adapters. A form-associated date
  picker whose own field is its trigger: `value` is the model and the form value, an ISO date
  (`YYYY-MM-DD`), or with `selection-mode="range"` a `start/end` interval, with `change`
  (`{ value }`) on commit: Save in the `modal`, `modal-input` and `fullscreen` variants, which
  open in the top layer, and each date chosen in the `docked` one. `min`, `max`,
  `date-format`, `label`, `supporting-text`, `required` (reported as `valueMissing`),
  `disabled`, `readonly`; reset, restore and `<label for>`. `open` reflects the calendar as on
  `<dialog open>`, with `show()` and `close()`, and `open` and `close` are dispatched.
- **Elements: `<m-timepicker>`**, and `Timepicker` in the adapters. A form-associated time
  picker with no field of its own, opened by `show()`, the `open` attribute (reflected) or a
  `<label for>`, in the top layer. `value` is the model and the form value, a 24-hour
  `HH:MM` (`HH:MM:SS` with a `step` under a minute) as on `<input type=time>`, or `""`
  until one is set or confirmed. The dial edits the factory's draft (FLO-288): `input`
  (`{ value }`) as it moves, `change` (`{ value }`) when OK commits a different time (or
  fills an empty picker), and Cancel, Escape or the backdrop discard it. `format`, `type` (dial or input) and `orientation` change in place; `min`,
  `max` and `step` (seconds, as the minute or second step); `label`, `required`
  (`valueMissing`), `disabled`; reset and restore; `open` and `close` events.
- **Elements: the remaining factory options (#263).** `<m-dialog>` `animation` (`scale`,
  `slide-up`, `slide-down`, `fade`); `<m-bottom-sheet>` `max-width` (pixels, 640 by default);
  `<m-navigation-rail>` `no-ripple`; `<m-timepicker>` `show-seconds`, which shows seconds
  with a minute `step` (`HH:MM:SS`); `<m-datepicker>` `initial-view` (`day`, `month`, `year`)
  and `close-on-select`. The factories read each once: a change recreates the component.

### Fixed

- **Keyboard and focus inside a shadow root (#244).** Factories found the focused element
  with `document.activeElement`, which is the shadow host when focus is inside a shadow
  root: the navigation rail's and the drawer's arrow keys did nothing there, a menu's arrows
  jumped back to the first item, a chip removed from the keyboard dropped focus, a list or
  rail rendering again lost the focused item, a select lost its focused styling, a search
  collapsed with focus back in its field, a modal drawer or rail let Tab out, and a
  dialog, modal sheet, modal drawer or snackbar returned focus to the host rather than its
  opener. They now read their own root through
  `activeElementOf(node)` in `core/dom`, and an overlay saves the focused element through
  open shadow roots with `deepActiveElement()`. `<m-navigation-rail>` and `<m-drawer>` drop
  the key handlers that covered for it.
- **Search: events and controls found building `<m-search>` (FLO-291).** Enter on the
  suggestion the arrows reached selects it without first submitting the typed text; a click
  or a keystroke in an input that already has focus reopens the view; emptying the query
  (the clear button, Escape, `clear()`) emits `input` with the empty value before `clear`;
  `trailingItems[].onClick` is wired, and `setLeadingIcon`, `setTrailingItems`,
  `addTrailingItem` and `removeTrailingItem` work (they only warned); an avatar is a
  button when it has `onClick`, and otherwise an image out of the tab order (it was a
  focusable div with no role); suggestions take `supportingText`, as a 72dp two-line item;
  the icon buttons inherit the font inside a shadow root.
  `<m-search>` drops its two workarounds (the Enter filter, and `clear` mapped to `input`),
  its avatar is a button, and it takes `min-width` / `max-width` (pixels or a CSS length, in
  place), `no-clear-button`, `no-expand-on-focus` and `no-collapse-on-blur` (#263).
- **Search: `minWidth` and `maxWidth` apply (FLO-290).** They were documented and given
  defaults, and nothing read them: the stylesheet's 360dp and 720dp applied whatever was
  passed. They now set `--mtrl-search-min-width` and `--mtrl-search-max-width` on the root.
- **Search: the open view no longer moves or covers the page (FLO-285).** A docked view grew
  in the page's flow and pushed everything below it down; a full-screen search covered the
  whole page even as a bar. Opening now shows the bar and its results in the top layer,
  over the bar's place, which the page keeps: docked under the bar over a 0.32 scrim (a
  press on it closes the view), full screen as a modal `<dialog>` (`showModal()`: the page
  is inert, Escape cancels). A clipping parent no longer hides the results. Moving focus to
  the view's own back or clear button no longer closes it, and hovering a suggestion no
  longer selects it for the next Tab.
- **Search: accessibility and M3 tokens (FLO-286).** The input is a combobox that controls
  the suggestions listbox (`role="combobox"`, `aria-expanded`, `aria-controls`,
  `aria-autocomplete="list"`), and the arrows move `aria-activedescendant` through the
  options; a polite status announces how many suggestions show. The icon buttons are 48dp
  tap targets (they were 24dp) with 8% hover and 10% focus and pressed layers and the 3dp
  `secondary` focus ring; the bar has an 8% hover layer. Suggestions are 56dp one-line list
  items, and the option the arrows reach looks focused. The divider is `outline`. The
  suggestions listbox stays in the DOM, hidden, while the search is a bar.
- **Elements: `<m-drawer>` keeps its default `value` when items are completed after
  upgrade.** An item without a label is left out until it has one; a clean drawer now takes
  its `value` attribute again when the items are reconciled, as the rail does (#247).
- **Elements: `<m-list>` `activate` and `<m-button-group>` `action` leave the model clean.**
  They report a press, and `change` carries the selection; they marked the element dirty, so
  its `value` attribute stopped moving it. `<m-chips>` `remove` still does: removing a
  selected chip changes the selection, and no `change` comes with it.
- **Bottom sheet: `peekHeight` sets the partial height.** The option was declared, with a
  documented default of 56, and did nothing: the partial sheet was always its content up to
  half the screen. Set, it is now the partial state's height in pixels; unset, the partial
  state is unchanged. `<m-bottom-sheet>` takes it as `peek-height`.
- **Elements: `<m-navigation-rail>` keeps its default `value` when items are completed after
  upgrade (#247).** An item without an icon is left out until it has one, as frameworks set
  attributes after creating the child; a clean rail now takes its `value` attribute again when
  the items are reconciled, so the default destination is selected once its item is complete.
- **Time picker: `minTime`, `maxTime`, `minuteStep` and `secondStep` are applied
  (FLO-281).** They were accepted and documented, and did nothing. Dial numbers and AM/PM
  that cannot be reached are disabled (at 38%), a pointer between labels picks the nearest
  step, a picked time outside the limits moves to the nearest one inside, and a typed time
  is held to them when committed (on change or Enter), not while typing. `setValue` is not
  held to them.
- **Time picker: focus inside a shadow root (FLO-284).** The dial kept focus on its numbers
  when its face changed, and closing returned focus to the opener, only when the document
  could see them; inside a web component it saw the host.
- **Time picker: M3 sizes and colours in every variant (FLO-280).** Dial mode's boxes are
  96x80dp in Display Large (114dp wide in the 24-hour vertical layout), the colon 24dp and
  on-surface. Input mode's fields are 96x72dp in Display Medium, labelled Hour and Minute
  below them, and the focused one turns primary-container inside a 2dp primary outline (the
  selected colours never showed: the number-field rule overrode them). AM/PM is 52x80dp
  (52x72 in input mode, 216x38 lying flat in the horizontal layout), 12dp from the time,
  with a 1dp outline and divider; the unselected half is transparent. In right-to-left
  layouts the time still reads left to right and AM/PM moves to the other side. Dark
  colours come from the theme: the `prefers-color-scheme` overrides and the surface-tint
  overlay are gone, and so is the phone-width shrink of the fields.
- **Date picker: focus inside a shadow root (FLO-284).** It read `document.activeElement`,
  which stops at the shadow host, so inside a web component Tab no longer wrapped in the
  modal, a swipe or the growing full-screen list lost the focused day, and closing could
  return focus to the host rather than the control that opened it. It now reads focus from
  its own root, and the opener through open shadow roots.

### Changed

- **Search: the contained style by default, with `variant: 'divided'` for the baseline
  (FLO-287).** M3 marks the divided style "not recommended, use contained" in M3 Expressive,
  and it was the only one mtrl drew. Contained keeps the bar's pill and filled container
  when focused and gives the results their own container: docked 2dp below the bar with
  12dp corners, full screen on `surface-container-low` with the bar inset 12dp. `variant:
  'divided'` (and `setVariant()`) keeps the look apps had. The results reveal on the
  emphasized decelerate curve, not with reduced motion; the never-driven `--expanding` and
  `--collapsing` classes are gone.
- **Time picker: edits are a draft until OK (FLO-288).** Every move of the dial was the value,
  with a `change` each time, and Cancel kept it; in M3, Cancel discards and OK commits, as
  the date picker already did. While open, the dial, fields and AM/PM edit a draft,
  reported by a new `input` event (and `onInput`). OK commits it with one `change` (if it
  differs), then `confirm`, both while the picker is still open, then `close`; Cancel,
  Escape and the backdrop put the committed value back and emit `cancel` before `close`.
  `getValue()`, `getTimeObject()` and the form value are the committed time throughout;
  `setValue` still commits directly. The dialog now stays in the component's element
  (it was appended to `document.body`; `open()` adds an element the app never placed to
  the page), so the root's `click` and `keydown` leave out the dialog's own, and Enter in
  its fields does not submit a surrounding form. New `disabled`, `enable()`, `disable()`
  and `isDisabled()`: a disabled picker does not open.
- **Time picker: `change` fires once per new value (FLO-281).** `setFormat` no longer emits
  `change` (the value is 24-hour whatever the display, and it emitted without calling
  `onChange`), and `setValue` notifies only when the value differs, with the event and
  `onChange` together.

### Deprecated

- **Time picker (FLO-281):** `closeOnSelect` (never applied; the picker is confirmed with
  OK), `TIMEPICKER_DIAL` (not the dial's geometry, which is CSS), `TIMEPICKER_Z_INDEX`
  (the native top layer needs none), `TIMEPICKER_CLASSES` (use `TIMEPICKER_SELECTORS`;
  its `DIAL_CENTER` and `PERIOD_ACTIVE` now name the classes the picker uses), and the
  selectors `MODAL`, `DIAL_CANVAS` and `DIAL_HAND`, which match nothing.

## [0.10.0-next.2] - 2026-09-29

The second prerelease of 0.10.0, on the npm `next` tag (`npm install mtrl@next`); `latest`
stays at 0.9.8. Fourteen components now ship as custom elements with React, Vue, Svelte
and Solid components: icon button, FAB, extended FAB, checkbox, radios, slider, text field,
progress, loading indicator, badge and divider join button, switch and tabs, and every
element's model attribute now behaves as on native controls. On the conformance side, the
time picker gets an accessible dial and a native modal, the date picker a full-screen
variant and a scrolling year picker, and the outlined text field an M3 notched outline.

### Added

- **Date picker: a full-screen variant, `variant: 'fullscreen'`.** The m3.material.io
  full-screen picker, recommended on compact screens and the range picker's form: the whole
  viewport, no corners, a close (x) icon button and **Save** above a Title Large headline,
  one weekday row, and the months in a vertically scrolling list with Title Small subheads
  ("To navigate across months, scroll vertically"). The list renders a window of months
  around the focused one, within `minDate` and `maxDate`, and extends it by a year as it
  nears either end without moving what is shown. Selections are drafts until Save, as in
  the modal (FLO-276).
- **Elements: `<m-progress>`, `<m-loading-indicator>`, `<m-badge>` and `<m-divider>`**, and
  `Progress`, `LoadingIndicator`, `Badge` and `Divider` in the React, Vue, Svelte and Solid
  adapters. Progress takes `value` and `indeterminate` as live properties, the loading
  indicator `size`, `contained` and `value`, both named by `aria-label`; the badge is
  standalone, labelled by its text or `label` and capped by `max`, with a live `visible`;
  the divider takes `orientation`, `variant`, insets, `thickness` and `color`.
- **Elements: `<m-icon-button>`, `<m-fab>`, `<m-extended-fab>` and `<m-checkbox>`**, with
  their React, Vue, Svelte and Solid components (`IconButton`, `Fab`, `ExtendedFab`,
  `Checkbox`). The icon button and the FAB are named by `aria-label`; the extended FAB and the
  checkbox by their children. A toggle icon button has a live `selected` property and a
  `toggle` event; the button-like elements' `type="submit"` and `type="reset"` act on the
  host's form. The checkbox is a form control like `<m-switch>` (`checked` as default and
  live state, `indeterminate` as a property, `change`, form value, reset, validity, `<label
  for>`, state restore).
- **Elements: `<m-slider>`**, with `Slider` in the React, Vue, Svelte and Solid adapters. A
  form control: `value` is the default as an attribute and the live state as a property,
  `range` adds a second handle with `second-value` / `secondValue`, and both ends submit
  under the host's `name`. `input` fires while the value moves and `change` when an
  interaction ends, with `{ value }` (and `secondValue` on a range). `aria-label` names the
  handles; `min`, `max`, `step`, `ticks`, `show-value`, `color` and `size` update in place.
  Form elements can now submit several values: `FormSpec.value` may return `FormData`.
- **Elements: `<m-textfield>`**, and `Textfield` in the React, Vue, Svelte and Solid
  adapters. A form control like a native input: the `value` attribute is the default and the
  `value` property the live text, bound by `v-model` and `bind:value`; `input` on each
  keystroke and `change` on commit, both with `{ value }`; form value, reset, validity from
  `required`, `maxlength`, `pattern` and `type`, `<label for>` and state restore. Named by
  its `label`; `variant`, `supporting-text`, `prefix-text`, `suffix-text`, the icons,
  `error`, `readonly` and `disabled` update in place, `type="multiline"` renders a textarea.
- **Elements: `<m-radios>` with `<m-radio>` children**, and `Radios` and `Radio` in the
  React, Vue, Svelte and Solid adapters (`MRadios` and `MRadio` in Vue). Each `<m-radio>`
  declares an option (`value`, `disabled`, its text or `label` as the label); the group is
  named by `aria-label` and takes `value` as its default selection and live property,
  `disabled`, `required` and `direction`. It dispatches `change` with `{ value }` on a click
  or an arrow key and is a form control (form value, reset, `required` validity, disabled
  fieldset, state restore). Children added at the end, removed, relabelled or disabled
  update the group in place.

### Changed

- **Time picker: an accessible DOM dial (FLO-279).** The clock dial is no longer a canvas
  hidden from assistive tech: it is a listbox of its numbers ("9 o'clock", "20 hours",
  "15 minutes"), reachable by Tab, moved through with the arrows and selected with Enter or
  Space, and a pointer can click or drag it. The hand, its 48dp handle and the on-primary
  label under it move together on the default spatial spring, the short way round, and the
  dial moves on to minutes once a pointer has picked the hour. Its colours come from the
  theme. In 24-hour mode noon and midnight now sit on the inner and outer rings at the top
  (the hand pointed at 00 at noon).
- **Time picker: the dial's hour and minute boxes are radios (FLO-283).** In dial mode they
  choose which part the dial sets, so they are a radiogroup of buttons named as Compose names
  them, with their value ("Select hour: 9 o'clock", "Select minutes: 35 minutes"): one tab
  stop, the arrows move the check. They are filled surface-container-highest, primary-container
  when checked, with state layers and the focus ring. Typing a time is the input mode's; the
  dial mode's boxes were number fields.
- **Date picker: the year picker scrolls.** It lists every year from `minDate` to `maxDate`
  (1900 to 2100 by default) in a vertically scrolling grid the height of the calendar, opened
  on the selected year, as the m3.material.io guidelines have it ("To navigate across
  years, scroll vertically"). It was ±10 years paged by the arrows, which the year view no
  longer shows (FLO-275).
- **Elements: the model attribute is the default, as natively.** On `<m-switch>`,
  `<m-checkbox>`, `<m-radios>`, `<m-icon-button>`, `<m-slider>` (`value` and `second-value`),
  `<m-tabs>` and `<m-textfield>`, a change of `checked`, `selected` or `value` moves the live
  state only until it is dirty: changed by the user, or set by script through the property
  or a method. Then the attribute is only the default `form.reset()` returns to, which also
  makes the element clean again; a restored form state is dirty. The attribute used to move
  the live state always, and `<m-tabs>` never.

### Fixed

- **Extended FAB: no manufactured `aria-label` (#232).** It is set only from `ariaLabel`. The
  factory copied `text` into it, which named `<m-extended-fab>`'s button
  "[object HTMLSlotElement]" until the element removed it again, and gave an extended FAB
  with no text the name "action", as the FAB did before FLO-110. The visible text is the
  name. A segmented button's text segment no longer copies its text into `aria-label`
  either; an icon-only segment is still named by its value.
- **Text field: the outlined variant's floating label sits in a notch of the outline
  (#234).** The outline is drawn in three segments, and while the label floats the middle
  one drops its top edge: the label's floated width plus 4dp on each side, starting 12dp
  in. Nothing is painted behind the label any more. It used to copy the nearest ancestor's
  background onto the label, which found `document.body` from inside `<m-textfield>`'s
  shadow root, covered any card that is not one flat colour, and kept a mutation observer
  per ancestor and a `themechange` listener for each field. The notch follows the label's
  text, density and direction; the outline is 1dp in `outline` at rest, `on-surface` on
  hover and 2dp `primary` on focus, in `error` for errors and `on-surface` at 12% disabled.
- **Selection controls: one label type (FLO-282).** The checkbox, radio and switch labels are all Body
  Large, a list item's headline. The radio label was Body Medium with a 1.2 line height, and
  the switch label Title Medium enlarged to 18px.
- **Time picker: a native modal dialog (FLO-278).** It opens with `showModal()`, over a
  0.32 scrim, with the page inert; it takes focus on open and returns it on close. Escape and
  a click on the backdrop cancel that picker only (Escape closed every open picker, and the
  backdrop did not emit `cancel`). Each picker's title has its own id, the mode toggle keeps
  focus, and `isOpen: true` opens the picker as documented. `modalElement` is now the dialog
  itself.
- **Date picker, measured against the M3 tokens (FLO-277).** Days show 0.08 hover, 0.10
  pressed and 0.10 focus layers in `on-surface-variant` (`on-primary` on the selected day),
  with the 3dp focus ring. The docked calendar has 16dp corners, outside-month days are
  `on-surface` at 38%, in-range days `on-secondary-container`, and the range band starts
  and ends square at the centre of its endpoints. The modal is 568dp tall. In right-to-left
  layouts the arrow keys follow the reading direction and the chevrons mirror.
- `<m-tab>` has a property for each attribute it declares (`value`, `label`, `icon`, `badge`,
  `disabled`), writing the attribute. Solid sets a custom element's props as properties, so a
  `<Tab value="…">` rendered in the browser lost its value and the tabs reported its label.
- `<m-tab>` values set before the elements are defined are kept: a client-rendered Solid app
  sets them before it registers the elements on mount. `defineTabs` also defines `<m-tab>`
  before `<m-tabs>`, so the tabs read upgraded children.
- Slider: keys and the pointer work in the task that creates it (#236). The listeners were
  attached a task later, so input right after `createSlider()`, a form reset or toggling
  `range` on `<m-slider>` was ignored. Placing the handles for a right-to-left layout now
  follows the slider's first layout, as the track's measurement already did.

## [0.10.0-next.1] - 2026-09-29

A prerelease of 0.10.0, the conformance and frameworks release, on the npm `next` tag
(`npm install mtrl@next`); `latest` stays at 0.9.8. It covers everything since 0.9.8,
including `0.10.0-next.0`, which shipped without notes. 0.10.x carries on with both lines of
work, and 1.0.0 follows when they are finished.

### Added

- **Web components (experimental).** `mtrl/elements` defines `<m-button>`, `<m-switch>`,
  `<m-tabs>` and `<m-tab>` over the existing factories: shadow DOM, slotted content, form
  association (value, validity, reset, state restore), attributes as defaults and properties
  as live state. Their CSS ships as modules, `mtrl/elements/css` or one component's
  `mtrl/elements/css/<name>`. Every module imports safely on a server.
- **Framework adapters (experimental).** `mtrl/react` (React 18 and 19), `mtrl/vue`,
  `mtrl/svelte` (Svelte 5) and `mtrl/solid`, generated from the elements: typed props and
  events, two-way binding (`checked`/`onChange`, `v-model`, `bind:checked`), refs to the
  element, and server rendering with hydration. Each framework is an optional peer dependency.
- Button `text` and switch `label` accept a DOM node as well as a string.
- Slider: M3 tokens, variants and motion, the inset icon, vertical orientation and the centred
  variant.
- Chips: the filter chip's trailing action and the dragged state.
- Date picker: swipe horizontally between months.

### Changed

- **Breaking:** class names. `addClass` and the element builders no longer prefix, and element
  classes are BEM (`mtrl-dialog__header`, not `mtrl-dialog-header`); `getClass` is the one
  place a prefix is applied.
- **Breaking:** inline styles are an object of properties, never a CSS string.
- **Breaking:** a boolean attribute set to `false` is left off instead of written `"false"`.
- **Breaking:** typed event maps. `on()` and `off()` take each component's own event names and
  payloads (button, FAB, extended FAB, icon button, snackbar, switch, radios, checkbox,
  textfield, time and date pickers, carousel, drawer, chips), so a misspelled event no longer
  compiles.
- **Breaking:** one rule for setting a selection by code, across radios, segmented button,
  select and tabs.
- **Breaking:** tab ids carry their group, and panel updates stay inside it.
- **Breaking:** chips follow Material: four chip factories, chip sets as an ARIA grid with a
  3px focus ring, Material's selection defaults, input chips always removable.
- **Breaking:** the list has the full Material anatomy; the date picker's calendar and input
  are conformant; the slider's and time picker's options, setters, callbacks and form values
  agree.

### Deprecated

- `rippleConfig` timing and opacity, which were never applied. The ripple is the press.

### Removed

- **Breaking:** the legacy navigation component (`createNavigation`, `createNavigationSystem`).
  Use the navigation rail, the drawer or tabs.

### Fixed

- M3 conformance. Checkbox: the box, state layers, focus ring, error, Space only. Radios: the
  2dp ring, 10dp dot, state layers, keyboard-only focus. Switch: the RTL handle, icons, states,
  focus and label side. Tabs: the indicator, inactive colours, focus ring, manual activation,
  names for icon-only tabs, the responsive layout. Time picker: colour roles, headline type,
  AM/PM as a radiogroup, an accessible text-input mode. Badge: empty labels, overflow and
  positioning.
- Themes: every theme has its inverse colour roles; baseline has its error-container roles.
- Slider: range handles stop at each other, PageUp moves by a tenth, RTL, the handles'
  listeners are removed on destroy, and no stray piece of track at a short end.
- Types: `noImplicitAny`, `strictNullChecks` and `noImplicitThis` are on for the whole
  library, and the four flagship factories declare what they return.

## [0.10.0-next.0] - 2026-09-21

The first prerelease of 0.10.0, published without notes. Its changes are described
under 0.10.0-next.1.

## [0.9.8] - 2026-09-20

The types and security patch that closed the 0.9 line, including the
changes planned for 0.9.7.

### Added

- Search, time picker and slider take part in forms under a name.

### Fixed

- Core: one markup sink with a consumer policy for sanitizing and Trusted
  Types; a throwing listener no longer stops the others;
  lifecycle.destroy works whatever its receiver.
- Reduced motion stops movement and keeps fades.
- Time picker: a second picker works, and AM/PM answer the keyboard.
- Tabs: aria-controls points at a panel that exists.
- Textfield: the icon, prefix and suffix setters create their slot.
- Slider and menu: element lookups are scoped to their own component.
- Types: a types condition for mtrl/styles; select, menu, core, tabs,
  chips, progress and more pass strictNullChecks.

## [0.9.6] - 2026-09-17

The accessibility release, with the motion the review found on the way.

### Added

- Menu: a listbox option renders it as the listbox popup of a combobox,
  for select and for any consumer building one.
- Dialog: afteropen and afterclose, and the overlay's removal, wait for the
  motion (500 and 150ms) unless animationDuration is set.

### Changed

- Motion durations were 1.5 to 2 times their M3 tokens; short3 was 250ms
  where the token is 150ms. Every duration token now carries its M3 value,
  with medium3, medium4, long3, long4 and extra-long1 to 4 added, and
  easing-emphasized, which equalled easing-standard, is now the emphasized
  curve. Every component that uses the tokens is quicker as a result.
- Drawer, side sheet and bottom sheet open on the expressive spatial spring
  and close on the fast effects spring, as Compose does, with the scrim
  following the sheet and a guard over the overshoot at the docked edge.
- Dialog: the scrim fades in, the dialog grows in height from 35% over
  500ms on emphasized while its headline, content and actions fade in one
  after another, and it closes in 150ms on emphasized accelerate, as
  material-web does. It used to appear and vanish at once.
- Menu: closing runs the opening motion in reverse.

### Fixed

- Switch: the label was never linked to its input, so clicking it did
  nothing. Switch and checkbox also carried an aria-label copied from the
  label text, which outranked the label and went stale after setLabel();
  it is dropped, and an explicit ariaLabel now wins over the label text.
- Textfield: supporting text describes the input through aria-describedby,
  keeping ids the page set, and the input is aria-invalid while the field
  is in error. Select, built on textfield, gets the same.
- Tabs: arrow keys move between tabs, skipping disabled ones and wrapping,
  Home and End reach the ends, and left and right follow the reading
  direction. Only the active tab is a tab stop; the stop follows the
  selection and added or removed tabs. Up and Down are left to the page.
- Tooltip: Escape hides it without moving focus, and the pointer can rest
  on it (WCAG 1.4.13); leaving it hides after hideDelay.
- Button: a loading button is aria-busy.
- Select: a select with flat options is a select-only combobox. The input
  is role="combobox" with aria-expanded, keeps focus and owns the keyboard
  (arrows, Home, End, PageUp, PageDown, Enter, Space, Escape, Tab,
  type-to-find); the popup is a listbox of options named through
  aria-activedescendant. A select whose options have submenus keeps the
  menu button.

## [0.9.5] - 2026-09-17

A patch from porting component tests off their mocks. Fourteen suites had
asserted against copies of the components written in the test files; each
now drives the real component, and nearly every port found a defect the copy
had hidden.

### Fixed

- Button: setLoading(true, text) kept the old label and stored nothing to
  restore, so setLoading(false) could not bring it back.
- Radios: disable() styled the group as disabled while every radio stayed
  usable. Change handlers ran twice per selection, the second time with no
  payload, and off() removed nothing. setValue() with a value no option
  carries now clears the selection instead of reporting a value nothing shows.
- Tooltip: position, showDelay, hideDelay, showOnHover and showOnFocus were
  ignored in favour of fixed defaults. The tooltip also overwrote or removed a
  target's existing aria-describedby and left an old target described after
  setTarget(); it now adds and removes only its own id.
- Search: suggestions passed in config were never rendered, and the
  onExpand and onCollapse callbacks were never called.
- Tabs: change handlers ran twice per click, setActiveTab() selected a
  disabled tab, and handlers passed as config.on were never registered.
- Top and bottom app bars: destroy() left the window scroll listener in
  place, so a destroyed bar kept calling onScroll or onVisibilityChange. The
  bottom bar's show() and hide() did not call onVisibilityChange.
- Textfield: readonly was ignored, so a readonly field stayed editable.
  setError(false) left the error message showing as helper text; the helper
  text it displaced is now restored.
- Select: the open event fired only when opening from the keyboard, and
  open() opened a disabled select.
- Slider: in a range slider the second handle kept announcing its initial
  value after setSecondValue() or keyboard input. A valueFormatter now reaches
  assistive technology through aria-valuetext.
- Badge: setVariant() kept the ARIA of the variant it left, so a small badge
  switched to large stayed aria-hidden and its count was never announced.
  removeClass() threw.
- Divider: every setter worked only from the state the divider was created
  with. Getters went stale after setOrientation() and setVariant(), switching
  back left both modifier classes, setInset() did nothing after setVariant(),
  setThickness() sized the wrong axis after setOrientation(), and an inset set
  later overflowed its parent. A vertical divider now carries
  aria-orientation="vertical".
- Card: aria: { role } was written as an aria-role attribute and left the
  card with no role. A header title never named its card, and every title
  shared one id; titles now get unique ids and setHeader() labels the card
  unless it already has a name. setHeader() placed the header below the
  content on a card with media at the bottom.

### Tests

- Button, radios, tooltip, search, tabs, both app bars, textfield, select,
  slider, badge, divider, card and drawer are tested against the real
  components, and navigation, which is deprecated, keeps a smoke test of what
  mtrl.app uses. Only chips, list, time picker and date picker still test
  mocks; they wait for M3 conformance work before their behaviour is tested.

## [0.9.4] - 2026-09-17

### Removed

- SWITCH_LABEL_POSITION in switch/types.ts, an unused duplicate of
  SWITCH_LABEL_POSITIONS that was never exported from the package.

### Fixed

- Components no longer put their name on the root element. createElement wrote
  name onto whatever it built, so the root of most components carried it on a
  div, nav, aside or span, where the attribute is invalid. For checkbox,
  switch, textfield, select, datepicker and radios, both the root and the input
  were named, so form.querySelector('[name="x"]') and getElementsByName found
  the component's root before the control that submits the value. name is now
  written only on elements HTML defines it for; components whose root is a
  button keep it.
- Switch: SWITCH_DEFAULTS.LABEL_POSITION said end while a switch with no
  labelPosition rendered its label at the start. The label leads, as in M3
  settings rows, so the constant is now START and the switch reads its default
  from it. No switch changes appearance; code that passed the constant
  explicitly will now see its label at the start.

## [0.9.3] - 2026-09-17

A patch from porting component tests off their mocks. The switch and checkbox
suites had asserted against copies of the components defined in the test
files, and each copy implemented the methods that were broken in the real one.

### Fixed

- Switch and checkbox: setLabel() and getLabel() read a key the component
  never had, so getLabel() returned an empty string even for a rendered label
  and setLabel() changed nothing.
- Switch: supportingTextElement was a value captured when the component was
  created, so it went on reporting the old element after setSupportingText()
  or removeSupportingText(). It reads the live element now.
- Checkbox: the indeterminate class was set separately from the input's
  indeterminate state and drifted from it. From config the state was set but
  not the class; after a user click cleared the state, the class stayed. The
  class now follows the input.

### Tests

- The test tree is type-checked in CI. Its configuration had never run, and
  two local declarations of bun:test had typed every assertion as any. The
  component suites that still test mocks are listed by name, and the list can
  only shrink.
- Switch and checkbox are tested against the real components.

## [0.9.2] - 2026-09-17

A test-integrity patch. Two core suites had never run, and running them found
a defect in shipped code.

### Fixed

- Disabled state: on a component whose root is not a form element, disable()
  recorded the state as a class and an attribute, while isDisabled() read only
  the element's disabled property, which a div does not have. It answered false
  permanently, and toggle(), which branches on it, disabled once and never
  enabled again. Progress publishes isDisabled directly, so a disabled progress
  indicator reported itself enabled. isDisabled() now reads the attribute that
  disable() writes. Inputs and button roots are unchanged.

### Tests

- The withCheckable and withDisabled suites were saved without the .test.ts
  suffix, so the runner never collected their 24 tests. They run now. Six
  asserted an API the enhancer never had and were corrected, and one passed
  only because the class it checked for could never appear.
- CI now fails any file under test/ that defines tests the runner would not
  collect.

## [0.9.1] - 2026-09-16

A security patch. Five places rendered untrusted input as markup, or assigned a
URL without checking its scheme. Component configuration is frequently
CMS-shaped, so none of these values are reliably author-controlled.

**Not changed:** The carousel's content option still accepts a string of markup. That is
  documented behaviour with a node alternative beside it, so narrowing it is a
  breaking change rather than a fix, and it waits for a version that can carry
  one.

### Added

- safeUrl and isSafeUrl in core utils, an allowlist of http, https, mailto, tel,
  ftp and sms. Relative URLs, fragments and query-only URLs have no scheme and
  pass, since they cannot execute. A refused URL yields an empty string, leaving
  an inert control rather than breaking the page around it.

### Fixed

- Card: text was interpolated into innerHTML, so an app binding comments or CMS
  copy to it had an XSS sink with no way to opt out. It is set as text now. The
  html option is untouched: that is the documented markup path, and text was
  never documented as accepting markup.
- Search: the suggestion label and the query were wrapped in <strong> as a
  string and fed to innerHTML. The highlight is built from text nodes now. The
  exploitable case was a suggestion that did not match the query, where the text
  was passed through unchanged.
- Carousel and navigation rail: the slide buttonUrl, the slide image and the
  destination href accepted javascript: URLs, which turn a styled control into
  one that runs script when a user clicks it.
- createElement: the options spread wrote every unreserved key as an attribute,
  so spreading CMS-shaped props could attach onclick or onerror. Keys matching
  /^on[a-z]/i are refused; listeners belong on forwardEvents or addEventListener.
- Attributes: href, src and action are scheme-checked at every path that sets
  them, not at the call sites — the single-attribute fast path, the
  multi-attribute loop, the batched operations, and a fourth setter in
  core/dom/utils that also attached on* keys as real listeners.

## [0.9.0] - 2026-09-16

The M3 audit release. Every component that had never been checked against
its Material 3 tokens was audited, and the findings that were defects
rather than drift are fixed. Nothing here is a new API: it is the library
doing what its own tokens already said.

### Changed

- Tabs: the stylesheet addressed classes the component never emits, so the
  icon sizing, the label rules, the icon-only label hiding and the badge
  offsets were all inert. They apply now, and tab icons are 24dp rather
  than the button's 20px. The active indicator is 3dp in both variants and
  takes the primary colour (the secondary variant was 2px and on-surface),
  a tab paints one state layer instead of two, a non-scrollable row shares
  its width evenly, and a scrollable row is padded 52dp at both edges.
- Tooltip: no tooltip CSS shipped at all. The stylesheet was registered in
  neither the full bundle nor the selective manifest, so every consumer got
  a working component with no styling. It ships now.
- Checkbox: the interactive size is 48dp, up from a 40px row that had no
  minimum width, so an unlabelled checkbox was as wide as its 18px icon.
- Checkbox, radios and switch: disabled states use the per-role tokens
  instead of one opacity over the whole control. The switch's disabled
  track is 12% and its selected handle is Surface at full opacity; radios
  no longer compound two dimmers to roughly 23% against a specified 38%.
- State layers: seventeen rules across chips, datepicker, dialog, radios,
  tabs and timepicker used 0.12, the Material 2 figure, where M3 specifies
  0.08 hover and 0.10 focus and pressed. 0.12 is kept where M3 asks for it,
  on disabled containers and on selected container fills.

### Fixed

- Badge: a badge created through a tab or through withBadge rendered empty,
  because the hosts passed content where the config reads label.
- Date picker: the calendar surface had no shadow. v.elevation('level3')
  missed the hyphenated map key, so Sass dropped the declaration outright.
- Divider: an inset divider overflowed its parent, having been given
  margins on top of width 100%.
- Date picker: the outside-click listener is taken off the document on
  destroy.

### Internal

- No ESLint findings in src, and lint runs in CI. pipe and compose are
  typed with overloads, guarded by a compile-fail fixture proving the rest
  overload cannot swallow a mismatched pipe.
- The touch-target mixin states its offsets rather than over-constraining
  them; the over-constrained form anchored the target off-centre under RTL.

## [0.8.0] - 2026-09-15

The Material 3 expressive release. Components are aligned with the M3
expressive tokens, several are new or rebuilt, and the package ships ESM
modules with selective stylesheets.

### Added

- Components: bottom sheet, side sheet, split button, loading indicator,
  standalone navigation rail (collapsed, expanded, modal), vertical menu
  variant.
- Button: toggle buttons with the M3 selected colours and shape swap,
  shape hooks, toggleOnClick. Button group: connected kind, single and
  multi selection, size tokens, labels on the selected button only.
- FAB: medium size. Extended FAB: small, medium and large sizes.
- Select: menu options that escape a clipping container.
- Styles: M3 spring motion tokens; shape scale and typescale as custom
  properties; selective style entry points (mtrl/styles/*) and themes
  (mtrl/themes/*); a legacy theme.

Changed and fixed, by component

- Button, icon button, button group, split button: sizes, shapes, colours,
  states and press morph from the M3 tokens; icon button round shapes are
  pills whose press morph animates, the 48dp target of the two small sizes
  takes the pointer, and the toggle listener is released on destroy. In a
  standard button group every neighbour makes room for a pressed button, and
  connected groups press without flashing square corners.
- FAB and extended FAB: elevation 3/4/3/3 (lowered 1/2/1/1), disabled
  styles from real theme roles, large icon 32px, initial value and user
  classes kept.
- Carousel: rebuilt on the M3 keyline strategy with native scrolling.
- Drawer: expressive active indicator, navigation semantics and modal
  lifecycle. Navigation rail: expressive selection and expansion motion.
- Menu, dialog, snackbar, progress, slider, card, textfield: M3 tokens,
  accessibility and listener cleanup on destroy.
- Core: components own their cleanup; setup overhead reduced.
- Theme: state layers with color-mix; data-theme observed on <html>.
- Package: component barrels re-export their types as types; the exports
  map describes what is published.

### Changed

- **Breaking:** createSheet, SheetConfig and SheetComponent are removed. The component
  never worked (open and close threw). Use createBottomSheet or
  createSideSheet.
- **Breaking:** FAB and extended FAB: variant 'primary', 'secondary' and 'tertiary' now
  mean the tone styles (primary on on-primary, and so on). The former look
  is 'primary-container', 'secondary-container' and 'tertiary-container',
  and 'primary-container' is the default. 'surface' is deprecated.
- **Breaking:** Extended FAB: the label uses title-medium at the default small size
  (was label-large), and iconPosition 'end' now places the icon after the
  label (it was ignored before).
- **Breaking:** Segmented button: deprecated in favour of createButtonGroup with
  kind 'connected'. SegmentedButtonEvent now declares the payload the
  component sends, { selected, value, oldValue }. Default, comfortable and
  compact heights are 40, 36 and 32px (4px taller than before).
- **Breaking:** Slider: decoration is DOM and CSS; the .mtrl-slider-canvas element is
  gone, so styles targeting it must be updated.
- **Breaking:** Package: the 'development' export condition that resolved to src is
  removed; every entry resolves to dist. sideEffects lists the CSS, SCSS
  and style modules instead of false, so bundlers keep stylesheet imports.
- **Breaking:** Custom properties: every component custom property is
  --mtrl-<component>-<name>, with no aliases for the old names. Renamed:
  --button-group-gap, -height, -icon, -inner-corner, -pressed-corner and
  -radius to --mtrl-button-group-*; --card-elevation to
  --mtrl-card-elevation; --checkmark-color to --mtrl-chip-checkmark-color;
  --drawer-width to --mtrl-drawer-width; --extended-fab-gap, -height,
  -icon-size, -padding and -radius to --mtrl-extended-fab-*; --item-offset
  to --mtrl-list-item-offset; --segment-* to --mtrl-segmented-button-*.
  --mtrl-carousel-corner, --mtrl-carousel-fade, --mtrl-slider-color and
  --mtrl-slider-on-color keep their names.
- **Breaking:** Typescale: title-large uses weight 400 (was 500), as M3 specifies. The
  medium extended FAB, full-screen dialog title, card header title, side
  sheet title, top app bar headline and h4 follow.

### Internal

- CI runs types, tests, build, package size and browser checks on every
  push and pull request; releases publish to npm with trusted publishing
  from a version tag.

[Unreleased]: https://github.com/floor/mtrl/compare/v0.10.6...HEAD
[0.10.6]: https://github.com/floor/mtrl/compare/v0.10.5...v0.10.6
[0.10.5]: https://github.com/floor/mtrl/compare/v0.10.4...v0.10.5
[0.10.4]: https://github.com/floor/mtrl/compare/v0.10.3...v0.10.4
[0.10.3]: https://github.com/floor/mtrl/compare/v0.10.2...v0.10.3
[0.10.2]: https://github.com/floor/mtrl/compare/v0.10.1...v0.10.2
[0.10.1]: https://github.com/floor/mtrl/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/floor/mtrl/compare/v0.10.0-next.3...v0.10.0
[0.10.0-next.3]: https://github.com/floor/mtrl/compare/v0.10.0-next.2...v0.10.0-next.3
[0.10.0-next.2]: https://github.com/floor/mtrl/compare/v0.10.0-next.1...v0.10.0-next.2
[0.10.0-next.1]: https://github.com/floor/mtrl/compare/v0.10.0-next.0...v0.10.0-next.1
[0.10.0-next.0]: https://github.com/floor/mtrl/compare/v0.9.8...v0.10.0-next.0
[0.9.8]: https://github.com/floor/mtrl/compare/v0.9.6...v0.9.8
[0.9.6]: https://github.com/floor/mtrl/compare/v0.9.5...v0.9.6
[0.9.5]: https://github.com/floor/mtrl/compare/v0.9.4...v0.9.5
[0.9.4]: https://github.com/floor/mtrl/compare/v0.9.3...v0.9.4
[0.9.3]: https://github.com/floor/mtrl/compare/v0.9.2...v0.9.3
[0.9.2]: https://github.com/floor/mtrl/compare/v0.9.1...v0.9.2
[0.9.1]: https://github.com/floor/mtrl/compare/v0.9.0...v0.9.1
[0.9.0]: https://github.com/floor/mtrl/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/floor/mtrl/compare/v0.7.1...v0.8.0
