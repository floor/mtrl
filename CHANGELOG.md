# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This changelog starts at 0.8.0, the first release with written notes (September 2026).
Earlier versions are in the [git history](https://github.com/floor/mtrl/commits/main).

## [Unreleased]

### Migrating from 0.10.x

Upgrade to 0.10.6 first. It exports the 1.0 names beside the old ones, and marks deprecated the
TypeScript names, options and constants that 1.0 removes, so your editor flags each use with its
replacement. Two of those warnings can't be cleared before you upgrade, because the new name
exists only in 1.0: `SELECT_CLASSES.TEXTFIELD` (its new key is `TEXT_FIELD`) and
`select.textfield` (1.0 has `select.textField`). Clear the others, then upgrade. Each change's full entry follows this guide.

**Packages and imports**

- **ESM only.** `require('mtrl')` throws `ERR_PACKAGE_PATH_NOT_EXPORTED`. Use `import`, or
  `await import('mtrl')` from CommonJS.
- **The root keeps the components.** The composition core, the DOM, timing and store helpers and
  the progress canvas code are imported from their subpaths, under the same names
  (`import { pipe } from 'mtrl/core/compose'`). The
  [migration table](https://github.com/floor/mtrl/blob/main/scripts/fixtures/root-exports.md)
  gives every one.
- **Folders inside a component no longer resolve** (`mtrl/components/chips/chip`,
  `…/features`): they held internals, with no replacement.
- **Vue 3.4.20 or newer.** With `skipLibCheck: false`, `@types/react` 18.2.71 or newer.

**Renamed**

| 0.10 | 1.0 |
|---|---|
| `createTextfield`, `TextfieldConfig`, `TextfieldComponent`, `TextfieldDensity`, `TextfieldEvents`, `TextfieldValuePayload`, `TextfieldFocusPayload`, `TextfieldTrailingPayload` | `createTextField`, `TextFieldConfig`, `TextFieldComponent`, `TextFieldDensity`, `TextFieldEvents`, `TextFieldValuePayload`, `TextFieldFocusPayload`, `TextFieldTrailingPayload` |
| `TEXTFIELD_VARIANTS`, `TEXTFIELD_STATES`, `TEXTFIELD_TYPES`, `TEXTFIELD_EVENTS`, `TEXTFIELD_DENSITY`, `TEXTFIELD_DEFAULTS`, `TEXTFIELD_CLASSES` | `TEXT_FIELD_VARIANTS`, `TEXT_FIELD_STATES`, `TEXT_FIELD_TYPES`, `TEXT_FIELD_EVENTS`, `TEXT_FIELD_DENSITY`, `TEXT_FIELD_DEFAULTS`, `TEXT_FIELD_CLASSES` |
| `textfieldElement`, `defineTextfield`, `TextfieldSpec`, `TextfieldElement`, `TextfieldElementComponent` (`mtrl/elements`) | `textFieldElement`, `defineTextField`, `TextFieldSpec`, `TextFieldElement`, `TextFieldElementComponent` |
| `Textfield` (`mtrl/react`, `mtrl/solid`, `mtrl/svelte`), `MTextfield` (`mtrl/vue`) | `TextField`, `MTextField` |
| Sass `$textfield`, `textfield()` | `$text-field`, `text-field()` |
| `SELECT_CLASSES.TEXTFIELD` | `SELECT_CLASSES.TEXT_FIELD`, the same value. A recorded exception: 0.10.x flags the old key but has no new one, so change it when you upgrade. In 1.0 the old key reads `undefined`. |
| `select.textfield` | `select.textField`. A recorded exception, like the key above: 0.10.x flags the old name but has no `textField`, so rename it when you upgrade. In 1.0 `select.textfield` reads `undefined`. |
| `CardSchema` | `CardConfig` |
| the time picker's config option `isOpen`, and its default `TIMEPICKER_DEFAULTS.IS_OPEN` | `open` and `TIMEPICKER_DEFAULTS.OPEN`, as on the dialog and the drawer. `isOpen()` is the method that reads the state |
| `TopAppBar`, `BottomAppBar` (the factory types) | `TopAppBarComponent`, `BottomAppBarComponent` |
| a chip's `text` | `label` |
| tabs `indicatorHeight`, `indicatorWidthStrategy` | `indicator.height`, `indicator.widthStrategy` |
| shapes `'cookie4'`, `'cookie9'` | `'cookie4Sided'`, `'cookie9Sided'` |
| `createElement({ rawClass })` | `class` or `className` |
| the tooltip's `rich` | `variant: 'rich'` |
| `onToggle` on the icon button (`mtrl/react`, `mtrl/vue`, `mtrl/solid`; `ontoggle` in `mtrl/svelte`) | `onChange` (`onchange`), whose `event.detail` is `{ selected, value }`. A leftover is a type error: `… is not assignable to type '"onToggle was removed in 1.0: use onChange"'`. |

The text field's tag, element name, CSS classes, event names and constant values keep
`textfield`.

**Removed, with what to use instead**

| 0.10 | 1.0 |
|---|---|
| the icon button's DOM `toggle` event | `change`, on the factory's button (`button.on('change', …)`) and on `<m-icon-button>` |
| segmented buttons (`createSegmentedButton`, `createSegment`) | `createButtonGroup({ kind: 'connected' })`: see its entry for the option mapping |
| the themes `material`, `winter`, `browngreen`, `legacy` | `baseline`, `ocean`, `brownbeige`; `legacy` has none |
| FAB and extended FAB `variant: 'surface'`, `FAB_VARIANTS.SURFACE`, `EXTENDED_FAB_VARIANTS.SURFACE` | a container or tone style (`'primary-container'`, `'primary'`, …) |
| FAB `size: 'small'`, `FAB_SIZES.SMALL`, `FAB_CLASSES.SMALL`, `FAB_ICON_SIZES.SMALL` | `'default'`, `'medium'` or `'large'` (the extended FAB keeps `small`) |
| `getThemeColor('sys-color-X-rgb')` | `getThemeColor('sys-color-X', { alpha })` |
| `TIMEPICKER_CLASSES` | `TIMEPICKER_SELECTORS`, which is not a like-for-like swap: see its row |
| `TABS_DEFAULTS.INDICATOR_HEIGHT`, `INDICATOR_ANIMATION_DURATION` | `indicator.height`, `indicator.animationDuration` |
| `DEFAULT_DATE_FORMAT` from `mtrl/components/datepicker` | the same from `mtrl/components/datepicker/constants` |
| the shape steps `extra-tiny`, `tiny`, `pill` | literal `1px`, `2px`; `full` for `pill` |
| Sass `$mtrl-sys-shape` | `v.shape(<step>)` |
| `select.menu` (the menu inside a select) | the select's own `open()`, `close()`, `isOpen()`, `getOptions()`, `setOptions()` and its `open`, `close` and `change` events. The `menu` config option (`container`, `maxHeight`, …) stays |
| `splitButton.menu` (the menu inside a split button) | `expand()`, `collapse()`, `isExpanded()`, the `expand`, `collapse` and `select` events, and the new `setItems()` and `getItems()` |

Removed with nothing in their place, because nothing read them or they had no effect: a dialog
button's `color`, `TOOLTIP_DEFAULTS.RICH`, the checkbox's `variant`, `CheckboxVariant` and
`CHECKBOX_VARIANTS`, the list's `prefix`, the radios' `rippleConfig` and `RADIO_VARIANTS`,
`RADIO_LABEL_POSITIONS`, `RADIO_SIZES`, `RADIO_CLASSES`, `RADIO_DEFAULTS.VARIANT`,
`.LABEL_POSITION` and `.SIZE`, tabs' `maxVisibleTabs`, the time
picker's `closeOnSelect` and `TIMEPICKER_DEFAULTS.CLOSE_ON_SELECT`, `TIMEPICKER_DIAL`,
`TIMEPICKER_Z_INDEX`, `TIMEPICKER_SELECTORS.MODAL`, `DIAL_CANVAS` and `DIAL_HAND`, six
`SLIDER_MEASUREMENTS` keys, `TABS_DEFAULTS.INDICATOR_ANIMATION_TIMING` and `ICON_SIZE`,
`TEXT_FIELD_CLASSES.LABEL_FLOATING`, `rippleConfig.timing` and `.opacity` with their defaults,
the card, tabs and switch internals on their subpaths, `ChipConfig`'s `managedSelection` and
`cell`, `CardComponent`'s `loading`, `expandable` and `swipeable`, and the list `scroll` payload's
`component`, which was never sent.

**Sass.** The two Sass rows above are for stylesheets that `@use` mtrl's sources. The Sass sources
ship for reference; configuring them with `@use … with` is not a supported API in 1.0. Theme
with CSS custom properties.

**Type changes the compiler reports.** Besides renames and removals, seven entries below change
a type your code may rely on: tabs' `on` and `off` take a closed event map, and a tab's `click`
payload is wrapped (FLO-523); React's and Solid's `Button` type their own `onChange`, so a
spread of full `HTMLAttributes` must omit it (FLO-380); `SelectChangeEvent["value"]` is
`string | null` (FLO-380); the chip set's `change` listener takes one object, not an array
and a second argument (FLO-530); a standalone chip's `onChange` and `onClick` take their
event's payload; and `emit` on the card and the tabs takes only the
component's own events, with their payloads. A config `on*` option is its event's listener
type: `onConfirm: (time: string) => void`, search `onInput` / `onSubmit:
(value: string) => void`, and `onSuggestionSelect: (suggestion: SearchSuggestion)
=> void` are errors. A `() => void` callback is still assignable, so search
`onClear`, `onExpand` and `onCollapse`, and the navigation rail's `onExpand`
and `onCollapse`, are not. The search's `expand` and `collapse` are typed with the
object they emit, `SearchStateEvent` (`{ component, state, viewMode }`), in `on()`, `off()`,
the `on` map and `onExpand` / `onCollapse`: they were typed `SearchEvent`, so
`event.value` and `event.preventDefault()` there are now errors (they were `undefined`
and a `TypeError` at run time, measured), `event.state` and `event.viewMode` compile, and
a listener annotated `(event: SearchEvent) => void` on those two is an error. The
`<m-search>` component's `on` and `off` take the same map with the element's names
(`open` and `close` carry the `SearchStateEvent`), so a name outside it is an error too. The
`<m-timepicker>` component's `on` and `off` take the time picker's event map
(`TimePickerEvents`) in place of any string and an untyped handler (FLO-547): a name outside
it is an error, and each handler's argument is typed, so one annotated with another type, or
an argument on `open`, `close` or `cancel`, is an error. The time picker's `isOpen` is a
method (FLO-548): `picker.isOpen === true` and assigning it to a `boolean` are errors.
`SnackbarState` gains `"queued"`, so a `switch` over it that had to be exhaustive is not.
The menu's and the select's `open` and `close` payloads (`MenuEvent`, `SelectEvent`) and the
select's `change` payload (`SelectChangeEvent`) have no `preventDefault` and no
`defaultPrevented` (FLO-548): none of these events could ever be cancelled, so
`event.preventDefault()` in such a listener is an error. The menu's `select`, where it keeps
the menu open, keeps both.

**Changes your compiler won't catch**

Check these by searching your code: they compile, or come from plain JavaScript, markup or CSS.

- **A chip's `{ text }`** renders an empty chip, silently: no label, no error, no warning.
- **Tabs `indicatorHeight` / `indicatorWidthStrategy`** are ignored: the indicator falls back to
  its variant's height (3px on a primary row, 2px on a secondary one) and automatic width.
- **`materialShape('cookie4')`** throws `TypeError: byName[name] is not a function`.
- **`createElement({ rawClass })`** applies no class and writes the value out as an attribute:
  `<div rawclass="legacy-a legacy-b">`. On a component's config a leftover `rawClass` does
  nothing.
- **A listener on the icon button's `toggle` event** never fires: no error, and the button still
  toggles. Listen to `change`. In the React, Vue, Svelte and Solid components the compiler does
  catch it: `onToggle` (Svelte: `ontoggle`) on the icon button is a type error.
- **`select.textfield`** in JavaScript is `undefined`.
- **A FAB's `'surface'` or `'small'`** (the options take any string) renders as the default
  `primary-container`, or at the default 56dp.
- **`data-theme="winter"`** (or `material`, `browngreen`, `legacy`) on the root element gets the
  baseline colours in the OS's colour scheme, and `data-theme-mode` and `data-theme-contrast` on
  that element are ignored. The OS contrast preference (`prefers-contrast: more`) is not applied
  there either: a user who asked for more contrast gets standard contrast. On a nested element
  it matches no rule, so that element keeps its ancestor's colours.
- **`getThemeColor('sys-color-primary-rgb')`** returns `''` (or the `fallback`), so
  `rgba(${…}, 0.12)` yields `rgba(, 0.12)`, a colour CSS and canvas drop silently.
- **A removed constant key** reads `undefined` in JavaScript, with no error:
  `SELECT_CLASSES.TEXTFIELD`, `FAB_SIZES.SMALL`, `TABS_DEFAULTS.INDICATOR_HEIGHT` and the other
  keys in the tables above.
- **Your own CSS reading `var(--mtrl-sys-shape-corner-pill)`** (or `-tiny`, `-extra-tiny`): mtrl's
  stylesheet no longer declares the property, and a `var()` of an undeclared property without a
  fallback gives no value, so the radius is lost silently.
- **`mtrl/styles/base` no longer carries typography (FLO-539).** Without
  `import 'mtrl/styles/typography'`, `.mtrl-display-large` … `.mtrl-label-small`,
  `.mtrl-text-center` / `left` / `right`, `.mtrl-font-thin` / `light` / `regular` /
  `medium` / `bold`, and `.mtrl-truncate`, `-2` and `-3` do nothing, and `h1`–`h6` and `p`
  lose mtrl's type styles. Measured in Chromium with only the base stylesheet: a
  `<div class="mtrl-headline-small">` computed `font-size: 14px`, inherited from `body`
  (with the import it is `24px`).
  `getPropertyValue('--mtrl-sys-typescale-title-large-font-size')` returned `""`, and an
  element styled `font-size: var(--mtrl-sys-typescale-title-large-font-size)` inside a parent
  at `32px` computed `32px`: the custom property is undefined, so the declaration is invalid
  at computed-value time and `font-size` inherits (with the import the property is `22px`
  and the element computes `22px`). Body text keeps its font: `body` stayed `14px`
  `Roboto, sans-serif`. `import 'mtrl/styles'` is unchanged. The typography sheet has to
  load after the base (both style `h1`–`h6` and `p`; loaded first, it loses its bottom
  margins to the reset): `import 'mtrl/styles/typography'` imports the base first itself, and
  a page using `<link>` tags puts `styles/typography.css` after `styles/base.css`.
- **Tab and panel ids** change for any value with a character outside `[A-Za-z0-9_-]`
  (`a.b` → `tabx-g-a_2e_b`); a hand-written panel with the old id is never linked. Build ids with
  `tabIdFor` and `tabPanelIdFor`.
- **Checkbox and switch `change.value`** is the boolean checked state; the HTML string token is
  `valueAttribute`, also in `event.detail`.
- **The chip set's `change`** hands its factory listener and `onChange` one plain object,
  `{ value, selected, changed }`, not an array with the changed value as a second argument. In
  a leftover handler `event[0]` and `event.length` are `undefined`, `[...event]` and
  `event.includes(x)` each throw a `TypeError` (the message is the engine's), and a second
  parameter is `undefined`. Read `selected` and `changed`. `onChange` hears the same changes
  as `on("change")`, including `selectByValue(values, true)`, with `changed: null`.
  `selectByValue(values)` and `clearSelection()` stay silent.
- **A chip's config `on*` options** are the matching event's listener. A leftover
  `onChange(selected, chip)` on a chip alone is called with one object: `selected` is
  `{ selected, chip, value }` (so `selected` is always truthy, and the boolean is
  `selected.selected`; deselecting a chip valued `"old"` passes
  `{ selected: false, chip, value: "old" }`), and the second parameter is `undefined`.
  A leftover `onClick(chip)` is called with `{ event, originalEvent, element }`:
  `element` is the chip's root, and the value is not the chip (`focus` is `undefined`).
  The set's `onChange` now hears `selectByValue(values, true)`. A chip in a set emits
  its own `change` when it is clicked, and the item's `onChange` receives that payload.
  A leftover `onChange(selected, chip)` on that item is called with one object, as on a
  chip alone: `selected` is `{ selected, chip, value }` (measured on a filter chip valued
  `"old"`: selecting passes `{ selected: true, chip, value: "old" }`, deselecting passes
  `{ selected: false, chip, value: "old" }`), and the second parameter is `undefined`.
  `setSelected` and `selectByValue` do not emit the chip's `change`. A single-select click
  emits `change` on the clicked chip only; the chip it replaces is updated with
  `setSelected`, which stays silent.
- **A chip's `onClick` and `click` listeners run before the chip toggles**, alone or in a
  set: `chip.isSelected()` inside them is the state before the click. A chip alone used to
  toggle and emit `change` first. Read the new state in `onChange` or a `change` listener,
  which follows.
- **A chip's `change` is emitted only when the selection changed (FLO-550).** In a
  `selectionRequired` set, a click on the last selected chip is refused: it used to emit
  `change` on the chip and on the set, with the chip still selected, and call both `onChange`.
  It now emits none, the item's `onSelect` is not called, and `<m-chips>` dispatches no
  `change`; `click` and `onClick` still report the press.
- **A chip's `remove` listeners in a set run before the set removes the chip.** The item's
  `onRemove` and a `chip.on("remove")` listener find the chip still in `getChips()` and on the
  page; the set then destroys it and emits its own `remove`. A listener added with `on` used
  to run after the set had destroyed and unlisted the chip.
- **The time picker's `isOpen` is a method, `isOpen()` (FLO-548).** A leftover
  `if (picker.isOpen)` compiles in JavaScript and is always true: `picker.isOpen` is now a
  function. Call it.
- **The time picker's config option `isOpen` is `open` (FLO-548).** TypeScript reports a
  leftover in an object literal. In JavaScript `createTimePicker({ isOpen: true })` is
  ignored: the picker stays closed (measured). `TIMEPICKER_DEFAULTS.IS_OPEN` is
  `TIMEPICKER_DEFAULTS.OPEN`; a leftover reads `undefined`.
- **A snackbar waiting behind another is `"queued"`, not `"visible"` (FLO-548).** Right after
  `show()`, `snackbar.state === "visible"` is true only if nothing else was on screen; it was
  true at once. Use `snackbar.isOpen()`, or listen to `open`, which is emitted together with
  the state turning `"visible"`.
- **A snackbar hidden while it is queued emits no `close` and no `dismiss` (FLO-548).** It
  was never open. It used to emit both, and was then shown anyway at its turn, with
  `state` `"hidden"` and no way to hide it (measured). It now leaves the queue.
- **A docked date picker opened with `open()` from a click outside it stays open.** That
  click used to count as a click outside and closed it in the same task (measured: `open`,
  then `close`). The next click outside closes it.
- **Chip-set `add` and `remove`** factory handlers receive `{ value, chip }` and
  `{ value, chip, chipValue }`, not the chip; `<m-chips>`'s `remove` detail `value` is the
  remaining selection, and the removed id is `chipValue`.
- **The time picker's `input`** carries the committed time in `value` while the picker is open;
  the live draft is `draftValue`. Factory `confirm` listeners and `onConfirm` receive `{ value }`.
  A leftover `onConfirm: (time) => { input.value = time }` stores `"[object Object]"` (measured).
- **Search `onInput` and `onSubmit`** receive the `SearchEvent`. A leftover
  `` onSubmit: (query) => `${query}` `` is `"[object Object]"` (measured); read `event.value`.
- **Search `onClear`** receives the `SearchEvent`. It was declared with no argument and was
  called with the query string, `""` after a clear. A leftover template of the argument is
  `"[object Object]"` and `.length` is `undefined` (measured). The query is `event.value`, `""`
  after a clear.
- **Search `onSuggestionSelect`** receives the `SearchEvent`. `` `${suggestion}` `` was already
  `"[object Object]"`; `suggestion.text` is now `undefined` (measured). The text is
  `event.suggestion.text` (measured `"Apple"`).
- **Search `onExpand` and `onCollapse`, and the navigation rail's `onExpand` and `onCollapse`,**
  were called with no argument, so a template of it was `"undefined"`. Each now receives the
  event's object, and a template of that argument is `"[object Object]"` (measured). The rail's
  object is `{ expanded: true }` or `{ expanded: false }`. Search `expand` and `collapse` emit
  `{ component, state, viewMode }` and are declared as `(event: SearchStateEvent) => void`,
  which is what `on("expand")` accepts; that emitted object is unchanged, so `event.value` and
  `event.preventDefault` are not on it.
- **The button group's `on` map** (`click`, `focus`, `blur`, `change`) was accepted and never
  called. Those handlers now run, with the listener's argument. The type is unchanged, so this
  is not a compile error. The segmented-button note that `on.change` keeps its meaning describes
  this.
- **Options whose argument was already the event's** now run first, before a listener added with
  `on()`: time picker `onChange`, `onInput`, `onOpen`, `onClose` and `onCancel`; navigation rail
  and navigation bar `onSelect`; drawer `onSelect`, `onOpen` and `onClose`; text field
  `onTrailingClick`; the chip set's `onChange`, and a chip's `onRemove` and `onTrailingClick`.
  Time picker `onChange` is also the same `{ value }` object `change` emits,
  not a second one.
- **An empty selection is `null`, not `""`,** in the select and the radios, factory and element:
  the `change` payload's `value`, and the radio factory's `getValue()`. A comparison with `""`
  is never true.
- **The carousel's `change`** carries `value` alone: `event.index` (and `event.detail.index` on
  `<m-carousel>`) is `undefined`. Read `value`.
- **A `withInput` you compose yourself** (`mtrl/core/compose`) works on the checked boolean,
  like the checkbox and the switch: `change.value` and `getValue()` are booleans, and
  a leftover `setValue('x')` checks the input and leaves its string unchanged (`setValue('')`
  unchecks it), with no error. The string is `valueAttribute` in the payload, and
  `getValueAttribute()` / `setValueAttribute()`. No `value` event is emitted.
- **A trailing icon without `trailingIconLabel`** is hidden from screen readers and loses its
  pointer cursor; a click listener you added to it is out of their reach. The label is the
  factory's (`trailingIconLabel`, or `setTrailingIcon(html, label)`); on `<m-textfield>` and in
  the framework components a trailing icon is decorative.
- **The button group's `select(value)`** with a value no button carries clears the selection,
  with a warning in development and no event.
- **`<m-button>`** dispatches `change` for a toggle button.
- **A dialog's `open` listener added after calling `open()`** never runs: `open` is emitted
  inside the call. `dialog.open(); dialog.on('open', build)` opens an empty dialog, with no
  error. Add the listener before `open()`, or listen to `afteropen`.
- **A dialog's `open` listener** runs before the surface is visible and before focus is in it:
  one that measures the dialog or moves focus belongs on `afteropen`.
- **An open dialog answers Escape as soon as `open()` returns,** except the key press that
  opened it. It ignored Escape and the scrim for its first 10 ms.
- **`dialog.close()` on a closed dialog and `dialog.open()` on an open one** emit nothing. Code
  that counted on `close` or `afterclose` from a `close()` called "to be sure" no longer hears
  them.
- **A menu's `close` listener** runs inside `close()`, 50 ms earlier than it did: the menu is
  still in the document and still has its visible class. One that read the DOM expecting the
  menu gone must wait for the fade (350 ms). The same for a select's `close`, a split
  button's `collapse` when the user dismisses its menu, and a FAB menu's `close` in its
  `menu` presentation.
- **A listener for `open` or `close` on `<m-menu>` or `<m-fab-menu>`** no longer hears an
  opening or a closing made by setting or removing the `open` attribute (or the property):
  that is applied at once and dispatches nothing, as on `<m-dialog>`. Code that set the
  attribute and waited for the event waits for ever; read the state on the next line, or call
  `show()` / `hide()`, which dispatch.
- **`fabMenu.isOpen()` right after `open()`** is true in the `menu` presentation too, before
  its surface exists. An `open` listener that reads the menu's surface must wait for it; a
  second click on the FAB before the surface has arrived now closes the menu.
- **`event.preventDefault()` in a menu's or a select's `open` or `close` listener, or in a
  select's `change` listener,** throws a `TypeError` in JavaScript: the payload has no such
  method any more. It never did anything there; remove the call.
- **`menu.close(); menu.open()`** reopens the menu. The `open()` was ignored for the 50 ms
  the close took, so the menu ended closed.
- **`menu.isOpen()` right after `close()`** is false. Code that waited 50 ms for it no
  longer needs to; code that relied on it still being true (two menus open at once for a
  moment, a toggle read just after a dismissal) now sees the closed state.

### Changed (breaking)

- **Typography leaves `mtrl/styles/base` (FLO-539).** The base no longer carries the type
  classes (`.mtrl-display-large` … `.mtrl-label-small`), the text utilities (`.mtrl-text-*`,
  `.mtrl-font-*`, `.mtrl-truncate*`), mtrl's styles for `h1`–`h6` and `p`, or the
  `--mtrl-sys-typescale-*` tokens, except the three the `body` rule reads
  (`--mtrl-sys-typescale-body-medium-font`, `-font-size` and `-line-height`).
  `import 'mtrl/styles/typography'` restores what left. The full stylesheet `mtrl/styles`
  is unchanged. Migration: without the import, a `<div class="mtrl-headline-small">`
  computed `font-size: 14px` (inherited from `body`; `24px` with the import), and
  `font-size: var(--mtrl-sys-typescale-title-large-font-size)` computed the parent's `32px`
  because the property is undefined and the declaration is invalid at computed-value time
  (`22px` with the import). Body text keeps its font (`14px`, `Roboto, sans-serif`).
- **Snackbar, time picker and date picker follow the overlays' one open and close rule
  (FLO-548).** When `open()` or `close()` (the snackbar's `show()` or `hide()`) returns, the
  state getter has changed and the event has been emitted; opening an open one and closing a
  closed one do nothing and emit nothing; `isOpen()` is a method on every overlay.
  - **Snackbar:** `state` is `"queued"` between `show()` and its turn on screen, then
    `"visible"`, with `open` emitted at that moment; it said `"visible"` while waiting. New
    `isOpen()`, true only while visible; `state` stays. `hide()` on a queued snackbar gives up
    its turn and emits nothing. A queued snackbar dropped by a `queueBehavior: 'replace'`
    snackbar or by `clearSnackbars()` is `"hidden"` and can be shown again; it used to stay
    `"visible"` for good, and `show()` on it did nothing. After `destroy()` the state is
    `"hidden"` (it was left as it was), and a queued snackbar that is destroyed is not shown
    at its turn.
  - **Time picker:** the `isOpen` property is the method `isOpen()`, and the config option
    that opens the picker at creation is `open`, not `isOpen` (its default is
    `TIMEPICKER_DEFAULTS.OPEN`, not `IS_OPEN`): one name was a config key and a method on the
    same component.
  - **`<m-snackbar>`:** its `open` property is `false` while the snackbar waits behind
    another, and `true` from its `open` event; it was `true` as soon as `show()` was called.
  - **Date picker:** new `isOpen()`. The click that calls `open()` no longer closes a docked
    picker: the event that opened an overlay never dismisses it.
  - **The tooltip is outside the rule, by design:** `show()` and `hide()` wait for their
    delays (300 and 100 ms unless called with `true`) and emit no event; read `isVisible()`.
- **mtrl is ESM-only (FLO-358).** The CommonJS bundle (`dist/index.cjs`) and the root's `require`
  condition are gone; `main` is the ESM entry. Every subpath was already import-only, and with
  the internals off the root the bundle would have been a partial API. `require('mtrl')` no longer
  resolves (`ERR_PACKAGE_PATH_NOT_EXPORTED`): use `import`, or `await import('mtrl')` from CommonJS.
- **The package root exports the components and the app-level helpers only (FLO-351).** The 137
  internal names 0.10.4 deprecated on the root are gone from it: the composition core (`pipe`,
  `createBase`, the `with*` features), the DOM, timing and store helpers, and the progress
  indicator's canvas code. The root keeps the component factories and their types,
  `configureHTML`, `schemeToTokens` and `THEME_ROLES`, and the global defaults. Each removed name
  is the same export at its subpath; the
  [migration table](https://github.com/floor/mtrl/blob/main/scripts/fixtures/root-exports.md)
  gives every one:

  ```ts
  import { pipe, createBase, withEvents } from 'mtrl';             // 0.10
  import { pipe, createBase, withEvents } from 'mtrl/core/compose'; // 1.0
  ```

  The subpaths are ESM-only, as 1.0.0 is. The root's export list is pinned
  (`bun run root-exports:check`), so a name cannot join it unnoticed.
- **The Vue peer dependency is `>=3.4.20` (FLO-527).** The Vue adapter's declarations
  import `DefineSetupFnComponent`, which `@vue/runtime-core` first declared in 3.4.20.
  On Vue below 3.4.20 a project with `skipLibCheck: false` fails to compile them
  (TS2724); with `skipLibCheck: true` every Vue component is `any`. Migration:
  install Vue 3.4.20 or newer.
- **With `skipLibCheck: false`, use `@types/react` 18.2.71 or later.** Earlier versions import
  `scheduler/tracing`, which the current `@types/scheduler` no longer declares, so they fail to
  compile with `skipLibCheck: false`, with or without mtrl.
- **Only the canonical names (FLO-383).** For every row below but the last two, 0.10.5 exported
  both spellings, the old ones deprecated; 1.0 has only the canonical ones. Every exported identifier writes "text field" as
  two words; string values are unchanged (the `<m-textfield>` tag, the `textfield` element name,
  CSS classes, event strings and the constants' values). The declarations are renamed too, so the
  types read the same in an editor. Svelte's component file is `TextField.svelte`. Migration:

  | 0.10 | 1.0 | Entry |
  |---|---|---|
  | `createTextfield` | `createTextField` | `mtrl` (`mtrl/components/textfield` exports `createTextField` too) |
  | `TextfieldConfig`, `TextfieldComponent` | `TextFieldConfig`, `TextFieldComponent` | `mtrl`, `mtrl/components/textfield` |
  | `TextfieldDensity`, `TextfieldEvents` | `TextFieldDensity`, `TextFieldEvents` | `mtrl/components/textfield` |
  | `TextfieldValuePayload`, `TextfieldFocusPayload`, `TextfieldTrailingPayload` | `TextFieldValuePayload`, `TextFieldFocusPayload`, `TextFieldTrailingPayload` | `mtrl/components/textfield` |
  | `TEXTFIELD_VARIANTS`, `TEXTFIELD_STATES`, `TEXTFIELD_TYPES`, `TEXTFIELD_EVENTS`, `TEXTFIELD_DENSITY`, `TEXTFIELD_DEFAULTS`, `TEXTFIELD_CLASSES` | `TEXT_FIELD_VARIANTS`, `TEXT_FIELD_STATES`, `TEXT_FIELD_TYPES`, `TEXT_FIELD_EVENTS`, `TEXT_FIELD_DENSITY`, `TEXT_FIELD_DEFAULTS`, `TEXT_FIELD_CLASSES` | `mtrl/components/textfield/constants` |
  | `CardSchema` | `CardConfig` | `mtrl`, `mtrl/components/card` |
  | `TopAppBar` (type) | `TopAppBarComponent` | `mtrl`, `mtrl/components/top-app-bar` |
  | `BottomAppBar` (type) | `BottomAppBarComponent` | `mtrl`, `mtrl/components/bottom-app-bar` |
  | `textfieldElement`, `defineTextfield` | `textFieldElement`, `defineTextField` | `mtrl/elements` |
  | `TextfieldSpec`, `TextfieldElement`, `TextfieldElementComponent` | `TextFieldSpec`, `TextFieldElement`, `TextFieldElementComponent` | `mtrl/elements` |
  | `Textfield` (component) | `TextField` | `mtrl/react`, `mtrl/solid`, `mtrl/svelte` |
  | `MTextfield` | `MTextField` | `mtrl/vue` |
  | Sass `$textfield`, `textfield()` (`abstract/variables`) | `$text-field`, `v.text-field()`, the same map (both names in 0.10.5); the built CSS is unchanged |
  | `SELECT_CLASSES.TEXTFIELD` (deprecated in 0.10.5) | `SELECT_CLASSES.TEXT_FIELD`, the same value `"select__textfield"`: no overlap, the key is new in 1.0. A recorded exception to the rule that 0.10.x carries the replacement: a class-name key users rarely type, where an alias on 0.10.x would cost the select's last bytes. |
  | `select.textfield` (deprecated in 0.10.5) | `select.textField` | the select's property: no overlap, `textField` is new in 1.0, and reading `select.textfield` in JavaScript now gives `undefined` rather than an error. The same recorded exception as the row above. |

  Each is a rename of the import; the values and types are the same. The React, Solid and
  Svelte `TopAppBar` and `BottomAppBar` components keep their names: only the factory's types
  were renamed.
- **Time picker, select and radio events agree with their getters (FLO-380).**

  | Event | 0.10 payload | 1.0 payload |
  |---|---|---|
  | Factory time picker `input` | `{ value: draft }` | `{ value: committed, draftValue: draft }` |
  | `<m-timepicker>` `input` detail | `{ value: draft }` | `{ value: committedOrEmpty, draftValue: draft }` |
  | Factory time picker `confirm` | time string | `{ value: time }` |
  | `<m-timepicker>` `confirm` detail | no event | `{ value: time }` |
  | Factory select `change` on empty ID | `{ value: "", ... }` | `{ value: null, ... }` |
  | `<m-select>` `change` on empty ID | `{ value: "" }` | `{ value: null }` |
  | `<m-radios>` `change` on empty ID | `{ value: "" }` | `{ value: null }` |
  | Factory radios `change` on empty ID | `{ value: "", ... }` | `{ value: null, ... }` |
  | Factory radios `getValue()` with nothing selected | `""` | `null` |

  While the time picker is open, `input.value` no longer moves with the dial:
  it is the committed time. Read `draftValue` for live edits. The factory's
  `onInput` callback also receives the new `{ value, draftValue }` object,
  described by the newly exported `TimePickerInputEvent` type. `onConfirm` receives
  `{ value }` as well: see "A config `on*` option is the listener registered at
  creation." `SelectChangeEvent["value"]` is now `string | null`
  for an empty option ID. The radio factory reports `null` too: `getValue()` returns
  `string | null`, and `RadiosChangePayload["value"]` is `string | null`. Handle `null`
  for an empty selection in the select and the radios, factory and element alike. The radio
  factory's `setValue` accepts `null` too, so the getter and the setter round-trip:
  `setValue(null)` clears the selection, silently. `<m-radios>`'s `value = null`, which the
  React, Solid, Vue and Svelte `value` props drive, clears through it; in 0.10 that cleared
  with a development warning (`no option with value ""`).
- **Chip-set `add` and `remove` report the live selection (FLO-380).** Factory
  callbacks receive one object instead of a bare chip:

  | Event | 0.10 payload | 1.0 payload |
  |---|---|---|
  | `add` | `chip` | `{ value: string \| string[] \| null, chip }` |
  | `remove` | `chip` before removal | `{ value: string \| string[] \| null, chip, chipValue: string \| null }` after removal |
  | `<m-chips>` `remove` detail | `{ value: removedId }` | `{ value: remainingSelection, chipValue: removedId }` |

  `value` matches `getValue()` inside the callback, including for selected chips.
  Inside a factory `remove` handler, `event.chip` is already destroyed and out
  of the set. Its getters still answer, but `getChips().indexOf(event.chip)` is
  `-1` and its element is disconnected.
  The element continues to emit one `remove` and no separate `change` for user
  removal; declaration edits remain silent. Migration: read the chip from
  `event.chip` in factory handlers and the removed identifier from
  `event.chipValue` (or `event.detail.chipValue` on the element). Read the
  remaining selection from `event.value` or `event.detail.value`. The exported
  `ChipsAddEvent` and `ChipsRemoveEvent` types describe the new factory payloads.
- **Checkbox and switch `change.value` is boolean (FLO-380).** Factory payloads
  and custom-element details now carry `{ checked, value, valueAttribute, nativeEvent }`;
  `value` matches the checked model, and `valueAttribute` holds the HTML string token.
  Native forms still submit that token only while checked; setters remain silent and
  element/framework bindings remain `checked`-based. A standalone `withInput`
  (`mtrl/core/compose`) emits the same payload (0.10 sent `{ checked, value: <the input's
  string>, nativeEvent }`), and its methods match it: `getValue()` and `setValue()` work on
  the checked boolean, and the input's string is `getValueAttribute()` / `setValueAttribute()`,
  the names the checkbox and the switch use. Both setters are silent: the `value` event
  `setValue(string)` emitted in 0.10 is gone.
  Migration: read checked state from `value` (or `checked`), and replace reads of the
  old string `value` with `valueAttribute`, including `event.detail` in adapters.
- **List event types match native forwarding (FLO-380).** `scroll` carries
  `{ event, element, originalEvent }`; its nonexistent `component` field is removed.
  Migration: use `element` for the event root, or retain your list reference.
- **Toggle buttons, chips and the carousel report `value` with `change` (FLO-380).** Every
  model event carries `value` in the type `getValue()` returns, read at dispatch:

  | Component | `change` payload, 0.10 → 1.0 |
  |---|---|
  | button, icon button (toggle) | `{ selected }` → `{ selected, value: string }` (the button's value) |
  | selectable chips (filter and input) | `{ selected, chip }` → `{ selected, chip, value: string \| null }` |
  | carousel | `{ index }` → `{ value: number }`: `value` is the index, and `index` is gone |

  The custom elements' `event.detail` carries the same fields, and `<m-button>` now dispatches
  `change` for a toggle button. `ButtonChangePayload` and `IconButtonChangePayload` are
  exported. Migration: keep reading `selected` for the toggled state; in a carousel handler
  read `value` where you read `index` (`event.index`, or `event.detail.index` on
  `<m-carousel>`, is now `undefined`); code that builds these payloads (mocks, test doubles)
  adds `value`. In React and
  Solid, `Button` now types its own `onChange` (the element's `change`): code that spreads a
  full `React.HTMLAttributes` (or Solid's `JSX.HTMLAttributes`) into `Button` must omit
  `onChange`.

  The icon button's DOM `toggle` event, deprecated in 0.10.0, is removed (below): `change`
  carries `{ selected, value }`.

- **The chips set's `change` payload is a plain object and has one argument (FLO-530).**
  `chips.on("change", handler)` listeners and the config's `onChange` are passed
  `{ value, selected, changed }`. `value` keeps the set's single or multi value
  shape, `selected` keeps the selected chip values, and `changed` is the toggled
  chip's value. `on("change")` listeners get every change, with `changed: null`
  for one made by a method (`selectByValue(values, true)`); the config's
  `onChange` hears those method changes too. `<m-chips>` still emits
  `change` with `{ value }` detail. Migration:

  ```ts
  // 0.10: the event was an array, and changedValue was a second argument.
  chips.on("change", (selectedValues, changedValue) => {
    use(selectedValues[0], changedValue);
  });
  // 1.0: on("change") and onChange are each passed one object.
  chips.on("change", ({ selected, changed }) => {
    use(selected[0], changed);
  });
  ```

  | Leftover 0.10 handler expression | 1.0 runtime result on the built package |
  |---|---|
  | `event[0]`, `event.length` | Both are `undefined`. |
  | `[...event]` | Throws a `TypeError`. The message is the engine's: in Bun (JavaScriptCore), `Spread syntax requires ...iterable[Symbol.iterator] to be a function`. |
  | `event.includes("a")` | Throws a `TypeError`. In Bun (JavaScriptCore): `event.includes is not a function. (In 'event.includes("a")', 'event.includes' is undefined)`. |
  | Second `changedValue` parameter | `undefined` in both `on("change")` and `onChange`; each handler is passed exactly one argument. |

- **Tabs `on` and `off` take a closed event map (FLO-523).** A group accepts
  `change` (`TabChangeEventData`). A single tab accepts `click` (the button's
  wrapped `{ event, element, originalEvent }` payload), `focus` and `blur`
  (the native `FocusEvent`). `TabsConfig.on` accepts that same `change` handler.
  Migration, what stops compiling:
  - `tab.on("click", (event: MouseEvent) => …)`: the payload is the wrapped
    `{ event, element, originalEvent }`, so read `payload.originalEvent`.
  - `createTabs({ on: { … } })` with a key other than `change`: `TabsConfig.on` no longer has an
    index signature.
  - `tabs.on("custom", …)` for an event name of your own needs a cast.
  - `on` and `off` return the concrete component (`TabsComponent`, `TabComponent`), not `this`.
- **`emit` on the card and the tabs takes the component's own events.** `CardComponent.emit` and
  `TabsComponent.emit` accepted any event name and any data. They now take the names in
  `CardEvents` and `TabsEvents`, each with the payload `on` and `off` declare for it. They are
  the only two public component types that declare `emit`. Migration, what stops compiling:

  ```ts
  card.emit?.('custom', data);                          // 0.10
  tabs.emit?.('change', { value: 'two' });              // 0.10: a partial payload
  tabs.emit?.('change', { tab, value: 'two' });         // 1.0: the event's whole payload
  ```

  - An event name of your own is a type error. At run time nothing changed: the emitter is
    the same, so untyped code that emits `'custom'` still reaches a listener registered for
    it. Keep your own events on an emitter of your own.
  - A component you build with `withEvents` keeps its open `emit(event: string, data)`.
- **Tab and panel ids are derived from the value with a safe encoding (FLO-430).** A value of
  `[A-Za-z0-9_-]` only keeps its ids, `tab-<group>-<value>` and `tabpanel-<group>-<value>`. Any
  other value gets `tabx-<group>-<encoded>` and
  `tabpanelx-<group>-<encoded>`: `_` becomes `__` and every other character `_<hex code
  point>_`, so the ids hold no whitespace (an id reference such as `aria-controls` is a
  space-separated list) and two values never share one. The tab element carries its value as
  `data-value`, and the conventional panel is found from it rather than parsed out of the id.
  `tabIdFor(groupId, value)` and `tabPanelIdFor(groupId, value)` are exported from
  `mtrl/components/tabs`. Migration: values whose ids worked before change too, not only those
  with a space, a newline or a quote: `a.b` → `tabx-g-a_2e_b`, `/home` → `tabx-g-_2f_home`,
  `user:1` → `tabx-g-user_3a_1`, `café` → `tabx-g-caf_e9_`. A page that writes its own panels
  with the conventional id, or labels them with the tab's id, for any value with a character
  outside `[A-Za-z0-9_-]` must build those ids with `tabPanelIdFor` / `tabIdFor`; a hand-written
  `tabpanel-g-a.b` is otherwise never linked.
- Menu items and search suggestions are present synchronously when their factories return,
  including in server-rendered shadow DOM (FLO-367). Migration: DOM inspection no longer needs
  a timer before reading initial items or suggestions. Menu positioning still waits for
  attachment; opening, focus, lazy submenus and suggestion updates keep their existing behavior.
- **Text field: a trailing icon without `trailingIconLabel` is decorative (FLO-301).** It is
  hidden from screen readers (`aria-hidden`) and no longer shows a pointer cursor. An app that
  built a clear or show-password control from that span with its own click listener lost it for
  screen-reader users. Migration: an interactive trailing icon needs `trailingIconLabel` (or
  `setTrailingIcon(html, label)`), which makes it a button and emits `trailing`. The label is a
  factory option: `<m-textfield>` and the React, Vue, Svelte and Solid components have no label
  attribute or prop, so a trailing icon there is decorative.
- **The dialog is open when `open()` returns, and closed when `close()` returns (FLO-548).**
  The rule, for the dialog first and for every overlay by 1.0: when `open()` or `close()`
  returns, `isOpen()` has changed and the event has been emitted (the cancellable `beforeopen`
  or `beforeclose` first). The classes, the paint, the focus trap and the animation may follow.
  A dialog created with `layer: "top"` and `<m-dialog>` already worked this way, and change
  in two points only, marked "both layers" below; this is the factory dialog without `layer`, which emitted `open` and turned
  `isOpen()` true 10 ms after the call. Migration: add every `open` listener before calling
  `open()` (or pass it in the config's `on`), and move to `afteropen` what needs the dialog
  visible or focus inside it.

  ```ts
  // 0.10: the listener was added in time, because `open` came 10 ms later
  dialog.open();
  dialog.on('open', build); // 1.0: never runs, so the dialog opens empty

  // 1.0: add it before the call
  dialog.on('open', build);
  dialog.open();
  ```

  - **`open` is emitted inside `open()`.** A listener added after the call does not hear it:
    add it before, or listen to `afteropen`. It runs before the surface is visible and before
    focus is trapped; `afteropen` is the "visible, and focus is in" event.
  - **`isOpen()` is the dialog's own state,** true on the line after `open()`. It no longer
    reads the `--visible` class, which is still added 10 ms later so the surface has a state to
    animate from.
  - **`afteropen` and `afterclose` are unchanged in timing and are never emitted inside the
    call,** even with `animationDuration: 0`: `afteropen` when the dialog is visible and focus
    is in it, `afterclose` when it is removed. A listener added right after `open()` still
    hears `afteropen`.
  - **Repeat calls do nothing and emit nothing,** in both layers. `close()` on a closed dialog
    emitted `beforeclose`, `close` and `afterclose` each time, and a second `open()` within
    the 10 ms emitted `beforeopen` and `open` again.
  - **The later call wins,** in both layers. `open()` then `close()` at once ends closed and the surface is
    never shown (it was shown 10 ms later, on a dialog that had emitted `close`); `close()`
    then `open()` at once ends open and stays in the document (the pending removal took it
    out). The call that lost emits no `afteropen` or `afterclose`: a dialog closed before its
    `afteropen` was due never emits it, and one opened again before its `afterclose` was due
    emits no `afterclose`. Both used to arrive late, about a dialog in the other state, in
    the top layer as well.
  - **An open dialog can be dismissed as soon as `open()` returns:** Escape and a click on the
    scrim close it from then, not 10 ms later. One exception, the same for every overlay: the
    event that opened it never dismisses it. A dialog opened from an Escape `keydown` handler
    stays open through that key press, and the next Escape closes it. This holds in both
    layers: a `layer: "top"` dialog and `<m-dialog>` opened that way used to close at once,
    on the `cancel` the browser sends for that same key press.
  - **`destroy()` right after `open()`** leaves nothing behind (see Fixed).
- **The menu is closed when `close()` returns (FLO-548).** The same rule as the dialog's, for
  the menu in both layers and for the two components that hold one, the select and the split
  button. `open()` already worked this way; `close()` set the state and emitted `close` on a
  50 ms timer. Migration: move out of a `close` listener anything that needs the menu gone
  from the document (it leaves 350 ms later), and drop `event.preventDefault()` from `open`
  and `close` listeners and from the select's `change` listeners.

  ```ts
  menu.close();
  menu.isOpen(); // 0.10: true for another 50 ms. 1.0: false
  menu.open();   // 0.10: ignored, the menu ended closed. 1.0: it reopens
  ```

  - **`close` is emitted inside `close()`,** and `isOpen()` is false on the next line. The
    listener runs while the menu is still in the document with its visible class: the class
    and `aria-hidden` follow 50 ms later, the removal 300 ms after that, as before.
  - **Repeat calls do nothing and emit nothing.** Two `close()` calls within 50 ms emitted
    `close` twice outside the top layer.
  - **The later call wins.** `close()` then `open()` at once reopens the menu, with one
    `close` and one `open`; `open()` then `close()` at once ends closed and the surface
    is never shown.
  - **One menu at a time, in the call:** opening a menu closes the one that was open before
    its own `open` is emitted. The other's `close` used to come 50 ms after.
  - **An open menu can be dismissed as soon as `open()` returns:** a click outside and
    Escape close it from then, not 20 ms later. The event that opened it never dismisses it:
    a menu opened by code from a click or a key press on another element ignores that click
    or key press, and the next one counts.
  - **Select:** `close()`, Escape and a chosen option set `isOpen()` false, emit `close` and
    set `aria-expanded="false"` in that call or event.
  - **Split button:** when the user dismisses the menu, `isExpanded()` turns false and
    `collapse` and `change` are emitted in that event, not 50 ms later; `collapse()` then
    `expand()` at once ends expanded (the menu ignored the reopening and collapsed the
    button again).
  - **FAB menu, `menu` presentation:** `close()` sets `isOpen()` false and emits `close` in
    the call. Its `open()` is unchanged here.
  - **`MenuEvent` and `SelectEvent`,** the payloads of `open` and `close`, and
    `SelectChangeEvent` lose `preventDefault` and `defaultPrevented`, in the types and on
    the objects passed at run time: nothing read them, and none of these events can be
    cancelled. A leftover call throws; it never did anything. The menu's `select` keeps
    both: preventing it keeps a `closeOnSelect` menu open.
- **The FAB menu is open when `open()` returns, and `open` on `<m-menu>` and
  `<m-fab-menu>` is applied at once (FLO-548).** The last two parts of the overlays' rule.
  Migration: read the state on the line after setting `open` on either element instead of
  waiting for its event, or call `show()` / `hide()`.
  - **FAB menu, `menu` presentation:** `open()` sets `isOpen()` and `aria-expanded` and
    emits `open` in the call. It used to do so after the menu's module had loaded: a
    microtask later once loaded, a network round trip the first time. The surface is shown
    when the module has arrived. `close()` before that ends closed, with one `open` and one
    `close`, and nothing is shown; it used to be ignored, and the menu then opened. If the
    module fails to load, the FAB menu closes again (`close` is emitted). The `list`
    presentation already worked this way.
  - **`<m-menu>` and `<m-fab-menu>`, the `open` attribute and property:** applied inside
    the attribute callback, so the element is open, or closed, on the next line. Applied
    that way it dispatches no `open` and no `close`, as on `<m-dialog>`, the drawer and
    the sheets. It used to be applied a microtask later and to dispatch both. `show()`,
    `hide()`, `toggle()`, the anchor and the user still dispatch one event per opening and
    per closing.
- **A config `on*` option is the listener registered at creation.** It runs with the same
  argument, the same number of times, as a listener passed to `on(event)` at that point, and it
  runs before a listener added afterwards. Whether a method notifies is unchanged (a silent
  `setValue`, `setActive`, `clear()` or button-group `select` stays silent). The bottom app bar's
  `onVisibilityChange` and the top app bar's `onScroll` have no matching event, so they stay
  callbacks and are not in the table. A chip's `onSelect`
  has no matching event either, so it stays a callback. A chip option used to be called beside
  the emit, with its own arguments. A chip set registers `onChange` before a handler supplied
  in `on`, and before a listener added after `createChips`. A chip's `onChange` and `onClick`
  are registered first: a chip's config has no `on` map. A chip in a set emits its own `change`
  on a click, after the set has toggled it, and the item's `onChange` receives that payload
  (`{ selected, chip, value }`). The calls on that click run in this order: the item's
  `onClick`, the set's `onChange`, a set `change` listener added after `createChips`, the
  item's `onSelect`, a chip `click` listener added after the chip was created, the item's
  `onChange`, and a chip `change` listener added after the chip was created. `setSelected`
  and `selectByValue` do not emit the chip's `change`. A single-select click emits it on the
  clicked chip only.

  | Component | Option | Old argument | New argument |
  |---|---|---|---|
  | Time picker | `onConfirm` | the 24-hour string | `{ value }` |
  | Time picker | `onChange` | `{ value }`, a second object from the one `change` emitted | the same `{ value }` object `change` emits |
  | Time picker | `onInput` | the `input` event | the same object |
  | Time picker | `onOpen`, `onClose`, `onCancel` | no argument | no argument |
  | Search | `onInput`, `onSubmit` | the query string | the `SearchEvent` |
  | Search | `onClear` | the query string (declared with no argument; `""` after a clear) | the `SearchEvent` |
  | Search | `onSuggestionSelect` | the suggestion | the `SearchEvent` (`suggestion` holds it) |
  | Search | `onExpand`, `onCollapse` | no argument | the `SearchStateEvent`: `{ component, state, viewMode }` |
  | Navigation rail | `onExpand` | no argument | `{ expanded: true }` |
  | Navigation rail | `onCollapse` | no argument | `{ expanded: false }` |
  | Navigation rail, navigation bar | `onSelect` | the select event | the same object |
  | Drawer | `onSelect` | the select event | the same object |
  | Drawer | `onOpen`, `onClose` | no argument | no argument |
  | Text field | `onTrailingClick` | the trailing payload | the same object |
  | Button group | `on.click`, `on.focus`, `on.blur`, `on.change` | accepted, never called | the listener's argument |
  | Chips | `onChange` | `{ value, selected, changed }`, and only for a user's change | The same object as `on("change")`. The set's `onChange` now hears `selectByValue(values, true)`, with `changed: null`. `selectByValue(values)` and `clearSelection()` stay silent. |
  | Chip | `onChange` (a chip alone) | `(selected, chip)` | `{ selected, chip, value }`, the `change` payload |
  | Chip | `onChange` (a chip in a set) | `(selected, chip)`, and the chip did not emit `change` | `{ selected, chip, value }`, the chip's `change` payload. A click emits that `change`. `setSelected` and `selectByValue` do not. |
  | Chip | `onClick` | the chip | `{ event, originalEvent, element }`, the `click` payload |
  | Chip | `onRemove` | the chip | the chip |
  | Chip | `onTrailingClick` | the chip | the chip |
  | Chip | `onSelect` | the chip | the chip. No matching event. |

  ```ts
  createTimePicker({ onConfirm: (time) => { input.value = time; } });          // 0.10
  createTimePicker({ onConfirm: ({ value }) => { input.value = value; } });    // 1.0
  createSearch({                                                                // 0.10
    onSubmit: (query) => console.log(query),
    onSuggestionSelect: (suggestion) => console.log(suggestion.text),
  });
  createSearch({                                                                // 1.0
    onSubmit: (event) => console.log(event.value),
    onSuggestionSelect: (event) => console.log(event.suggestion?.text),
  });
  ```

  A listener added with `on()` used to run before the option, which was called after `emit`.
  The option is now first. `component.off(event, theSameFunction)` removes it: the option is
  that function, not a wrapper. A navigation rail or bar listener that destroys the component
  during `select`, or the rail during `expand`, used to skip the option. The option now runs
  first, so it is called; listeners already taken for that `emit` still run.

  In JavaScript, a leftover template of an argument that is now an object is `"[object Object]"`
  (measured), including assigning the time picker's `onConfirm` argument to an input's `value`.
  Search `onClear`'s `.length` is `undefined`; the query is `event.value`. Search
  `suggestion.text` is `undefined`; the text is `event.suggestion.text`. The navigation rail's
  expand and collapse templates were `"undefined"` when the option was called with no argument.

  A leftover chip `onChange(selected, chip)` receives one object, measured on a filter chip
  valued `"old"`:

  | Call | `arguments.length` | First parameter | Second parameter |
  |---|---|---|---|
  | Selecting | 1 | `{ selected: true, chip, value: "old" }` | `undefined` |
  | Deselecting | 1 | `{ selected: false, chip, value: "old" }` | `undefined` |

  A leftover `onChange(selected, chip)` on a chip in a set gets the same object, measured
  on a filter chip valued `"old"`: selecting passes `{ selected: true, chip, value: "old" }`
  and deselecting passes `{ selected: false, chip, value: "old" }`, `arguments.length` is 1,
  and the second parameter is `undefined`.

  The object is always truthy, so a leftover `if (selected)` stays true when the chip is
  deselected. The boolean is `selected.selected`. A leftover `onClick(chip)` receives one
  argument, `{ event, originalEvent, element }`, where `element` is the chip's root; it is
  not the chip component (`focus` is `undefined`), and a second parameter is `undefined`.
  `onRemove` and `onTrailingClick` still receive the chip. `chips.off("change", onChange)`
  removes the set's option. A handler that calls `selectByValue(x, true)` for one fixed
  value runs twice — the change that was not that value, then the move onto it — and then
  stops, because `selectByValue` emits only when the selection changed.

### Removed

- **`select.menu` and `splitButton.menu` (FLO-543).** The menu inside a select or a split button
  is no longer a member of either: a public handle on an inner component is what would stop the
  menu from being loaded on demand later. Both were marked `@deprecated` in 0.10.6. A leftover
  `.menu` is a compile error in TypeScript; in JavaScript it reads `undefined` (measured), so a
  call through it throws a `TypeError`. Use the component's own methods and events (the
  migration table lists them). Changing a split button's items after creation, which only
  `splitButton.menu.setItems()` did, is `splitButton.setItems()`. The select has no public way
  to change its `placement` after creation; `<m-select>`'s `placement` attribute still does.
- **The options 0.10 deprecated are removed**, first those it promised to remove in 1.0. Migration:

  | 0.10 | 1.0 |
  |---|---|
  | `createElement({ rawClass })` (`mtrl/core/dom`) | `class` or `className`, unprefixed since 0.10 (FLO-117). `rawClass` was applied on 0.10.x. In 1.0 `createElement` applies no class for it and, as for any option it does not know, writes it out as an attribute: `<div rawclass="legacy-a legacy-b">` (an array becomes `rawclass="a,b"`). The seven component configs that typed it (those extending `BaseComponentConfig`) never applied it, and a leftover there still does nothing, so for them only the type changes. |
  | a dialog button's `color` | nothing: it had no effect; M3's dialog actions are text buttons in the dialog's colours (FLO-324) |
  | the tooltip's `rich` option | `variant: 'rich'`; `rich` was never read (FLO-324) |
  | `TOOLTIP_DEFAULTS.RICH` (deprecated in 0.10.5) | nothing: it was the default of the removed `rich` option |
  | checkbox `variant`, and its type `CheckboxVariant` (deprecated in 0.10.5) | nothing: M3 has one checkbox style (FLO-94, FLO-265) |
  | list `prefix` | nothing: the prefix is fixed at build time (FLO-118) |
  | radios `rippleConfig` | nothing: never applied; the stylesheet draws the state layer (FLO-266) |
  | tabs `ResponsiveConfig.smallScreen.maxVisibleTabs` | nothing: it never had an effect; for more than four tabs, use a scrollable row (FLO-232) |
  | time picker `closeOnSelect`, `TIMEPICKER_DEFAULTS.CLOSE_ON_SELECT` | nothing: never applied; the picker is confirmed with OK, as M3 specifies (FLO-281) |
  | `SLIDER_MEASUREMENTS.TRACK_RADIUS`, `SMALL_TRACK_EXTERNAL_RADIUS`, `LARGE_TRACK_RADIUS_RATIO`, `HANDLE_GAP_PRESSED_REDUCTION`, `CENTER_GAP`, `EDGE_PADDING` | nothing: not read since FLO-250; the stylesheet and `getExternalTrackRadius` give the geometry |
  | `TABS_DEFAULTS.INDICATOR_HEIGHT`, `INDICATOR_ANIMATION_DURATION`, `INDICATOR_ANIMATION_TIMING`, `ICON_SIZE` | `indicator.height` and `indicator.animationDuration` to override; nothing read these (FLO-262) |
  | `TEXT_FIELD_CLASSES.LABEL_FLOATING` | nothing: a floating label is the field's `--populated` or `--focused` state (FLO-295) |
  | `TIMEPICKER_SELECTORS.MODAL`, `DIAL_CANVAS`, `DIAL_HAND` | nothing: they matched no element (the dialog's `::backdrop`, the DOM dial, `__dial-track` and `__dial-handle`; FLO-278, FLO-279) |
  | FAB and extended FAB `variant: 'surface'`, `FAB_VARIANTS.SURFACE`, `EXTENDED_FAB_VARIANTS.SURFACE` (deprecated since 0.8) | a container or tone style (`'primary-container'`, `'primary'`, …). The `--surface` CSS is removed, so a leftover `'surface'` renders as the default `primary-container`. |
  | FAB `size: 'small'`, `FAB_SIZES.SMALL` (deprecated since 0.8); `FAB_CLASSES.SMALL`, `FAB_ICON_SIZES.SMALL` (deprecated in 0.10.5) | `'default'`, `'medium'` or `'large'`: M3 Expressive has no small FAB. The `--small` CSS is removed, so a leftover `'small'` renders at the default 56dp. The extended FAB's `small` size stays. |
  | a chip's `text` (`ChipConfig`, including a chip set's items) | `label`. A leftover `{ text }` now renders an empty chip, silently: no label and no error or warning. Search your chip configs and chip set items for `text:`. |
  | tabs `indicatorHeight`, `indicatorWidthStrategy` | `indicator.height`, `indicator.widthStrategy` (since 0.3.2). A leftover is ignored: the indicator falls back to its variant's height (3px on a primary row, 2px on a secondary one) and automatic width. |
  | shape names `'cookie4'`, `'cookie9'` (`materialShape`, the shapes) | `'cookie4Sided'`, `'cookie9Sided'`, Compose's names (since 0.10.2). `materialShape('cookie4')` now throws (`TypeError: byName[name] is not a function`). |
  | `rippleConfig.timing` and `rippleConfig.opacity` (button, icon button, FAB, extended FAB, button group, radios, tabs, and the core `RippleConfig`); their defaults `DEFAULT_RIPPLE_CONFIG.TIMING`, `.OPACITY` (button, icon button) and `BUTTON_GROUP_DEFAULTS.RIPPLE_TIMING`, `.RIPPLE_OPACITY` (deprecated in 0.10.5) | nothing: never applied; the stylesheet draws the wave's motion and opacity (FLO-260, FLO-268). `duration` stays. The core's `RIPPLE_CONFIG.timing`, `.opacity`, `RIPPLE_TIMING` and `RIPPLE_SCHEMA`, on no public entry, go with them. |

- **1.0 exports nothing deprecated.** What 0.10.0 deprecated and 0.10.x already replaced (or
  never used) is removed, and so is what was kept only for compatibility: 1.0 has no deprecated
  export, member or event. Migration:

  | 0.10 | 1.0 |
  |---|---|
  | `CHECKBOX_VARIANTS` (`mtrl/components/checkbox`, `/constants`) | nothing: M3 has one checkbox style, and `variant` had no effect (FLO-94, FLO-265) |
  | `RADIO_VARIANTS`, `RADIO_LABEL_POSITIONS`, `RADIO_SIZES`, `RADIO_CLASSES` (`mtrl/components/radios`, `/constants`) | nothing: no component read them (FLO-266) |
  | `RADIO_DEFAULTS.VARIANT`, `.LABEL_POSITION`, `.SIZE` (deprecated in 0.10.6) | nothing: the radios have no such options, and nothing read the keys. `RADIO_DEFAULTS.DIRECTION` stays. In JavaScript a removed key reads `undefined`. |
  | the icon button's DOM `toggle` event, from the factory's button and from `<m-icon-button>` (deprecated in 0.10.0, FLO-295) | `change`, which carries `{ selected, value }`. A leftover `toggle` listener never fires, with no error. In the React, Vue, Svelte and Solid components the icon button refuses `onToggle` (Svelte: `ontoggle`), and the compiler's error says what to do: `Type '() => void' is not assignable to type '"onToggle was removed in 1.0: use onChange"'`. Without that guard the name would fall through to the host's native `toggle` handler, compile, and never fire. |
  | `TIMEPICKER_DIAL`, `TIMEPICKER_Z_INDEX` (`mtrl/components/timepicker`, `/constants`) | nothing: the dial is sized in CSS and the picker is a modal `<dialog>` in the top layer (FLO-278, FLO-279, FLO-281) |
  | `TIMEPICKER_CLASSES` | `TIMEPICKER_SELECTORS` (public since 0.9.0), which is not a like-for-like swap: its values are prefixed selectors (`".mtrl-time-picker__dial"`) where the old were bare class names (`"time-picker__dial"`), and 13 of the 33 old keys have no selector of the same name (`ROOT`, `OPEN`, the six `DIALOG_*`, `DIAL_NUMBER_ACTIVE`, `PERIOD_ACTIVE`, `TOGGLE_TYPE`, `CANCEL`, `CONFIRM`) |
  | `getThemeColor('sys-color-X-rgb')` (`mtrl/core/utils`): the `'r, g, b'` triplet, derived | `getThemeColor('sys-color-X', { alpha })`. The `-rgb` name now returns `''` (or the `fallback`), as any undeclared variable does, so `rgba(${getThemeColor('sys-color-primary-rgb')}, 0.12)` now yields `rgba(, 0.12)`, an invalid colour that CSS and canvas drop silently: a missing colour, not an error. Use `getThemeColor('sys-color-primary', { alpha: 0.12 })`. A theme that declares its own `-rgb` properties is unaffected (FLO-311). |

- **Component subpaths export the component only, and are listed one by one (FLO-381).** The
  internals 0.10.5 deprecated on `mtrl/components/<name>` are gone, with no replacement: card's
  `withAPI`, `withLoading`, `withExpandable`, `withSwipeable`, `withElevation` (a no-op: the
  variant sets the elevation, FLO-323) and the `*Feature` types; tabs' `with*` features, `addScrollIndicators`, `createTabsState`,
  `createTabIndicator`, `updateTabPanels`, `setupKeyboardNavigation` and their config and
  component types; switch's `withSupportingText` and `SupportingTextComponent`. Datepicker's
  `DEFAULT_DATE_FORMAT` leaves the component's index but stays public in its constants:
  `import { DEFAULT_DATE_FORMAT } from 'mtrl/components/datepicker/constants'`. `ChipConfig`
  loses `managedSelection` and `cell`, which only the chip set sets. `CardComponent`'s `loading`,
  `expandable` and `swipeable` members are removed; `createCard` never set them. Tabs'
  `ResponsiveConfig` and `TabIndicator` and datepicker's `CalendarAPI`, which public members are
  typed with, are now exported. The manifest's `./components/*` and `./components/*/constants`
  patterns become one entry per component (and per component with constants), so the folders
  inside a component no longer resolve. Each component's export list is pinned
  (`bun run component-exports:check`).
  Migration: these subpaths now throw `ERR_PACKAGE_PATH_NOT_EXPORTED`. They held internals, with
  no replacement; a single chip is `createAssistChip` and the other factories in
  `mtrl/components/chips`, and `CHIP_CLASSES`/`CHIP_STATES` are internal class and state names:
  `mtrl/components/bottom-sheet/features`, `carousel/features`, `chips/chip`,
  `chips/chip/constants`, `chips/features`, `drawer/features`, `list/features`, `menu/features`,
  `progress/features`, `search/features` (the low-level `withInput`), `side-sheet/features`,
  `slider/features`, `textfield/features`. Every other `mtrl/components/<name>` and
  `mtrl/components/<name>/constants` that existed in 0.10 still resolves, except
  `segmented-button` and `segmented-button/constants`, removed with segmented buttons (FLO-382,
  above).
- **Segmented buttons are removed (FLO-382).** `createSegmentedButton` and `createSegment`
  (deprecated since 0.8.0), their types, `mtrl/components/segmented-button`,
  `mtrl/styles/segmented-button` and the `--mtrl-segmented-button-*` properties are gone. M3
  replaced the segmented button with the connected button group. Migrate:

  ```ts
  createSegmentedButton({ mode: 'multi', density: 'compact',            // 0.10
    segments: [{ text: 'Day', value: 'day', checkmarkIcon }] });
  createButtonGroup({ kind: 'connected', selection: 'multi', density: 'compact', // 1.0
    buttons: [{ text: 'Day', value: 'day', selectedIcon: checkmarkIcon }] });
  ```

  - `mode` is `selection` (`single`, `multi`, or `none` for plain actions); `segments` are
    `buttons`; `checkmarkIcon` is `selectedIcon`. `density`, `disabled`, `ripple`,
    `rippleConfig` and `on.change` keep their meaning.
  - `enableSegment(value)` / `disableSegment(value)` become `enableButton(index)` /
    `disableButton(index)`, or `getButtonById(id)` for one button.
  - The `change` event carries the selection; it has no `oldValue`, so keep the previous value
    if you need it.
  - The button group's `select(value)` now clears the selection when no button carries `value`,
    with a warning in development and no event, as the segmented button and the other selection
    components do (FLO-328).
    On a `required` group, which cannot be emptied, it warns and leaves the selection as it was.
- **The deprecated themes `material`, `winter`, `browngreen` and `legacy` are removed
  (FLO-428).** 0.10 deprecated them (FLO-308); their files, `mtrl/themes/<name>` entries and
  their rules in the full stylesheet are gone. A leftover `data-theme="winter"` (or any of the
  four) on the root element gets the baseline colours in the OS's colour scheme, and
  `data-theme-mode` and `data-theme-contrast` on that element are ignored: an app with its own
  dark toggle follows the OS until it renames the theme. The OS contrast preference
  (`prefers-contrast: more`) is not applied there either, so a user who asked for more contrast
  gets standard contrast. On a nested element a removed name matches no rule, so that element
  keeps its ancestor's colours. Migration: `material` → `baseline`,
  `winter` → `ocean`, `browngreen` → `brownbeige`; `legacy` has no replacement (pick any theme,
  or keep its colours as custom properties of your own).
- **The shape scale is M3's and nothing else (FLO-345).** The mtrl-only steps `extra-tiny` (1px),
  `tiny` (2px) and `pill` (100px) are removed from `$shape`, with their
  `--mtrl-sys-shape-corner-*` properties on `:root`. `v.shape('tiny')` and the rest now stop the
  build with an error naming the migration (as does any step not on the scale). Migrate:
  - `extra-tiny` and `tiny`: write the radius as a literal (`1px`, `2px`).
  - `pill`: use `full`, or half the component's height when its corners animate (a 9999px
    radius snaps when animated).
  - A theme setting `--mtrl-sys-shape-corner-pill` can drop it; nothing reads it.
- **`$mtrl-sys-shape` is removed from `abstract/theme` (FLO-345).** Nothing read it. Use
  `v.shape(<step>)`.

### Added

- **`isOpen()` on the snackbar and the date picker (FLO-548)**, as on every other overlay.
- **Split button `setItems(items)` and `getItems()` (FLO-543).** `setItems` replaces the menu's
  items and returns the split button; `getItems` returns them. A split button created without
  `items` has no menu and `getItems` returns `[]`: the first non-empty `setItems` creates the
  menu, which then works as one created with items (and opens at once if the split button is
  expanded). `setItems([])` empties the menu and keeps it. After `destroy()` it does nothing.
- **The navigation bar (FLO-305).** `createNavigationBar` and `<m-navigation-bar>` (with
  `<m-navigation-bar-item>`), and the React, Vue, Svelte and Solid components: M3 Expressive's bar
  for compact and medium windows, three to five destinations, from Compose's `ShortNavigationBar`.
  - **Geometry and colour:** 64dp on surface container; a 56×32 indicator on secondary container,
    the active icon on it, the active label in secondary.
  - **`itemLayout`:** `'auto'` puts the icon above the label, and beside it in a 40dp pill with the
    items centred once the bar itself is 600px wide (a container query, so a bar in a narrow pane
    stays vertical). `'vertical'` and `'horizontal'` fix it.
  - **Destinations:** links (`href`) or buttons, badges (a count or the dot) folded into the
    accessible name, `aria-current="page"` on the active one, in a named `nav` landmark. Every
    destination is a tab stop and the arrow keys move along the bar, as in the navigation rail,
    whose destination code the bar now shares.
  - **`hideOnScroll`:** off by default; it slides the bar away while the page scrolls down,
    without the slide under reduced motion, and focus inside always brings it back.
- **Every public `variant` option's type is exported from `mtrl` and from its component's
  subpath.** New on both: `TextFieldVariant`, `SelectVariant`, `MenuVariant`, `ProgressVariant`,
  `TabsVariant`, `TooltipVariant`. New on `mtrl` (already on the subpath): `BadgeVariant`,
  `CardVariant`, `CarouselVariant`, `DatePickerVariant`, `ExtendedFabVariant`, `FabVariant`,
  `IconButtonVariant`, `SearchVariant`, `SplitButtonVariant`, `ToolbarVariant`.
- **Framework components accept the host element's HTML attributes (FLO-519).**
  React, Vue, Svelte and Solid props take that framework's `HTMLAttributes` as well
  as the component's own props. Where a name is both, the component's type wins, so
  a switch's `checked` stays a boolean and a button's `type` stays a string. The same
  rule covers events. A component's `change`, `input` or `select` handler stays
  the element's `CustomEvent`, including in Vue, where those handlers come from emits and
  would otherwise be intersected with the host's `onChange` / `onInput` / `onSelect`. A global a supported release leaves off that interface is accepted too
  (`popover` on React 18 through 18.3.31 and on Vue through 3.5, `enterKeyHint` on React 18
  before 18.3.31, `nonce` on React 18.0.0, Vue and Svelte);
  a release that already declares the key keeps its own type. Vue spells `inputmode`
  and `itemprop`, and Solid and Svelte spell `enterkeyhint`.
- Search listener types on `mtrl/components/search`, beside `SearchEvent`: `SearchEvents`
  (each event's listener, so `SearchEvents["expand"]` types a handler) and `SearchStateEvent`
  (what `expand` and `collapse` carry). `mtrl/elements` adds `SearchElementEvents`, the same
  map with `<m-search>`'s names (`change`, `select`, `open`, `close`).
- Read-only `getValue()` aliases on carousel, tabs, drawer, navigation rail and
  button group (FLO-380); existing accessors remain. Button toggle `change`, card
  `expandedChanged`, list `keydown`, and interactive touch events now have their
  actual payload types, including both slider touch delivery shapes.
- `mtrl/ssr`: `renderElement` renders elements as declarative shadow DOM on Node or Bun; server-only, with no runtime dependencies (FLO-363, FLO-364). `<m-toolbar>` renders a declarative shadow root like the other elements (FLO-387). Before upgrade, each toolbar item is its own tab stop; after upgrade, the toolbar is one. Carousel and FAB menu stay opted out. It inlines the CSS by default, or links the stylesheets in the same order as the browser and the inline styles (without adding build-manifest dependencies), renders nested elements, and applies the shared HTML policy; each call defines only the host tags it meets, including nested authored and factory-generated elements, instead of recreating all 36 classes. Asynchronous FAB-menu and submenu configurations use the host-only fallback (FLO-370). The identity HTML policy is not a sanitizer; configure a synchronous sanitizer for untrusted markup. The React, Svelte, Solid and Vue bridges render a host that carries ordinary HTML attributes (`popover`, `inputmode`, `enterkeyhint`, `itemprop`, `nonce`, `is`, and the rest of the host's HTML attributes): the framework emits those attributes on the host, and the shared renderer skips names outside its allowlist, including event-handler names and `srcdoc`, so they never enter the shadow markup. Calling `renderElement` directly rejects an unknown host attribute (FLO-418). Underneath are an internal detached element lifecycle, style registry seams, and a synchronous server DOM scope with inert scheduling and complete resource teardown. Worker and edge runtimes are unsupported in 1.0. A resolver that tries `workerd` or `worker` before `browser` (Cloudflare Workers) loads the browser stub: `renderElement` throws "mtrl/ssr is server-only", and importing `mtrl/ssr/react`, `mtrl/ssr/vue`, `mtrl/ssr/svelte` or `mtrl/ssr/solid` does nothing, so the page has no declarative roots and no error.
- `mtrl/ssr/react`: an opt-in, server-only entry. Imported in the server bootstrap, it makes the React adapters emit styled declarative shadow roots during SSR (React 18 and 19), with no server code in the client bundle. Without it, React output is unchanged (FLO-372). A `Suspense` boundary inside a component contributes its fallback to the server-rendered shadow root: a button has no label slot with an empty fallback but has one with a text fallback; a boundary around a tab leaves the root without that tab with either fallback. Put the boundary outside the component when the server root needs resolved content. A child that suspends stays on the server: the static pass retries the host only when that render suspended, and the shadow root is built from the children once they can render (FLO-415). A child that throws is not retried: the page render reaches it, so the error is reported as it is without the bridge. When that separate render throws something other than a suspension, development logs one warning per host in the response, naming the element and the error; production logs nothing. Retries wait on a backoff (doubling to 250ms) and stop after 40 attempts, about eight seconds; past that the host has no shadow root and the page keeps streaming, so a slower child still arrives. The suspension is recognised from the throw site of whichever React build this process loaded, not from the error text, so a production build that minifies the message still retries. At the cap, development logs one warning naming the element; production logs nothing. When no stack frame can be read, development logs one warning that suspending children render without a server shadow root; production logs nothing. The server-rendered shadow root is built in a separate render, without the context of providers above the component. The page's own render (the light DOM) sees the provided value. Until upgrade, a child reading context with a default shows that default in the painted shadow root; a child requiring its context leaves this component without a declarative shadow root while the page still renders. Pass the resolved string as a prop or attribute, or accept client-rendered text until upgrade. A fix is planned for 1.1 (FLO-517). The Vue and Solid bridges see the provided value in both the shadow root and light DOM.
- `mtrl/ssr/svelte`: an opt-in, server-only entry. Imported in the server bootstrap, it makes every generated Svelte component emit a styled declarative shadow root during SSR, on the same `Symbol.for("mtrl.ssr")` bridge as React, with no server code in the client bundle. Carousel and FAB menu emit no template. Without the import, Svelte output gains only the empty branch marker (FLO-375). Like React, its shadow root is built in a separate render without provider context; the page's light DOM sees the provided value. A child reading context with a default shows that default in the painted shadow root until upgrade. A child requiring context leaves that component without a declarative shadow root while the page still renders: the host falls back to light DOM, then upgrades normally in the browser. Development logs once per affected host in each response, naming the element and including the child render error; production logs nothing (FLO-525).
- `mtrl/ssr/vue`: an opt-in, server-only entry. Imported in the server bootstrap, it makes every generated Vue component emit a styled declarative shadow root during SSR, on the same `Symbol.for("mtrl.ssr")` bridge as React, with no server code in the client bundle. Carousel and FAB menu emit no template. Without the import, Vue output is unchanged (FLO-373). A host's child may use `async setup()` under `Suspense`, including data created outside that child and `renderToWebStream`: the shadow bridge serializes those children once. A host whose `v-html` contains an unclosed `<template>` renders, and `mtrl/ssr/vue` imports the server renderer from `vue/server-renderer`.
- `mtrl/ssr/solid`: an opt-in, server-only entry. Imported in the server bootstrap, it makes every generated Solid component emit a styled declarative shadow root during SSR, on the same `Symbol.for("mtrl.ssr")` bridge as React, with no server code in the client bundle. Carousel and FAB menu emit no template. Without the import, Solid output is unchanged (FLO-374). Async and streaming SSR finish when a component inside a host creates a resource under an outer `Suspense`: the shadow bridge reuses the page's serialized children, preserving its resource ownership and hydration keys without rendering children twice.
- Per-element SSR opt-out (FLO-370): specs accept `ssr: false` or a synchronous host
  predicate. Carousel and FAB menu emit their host and light DOM without a
  declarative root; menu and split-button do the same for nested submenus. `<m-toolbar>`
  renders a declarative shadow root (FLO-387). Async
  button/card global defaults conservatively use this fallback for the whole render.
  Eligible light-DOM descendants still render their own roots. Pre-upgrade CSS keeps
  the host's box until browser upgrade, and these paths no longer throw. React SSR
  honors the same opt-out without emitting an empty declarative template.
- Element CSS also ships as `.css` files (`mtrl/elements/css/<name>.css`, `hosts/<element>.css`), for server-rendered `<link>` styles (FLO-365).
- `ssr:check` (CI): server-rendered elements are checked in Chromium, Firefox and WebKit, for a styled first paint without JavaScript, pixel stability and no layout movement on upgrade, and the security reparse; markup parity stays in Chromium (FLO-371). Chromium security and per-node parity checks cover all 36 element defaults (FLO-363).
- `ssr:check` and `svelte-ssr:check` cover two more cases (FLO-412): a toolbar's server-rendered
  icon buttons are measured across the upgrade (pixels, layout, and each button keeping its
  parser-created root), and Svelte named snippets (card `headline` and `actions`, top app bar
  `leading` and `trailing`) are checked as slotted before script and adopted by hydration.

### Changed

- **SSR docs: what the two style modes cost (FLO-554).** Inline styles stay the default. The
  README's server-rendering section and `RenderOptions`' TSDoc now say what inline costs (gzip
  cannot see a repeat further back than its 32 KB window, so serve brotli or use link mode
  for pages with many selects, or that mix large roots (text fields, dialogs) in turn; and
  the HTML is 0.5 to 0.9 MB uncompressed for 30 to 44 roots) and link mode's caveat (WebKit paints the roots unstyled until the
  stylesheets arrive). No code changes.
- **What `open()` has done when it returns is documented and pinned by tests (FLO-543).** The
  surface may be painted after `open()` returns; the state is not deferred. On return: a
  select's `isOpen()` is true, its input has `aria-expanded="true"` and `open` has been emitted;
  a split button's `expand()` has set `isExpanded()` and emitted `expand` and `change`; a time
  picker's `isOpen` is true and `open` has been emitted; a date picker has emitted `open`; a
  dialog has run `beforeopen`, and with `layer: "top"` it is open and has emitted `open`. None
  of this changed in 1.0. The first ArrowDown, ArrowUp, Enter, Space, Home, End or typed character on a closed
  select opens it and is not lost.
- **SSR docs (FLO-419).** The README names every attribute whose value is markup, including `avatar` and `leading-avatar`, which are not a person's name or an image URL; `FabMenuConfig.closeIcon` is markup too. The React and Svelte bridges build the server-rendered shadow root without the context of providers above the component (FLO-517).
- CI's Solid and Vue SSR runs on the lowest supported peer version are ordinary commands,
  `solid-ssr:floor` and `vue-ssr:floor` (FLO-426). Each reads the floor from `peerDependencies`,
  installs it without saving, runs the check and restores the installed version, so nothing after
  it runs on the floor version unnoticed.
- **CI runs the same checks in less time.** The browser checks run in five groups instead of
  three, the package checks no longer hold the browser groups back, and Playwright's browsers
  and their system packages come from a cache that every pull request can read (a slow Ubuntu
  mirror made one install step take 26 minutes). `test/build/ci-commands.test.ts` lists the
  commands CI runs and fails when one is dropped.

### Fixed

- **A dialog destroyed right after `open()` no longer locks the page's scroll (FLO-548).** The
  default-layer dialog shows its surface 10 ms after `open()`. `destroy()` in that window left
  the timer running: it then set `overflow: hidden` on the body for a dialog that was gone,
  with nothing left to undo it. `destroy()` now cancels what `open()` and
  `close()` left pending, and removes the dialog's document listeners.
- **Snackbar: a queued snackbar dropped from the queue can be shown again (FLO-548).** One
  waiting behind another and then dropped by a `queueBehavior: 'replace'` snackbar or by
  `clearSnackbars()` kept `state` `"visible"` without ever being shown, and `show()` on it
  did nothing from then on. It is now hidden when dropped. The defect is also in 0.10.x; the
  fix is in 1.0.
- **Date picker: `open()` called from a click outside a docked picker opens it (FLO-548).**
  The same click then reached the picker's outside-click listener and closed it at once. A
  click in the task that called `open()` no longer closes it. The defect is also in 0.10.x;
  the fix is in 1.0.
- **Snackbar: destroying the one on screen lets the next take its turn (FLO-548).**
  `destroy()` on the visible snackbar left the queue waiting for it, so snackbars shown behind
  it stayed queued until some other snackbar was shown. The queue now moves on, after its
  usual gap.
- **Accessibility: scrolling from script honours reduced motion in the chips, the tabs and the
  search (FLO-553).** The chip set's `scrollToChip`, the tabs' scroll buttons and the search's
  arrow keys through the suggestions each asked for a smooth scroll explicitly, which overrides
  the stylesheet, so they glided with the reduced-motion preference on. They now name no
  behaviour: each scroller scrolls smoothly from its stylesheet (`scroll-behavior: smooth`,
  new on the tabs' scroller and the suggestion list), and jumps at once under reduced motion.
  A script of yours that scrolls the tabs' scroller or the suggestion list now scrolls it
  smoothly too.
- **Tooltip placement (FLO-535):** With motion enabled, a tooltip could settle 5% of its width off
  centre while animating in and be squeezed at the viewport edge. Placement now uses its full
  layout size; reduced-motion placement is unchanged.
- **A chip destroyed on its own leaves its chip set (FLO-533).** Calling `destroy()` on a chip, rather than removing it through the set, used to leave that chip in the set. The set could then count it as selected beside another chip, including two selected chips in a single-select set, and the arrow keys stopped on it. The set now drops that chip. Dropping it does not emit `remove` or `change`. Removing a chip through the set is unchanged.
- Checkboxes keep their check icon, and pre-upgrade element styles appear, when one process uses multiple documents (FLO-528).
- A multiline text field reserves its textarea box before it upgrades, so the field and the line beside it no longer jump when the element is defined (FLO-425).
- **Single-select chip sets keep one selected chip (FLO-518).** Adding a chip
  with `selected: true` selects it and deselects the previous chip, including
  initial factory config and `<m-chip selected>` declarations. The last selected
  chip wins; `add.value` reports the resulting selection. Programmatic additions
  emit `add` and no `change`. Selecting a chip through its `setSelected(true)`
  also replaces the previous selection silently. A chip the set has removed or
  destroyed no longer clears that selection: destroying the chip drops the set's
  hook. The public chip factories ignore a caller-supplied `onSelected`.
- **Progress indicators size their canvas when they are created (FLO-368).** A linear canvas is as tall as its track (4dp, 8dp thick, 10dp wavy at the default thickness) and fills its container; a circular one is its token size (40dp, 48dp wavy, or the configured size from 24dp to 240dp). The size comes from those tokens, not from measuring the element, so the canvas no longer reserves the default 300×150 until it upgrades.
- **Sliders, tabs and loading indicators take their first position from configuration (FLO-369).** A slider's track, stops and inset icon are a percentage of the value, so they no longer wait on a measurement that is 0 before layout. A tab's indicator anchors to the active label, or to the tab itself when it is secondary. A loading indicator's canvas is its token size (48dp, or the configured size) when it is created.
- Element upgrade removes leftover direct declarative shadow templates, including when definitions precede parsing; those templates no longer count as label content (FLO-366).
- Elements construct on a server DOM (linkedom) without browser-only APIs (FLO-362).
- Element teardown finishes cleanup after an individual cleanup throws (FLO-363).
- Text field and select placement cancel and reset their shared measurement timer when the
  last pending field is destroyed, allowing the next lifecycle to schedule again (FLO-363).
- Prefilled multiline text fields render in SSR, including inside another custom element (FLO-416).
- `consumer:check` no longer fails on the open split button's screenshot pair. One of the two
  captures sometimes blended the menu's shadow a few levels lighter where it falls on the buttons
  (26 to 29 pixels, either build). The comparison fixture now keeps an open menu on a compositor
  layer of its own, and a pair that differs in pixels only is captured once more before it counts.
- `ssr:check` no longer depends on whether the browser has applied `:hover` at the page origin
  when it captures. The fixture sat there, under a new page's resting pointer, and CI captured a
  button group hovered before the upgrade and not after. The stage now starts 32px down, and both
  passes assert that no control of the fixture is under the pointer.
- SSR parity now requires exact Chromium matches for progress, sliders, tabs and loading
  indicators after FLO-368/FLO-369; their 22 resolved exceptions are removed (FLO-363).
- Element CSS file and export checks run after the CI build, so unit tests pass without `dist/` (FLO-365).
- SSR security reparsing runs in the Chromium CI job while unit tests remain browser-free;
  SSR parity and benchmark tooling load the source renderer and source CSS registry (FLO-363).
- Source SSR reads the element CSS registry without resolving built package exports; source tests register real Sass output without mocking the CSS import (FLO-363).

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

[Unreleased]: https://github.com/floor/mtrl/compare/v0.10.5...HEAD
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
