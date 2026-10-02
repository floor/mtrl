#!/usr/bin/env bun
// scripts/size.ts
/**
 * mtrl — Component size measurement + tree-shaking verification
 *
 * Builds each component the way a consumer imports it from the package entry,
 * then reports minified and gzipped size. Delta is against `core`: `pipe`,
 * `createBase` and `withElement`, the compose kernel a component starts from.
 *
 * A scenario that fails to compile fails the command. Every measured size has
 * a gzip budget, so a component that doubles cannot pass just because the
 * table still printed. The gzipped figure is the initial graph: static chunks
 * concatenated, which is what importing the component costs before any lazy
 * load. Dynamic imports (button → progress, card → button) are a separate
 * deferred column and are left out of `KNOWN_DEPS`, so their markers must not
 * appear in that initial graph.
 *
 * How a ceiling is set when budgets are tightened. `kb(n)` in both tables,
 * including `all`: the smallest multiple of 0.05 such that `kb(n)` is at
 * least 100 bytes above the measured gzip. Explicit byte ceilings for a
 * bundle (the `gzip:` scenarios, `full-css` and the other `*-css` ones, the
 * SSR entry's gzip, `button-initial`, the adapters' brotli margin, the Vite
 * ceilings in check-consumer.ts, and the slider entry in check-slider.ts)
 * are measured plus 1% or 100 bytes, whichever is more, rounded up to the
 * next multiple of 50, and never above the ceiling `next` had before this
 * PR. The SSR entry's raw ceiling, the npm tarball and the unpacked size
 * are measured plus 1%, rounded up to the next multiple of 1,000. Checkbox,
 * list, navigation-rail, select and switch, and the packed textfield gzip,
 * were raised to the rule once, not grown. The unpacked size stayed at
 * 6,393,000 until the 1.0 contract work filled it; it is 6,458,000 by the
 * same rule (scripts/check-package-size.ts), until FLO-546 tightens it.
 *
 * Usage:
 *   bun run size
 */

import { gzipSync } from "bun";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dir, "..");
const entry = `${root}/src/index.ts`;

// ── Public components ─────────────────────────────────────────────
//
// One row per component folder. `imports` are the factories a consumer
// actually names. The bundle is what `import { … } from "mtrl"` keeps.

export const COMPONENTS = [
  { name: "badge", imports: ["createBadge"] },
  { name: "bottom-app-bar", imports: ["createBottomAppBar"] },
  { name: "bottom-sheet", imports: ["createBottomSheet"] },
  { name: "side-sheet", imports: ["createSideSheet"] },
  { name: "button", imports: ["createButton"] },
  { name: "button-group", imports: ["createButtonGroup"] },
  { name: "card", imports: ["createCard"] },
  { name: "carousel", imports: ["createCarousel"] },
  { name: "checkbox", imports: ["createCheckbox"] },
  { name: "chips", imports: ["createFilterChip", "createChips"] },
  { name: "datepicker", imports: ["createDatePicker"] },
  { name: "dialog", imports: ["createDialog"] },
  { name: "divider", imports: ["createDivider"] },
  { name: "drawer", imports: ["createDrawer"] },
  { name: "fab", imports: ["createFab"] },
  { name: "fab-menu", imports: ["createFabMenu"] },
  { name: "extended-fab", imports: ["createExtendedFab"] },
  { name: "icon-button", imports: ["createIconButton"] },
  { name: "list", imports: ["createList"] },
  { name: "menu", imports: ["createMenu"] },
  { name: "navigation-bar", imports: ["createNavigationBar"] },
  { name: "navigation-rail", imports: ["createNavigationRail"] },
  { name: "progress", imports: ["createProgress"] },
  { name: "loading-indicator", imports: ["createLoadingIndicator"] },
  { name: "split-button", imports: ["createSplitButton"] },
  { name: "radios", imports: ["createRadios"] },
  { name: "search", imports: ["createSearch"] },
  { name: "select", imports: ["createSelect"] },
  { name: "slider", imports: ["createSlider"] },
  { name: "snackbar", imports: ["createSnackbar"] },
  { name: "switch", imports: ["createSwitch"] },
  { name: "tabs", imports: ["createTabs", "createTab"] },
  { name: "textfield", imports: ["createTextField"] },
  { name: "timepicker", imports: ["createTimePicker"] },
  { name: "top-app-bar", imports: ["createTopAppBar"] },
  { name: "tooltip", imports: ["createTooltip"] },
  { name: "toolbar", imports: ["createToolbar"] },
] as const;

export type ComponentName = (typeof COMPONENTS)[number]["name"];

// Static component imports. A marker from one of these may appear in the
// bundle even though the consumer did not import that component.
// Dynamic imports are not listed: progress must not be in button's entry
// chunk, and button must not be in card's.
export const KNOWN_DEPS: Partial<Record<ComponentName, readonly ComponentName[]>> = {
  "button-group": ["button", "icon-button"],
  dialog: ["button", "divider"],
  snackbar: ["button", "icon-button"],
  select: ["textfield", "menu"],
  tabs: ["button", "badge"],
  "split-button": ["button", "menu"],
  toolbar: ["button", "icon-button"],
  "fab-menu": ["fab"],
};

export const SCENARIO_DEFS = [
  { name: "core", imports: ["pipe", "createBase", "withElement"] },
  ...COMPONENTS.map((component) => ({ name: component.name, imports: component.imports })),
  {
    name: "all",
    imports: COMPONENTS.flatMap((component) => component.imports),
  },
  // mtrl/core/shapes (FLO-346), not the package root: every Material shape by
  // name, and one shape alone, which must not carry the other 34
  { name: "shapes", imports: ["materialShapePath"] },
  { name: "shape-heart", imports: ["shapeHeart", "polygonPath"] },
] as const;

export type ScenarioName = (typeof SCENARIO_DEFS)[number]["name"];

// ── Byte budget ───────────────────────────────────────────────────
//
// Until the pre-1.0 tightening the grid was 0.1 KB with about 100 bytes of
// room, the same shape as vlist. The rule now in force is at the top of this
// file. A budget exists to catch a regression, not a rounding. Sizes quoted
// anywhere else come from a run of this script, never from this table.
//
// Filled from a measured run. Replace a ceiling only when the component
// actually grew for a reason you can name.

/** Tenth-of-a-KB ceiling, matching how sizes are quoted. */
export const kb = (n: number): number => Math.floor(n * 1024);

export const BUDGET_BYTES: Record<ScenarioName, number> = {
  core: kb(3.0), // 2,951 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  badge: kb(5.25), // 5,226 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  "bottom-app-bar": kb(4.1),
  // layer: "top" (the top-layer helper, the Tab wrap for slotted content, cancel and
  // the backdrop): the bottom sheet 5,652 to 6,409, the side sheet 5,279 to 6,021
  "bottom-sheet": kb(6.7), // a modal outside the top layer: inert page and Tab trap (FLO-324): 6,639; the handle as a button (FLO-324): 6,773
  "side-sheet": kb(6.2), // a modal outside the top layer: inert page and Tab trap (FLO-324): 6,242
  button: kb(7.4), // 7,434 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  "button-group": kb(11.65), // FLO-382 select(unknown) clears with a dev warning: 11,912 → 12,094
  // main's root class option (FLO-403) on the forward merge: next 12,107 to 12,148.
  // main's isDisabled() (FLO-384) on the forward merge: next e8adc013 12,170 to 12,202; 12,208 on
  // #406's final head (re-measured on the FLO-383 A2 forward merge); 11,796 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9.
  card: kb(6.6), // 6,653 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  carousel: kb(10.95), // opt-in wheel scrolling with momentum (FLO-395): 10.3 to 10.9 KB against 2ef11f0; 11,106 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  checkbox: kb(5.65), // FLO-380: boolean change value plus the HTML valueAttribute token; main's isDisabled() (FLO-384) on the forward merge: next 5,644 to 5,658. 5,645 raised to the rule, not grown, against b9dab36e, Node 22.23.3 / npm 10.9.9.
  chips: kb(9.05), // FLO-256..261 chips conformance; #221 pointer focus; keyboard.disable() and :dir(rtl) (FLO-343 follow-up): 9,305 to 9,319; 9,159 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  datepicker: kb(12.2), // FLO-238 conformance; FLO-274 swiping; FLO-275 year list; FLO-276 full screen; read-only, required, one change shape (FLO-289, FLO-295): 12,332; FLO-119 aria-disabled: 12,412
  dialog: kb(12.65), // layer: "top", as the sheets: 12,047 to 12,870; the navigation bar's cascade layer name in every sheet (FLO-305): 12,999 to 13,005; 12,722 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9; the open / close contract (FLO-548: its own open state, the three tracked timers and their cancelling, the repeat-call and re-entry guards): 12,714 to 12,796 against f463146d. kb(12.55) is 12,851 (55 above, short of 100); raised to kb(12.6) = 12,902 (106 above), Node 22.23.3 / npm 10.9.9; dismissible when open() returns, except by the key press that opened it, and destroy() removing the document listeners (FLO-548): 12,796 to 12,821 against 67045e1e. kb(12.6) is 12,902 (81 above, short of 100); raised to kb(12.65) = 12,953 (132 above), Node 22.23.3 / npm 10.9.9; the opening key by a flag for the task of open(), in both layers, in place of the stamp: 12,821 to 12,814
  divider: kb(3.7),
  drawer: kb(7.8), // the modal drawer's layer: "top": 7,622 to 8,109; 7,864 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  fab: kb(5.35), // 5,331 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  "fab-menu": kb(8.15), // FLO-306, with the FAB; the menu presentation's menu is a chunk (DEFERRED_BUDGET_BYTES): 8,304; the width reveal and the clamped colour easing (FLO-348): 8,381; 8,177 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9; open in the call for the menu presentation, close() before the surface arrives, and the last open() winning during the load (FLO-548 families 3 and 5): 8,174 to 8,204 against e64fbafa. kb(8.1) is 8,294 (90 above, short of 100); raised to kb(8.15) = 8,345 (141 above), Node 22.23.3 / npm 10.9.9
  "extended-fab": kb(5.9), // 5,929 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  "icon-button": kb(6.35), // 6,374 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  list: kb(6.55), // FLO-100 full list anatomy. 6,578 raised to the rule, not grown, against b9dab36e, Node 22.23.3 / npm 10.9.9.
  // layer: "top" and the core/dom top-layer helper add 485 (12,519 to 13,004)
  menu: kb(12.3), // 12,453 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  "navigation-bar": kb(5.8), // FLO-305: 5,848, its destinations shared with the rail
  "navigation-rail": kb(6.65), // 6,693 raised to the rule, not grown, against b9dab36e, Node 22.23.3 / npm 10.9.9
  progress: kb(10.4),
  "loading-indicator": kb(9.3), // the Compose-exact shapes (FLO-346): 9,138 to 9,447, the first-arc split 149 B of it
  "split-button": kb(17), // the menu's top layer: 17,644 to 18,122; the menu's positionTarget (FLO-300): 18,228; 17,167 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9; the menu closed when close() returns: its state and `close` in the call, four tracked timers and their cancelling, the dismiss listeners added in open() and the flag for the event that opened it (FLO-548): 17,269 to 17,296 against d306d4c2 (36 of room before it, 9 after). kb(16.95) is 17,356 (60 above, short of 100); raised to kb(17) = 17,408 (112 above), Node 22.23.3 / npm 10.9.9
  radios: kb(5.1),
  search: kb(10.4), // the open view in the top layer (FLO-285): 9,759; combobox, contained and divided (FLO-286, FLO-287): 10,114; minWidth and maxWidth (FLO-290): 10,161; trailing items, avatar, supporting text, reopening (FLO-291): 10,477; FLO-514 cancels the deferred opening focus: 10,509 to 10,566. kb(10.3) is 10,547, which does not fit
  select: kb(20.5), // the menu's top layer: 19,600 to 20,115; the field, the supporting text row and the counter (FLO-300): 20,608; main's root class option (FLO-403) on the forward merge: next 20,743 to 20,790; 20,821 on the FLO-383 A2 forward merge (17 B left); the menu's tabindex reset (FLO-515): 20,867, which does not fit kb(20.35). 20,853 raised to the rule, not grown, against b9dab36e, Node 22.23.3 / npm 10.9.9
  slider: kb(12.95), // FLO-249..255 slider conformance; FLO-331 the track corner token (12,918 measured); track, stops and the inset icon as a percentage of the value (FLO-369): 13,276; 13,158 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  // layer: "top", the core/dom top-layer helper and the modal-dialog placement, which
  // follows modals opening and closing: 11,533 to 12,320
  snackbar: kb(11.9), // 12,046 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  switch: kb(6.15), // #214 conformance; #218 node labels; 6,221 on the FLO-383 A2 forward merge (25 B left). 6,188 raised to the rule, not grown, against b9dab36e, Node 22.23.3 / npm 10.9.9
  tabs: kb(13.15), // the indicator anchors to the active label instead of measuring it (FLO-369): 13,467; derived ids and the data-value panel lookup (FLO-430): 13,542 to 13,685; 13,359 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  // the field, the supporting text row and the counter (FLO-300): 8,290. The required
  // asterisk, the live error and the trailing icon button (FLO-301): 8,314 to 8,926 against 7cd57a6.
  // main's placement on demand (FLO-378) met next's placement timer reset (FLO-363): next 8,948 to 9,021 on the forward merge.
  textfield: kb(8.9),
  timepicker: kb(10.5), // the draft, input event, dialog in the component's tree and disabled (FLO-288): 10,639
  "top-app-bar": kb(4.4),
  toolbar: kb(11.05), // FLO-304, with its icon buttons and buttons; the overflow menu is injected: 11,302; slotted items for <m-toolbar>: 11,374; the toggles' change value (FLO-380): 11,454 to 11,479; 11,166 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
  // mtrl/core/shapes (FLO-346): every shape by name, and one shape alone
  shapes: kb(4.2), // materialShapePath, all 35: 4,190
  "shape-heart": kb(2.7), // shapeHeart and polygonPath: 2,623
  tooltip: kb(5.9), // layer: "top" and the core/dom top-layer helper: 5,562 to 5,952
  // the conformance work above, measured 2026-09-29; the menu's top layer (#251) to 112,692; select and
  // split button passing the layer, and the opener's focus test across shadow roots, to 112,845; the
  // tooltip and snackbar top layer to 113,481; the modal surfaces' top layer to 113,761 (each measured
  // alone on dba5ba9); the time picker limits and steps (FLO-281): 113,297 on main; all of wave 2 together on 91e4d77: 115,162.
  all: kb(121.95), // search in the top layer (FLO-285): 115,628; its combobox and variants (FLO-286, FLO-287): 115,909; search's trailing items and reopening (FLO-291): 116,488; the date picker's field states and one change shape (FLO-289, FLO-295): 116,800; the text field's field, supporting text row and counter (FLO-300): 117,305; the toolbar (FLO-304): 117,350 to 119,455; <m-toolbar>'s slotted items and the colour hooks: 119,541; the FAB menu (FLO-306): 122,060; the FAB menu motion (FLO-348): 122,085 to 122,178; merged with main at 5bc71da (FLO-349, FLO-350): 122,232; the Material shapes (FLO-346): 122,267 to 122,619; the text field's asterisk, live error and trailing button (FLO-301): 122,623 to 123,218 against 7cd57a6; slider and tabs positions without measuring (FLO-369): 123,940; the navigation bar (FLO-305): 124,071 to 125,033 against 746b127 (with FLO-380's checkbox); the carousel's wheel scrolling (FLO-395) after the forward merge: 125,722 against cc8250e; config on* options as listeners, after the second merge with next: 124,359. kb(121.45) is 124,364 (5 bytes of room, short of 100). kb(121.5) is 124,416 (57 above). 124,359 raised to kb(121.55), not grown, against 43a5d49e, Node 22.23.3 / npm 10.9.9; the inner menu behind a symbol, split button setItems and getItems, and `setItems` creates the split button's menu when it had none (FLO-543): 124,355 to 124,469 against 4da0cd98. kb(121.6) is 124,518 (49 above, short of 100); raised to kb(121.65) = 124,569 (100 above), Node 22.23.3 / npm 10.9.9; the snackbar's queued state and isOpen(), a queued snackbar leaving the queue when hidden, dropped or destroyed, isOpen() on the date picker and its opening click, the split button's destroyed guard (FLO-548 family 4): 124,474 to 124,580 against 58322f08. kb(121.75) is 124,672 (92 above, short of 100); raised to kb(121.8) = 124,723, Node 22.23.3 / npm 10.9.9; the dialog's open / close contract (FLO-548 family 1): 124,469 to 124,538 against f463146d. kb(121.7) is 124,620 (82 above, short of 100); raised to kb(121.75) = 124,672 (134 above), Node 22.23.3 / npm 10.9.9; the dialog dismissible when open() returns (FLO-548 family 1): 124,562, 110 of room, not raised; families 1 and 4 together, merged with next df25eb0f: 124,674. kb(121.8) is 124,723 (49 above, short of 100); raised to kb(121.85) = 124,774 (100 above), Node 22.23.3 / npm 10.9.9; the menu closed when close() returns: its state and `close` in the call, four tracked timers and their cancelling, the dismiss listeners added in open() and the flag for the event that opened it (FLO-548 family 2): 124,566 to 124,613 against d306d4c2. kb(121.75) is 124,672 (59 above, short of 100); raised to kb(121.8) = 124,723 (110 above), Node 22.23.3 / npm 10.9.9; families 1, 2 and 4 together, merged with 2c2990cc: 124,718, then 124,692 with the dead preventDefault off the menu's and the select's payloads (select 20,883 to 20,863). kb(121.85) is 124,774 (82 above, short of 100); raised to kb(121.9) = 124,825 (133 above), Node 22.23.3 / npm 10.9.9; the FAB menu's open in the call (FLO-548 families 3 and 5), with next 5d263059 merged (the family 4 follow-ups): 124,755. kb(121.9) is 124,825 (70 above, short of 100); raised to kb(121.95) = 124,876 (121 above), Node 22.23.3 / npm 10.9.9
  // the time picker draft (FLO-288) and search widths (FLO-290): 116,200 on c3e3e18; 124,245 tightened before 1.0 against 3d942098, Node 22.23.3 / npm 10.9.9
};

/**
 * Budgets for what a component loads with import() when it needs it, apart
 * from its initial graph: the deferred column. Same headroom rule.
 */
export const DEFERRED_BUDGET_BYTES: Partial<Record<ScenarioName, number>> = {
  menu: kb(2.2), // the submenu feature, a chunk since FLO-310
  "fab-menu": kb(10.45), // the baseline menu of the menu presentation (FLO-306); the menu closed when close() returns: its state and `close` in the call, four tracked timers and their cancelling, the dismiss listeners added in open() and the flag for the event that opened it (FLO-548): 10,537 to 10,584 against d306d4c2. kb(10.4) is 10,649 (65 above, short of 100); raised to kb(10.45) = 10,700 (116 above), Node 22.23.3 / npm 10.9.9
};

export interface SizeGateInput {
  readonly buildFailures: readonly string[];
  readonly treeShakeFailures: readonly unknown[];
  readonly overBudget: readonly string[];
}

/** The command fails if any scenario failed to build, leaked, or grew past its budget. */
export const sizeGateFails = (input: SizeGateInput): boolean =>
  input.buildFailures.length > 0
  || input.treeShakeFailures.length > 0
  || input.overBudget.length > 0;

export const missingMeasuredScenarios = (
  measuredNames: readonly string[],
): readonly ScenarioName[] => {
  const measured = new Set(measuredNames);
  return SCENARIO_DEFS.map((scenario) => scenario.name).filter((name) => !measured.has(name));
};

// ── Markers ───────────────────────────────────────────────────────
//
// A marker is a string literal quoted by one component and by no other, which
// the minified initial graph still quotes. Three of those, preferring literals
// that name the component, are enough to notice a leaked module.

const STRING_LITERAL = /["']([^"'\\\n]{6,160})["']/g;
const TEMPLATE_LITERAL = /`([^`\\\n$]{6,160})`/g;

const readTree = (dir: string): string => {
  const parts: string[] = [];
  const walk = (current: string): void => {
    for (const name of readdirSync(current)) {
      const path = join(current, name);
      if (statSync(path).isDirectory()) {
        walk(path);
        continue;
      }
      if (name.endsWith(".ts") && !name.endsWith(".d.ts")) parts.push(readFileSync(path, "utf8"));
    }
  };
  walk(dir);
  return parts.join("\n");
};

const extractLiterals = (source: string): readonly string[] => {
  const found = new Set<string>();
  for (const pattern of [STRING_LITERAL, TEMPLATE_LITERAL]) {
    pattern.lastIndex = 0;
    let match = pattern.exec(source);
    while (match) {
      const value = match[1];
      if (
        value
        && /[a-z]/i.test(value)
        && !value.startsWith(".")
        && !value.startsWith("/")
        && !value.includes("://")
      ) {
        found.add(value);
      }
      match = pattern.exec(source);
    }
  }
  return [...found];
};

/** True when the minifier kept `marker` as its own quoted literal. */
const quotes = (text: string, marker: string): boolean =>
  text.includes(`"${marker}"`) || text.includes(`'${marker}'`) || text.includes(`\`${marker}\``);

const uniqueLiterals = (
  name: ComponentName,
  sources: ReadonlyMap<ComponentName, string>,
  coreSource: string,
): readonly string[] => {
  const own = extractLiterals(sources.get(name) ?? "");
  const unique: string[] = [];
  for (const value of own) {
    // Quoted, not a bare substring: "FAB creation error:" sits inside
    // extended-fab's "Extended FAB creation error:" and must still count as fab's.
    if (quotes(coreSource, value)) continue;
    let shared = false;
    for (const [other, source] of sources) {
      if (other !== name && quotes(source, value)) {
        shared = true;
        break;
      }
    }
    if (!shared) unique.push(value);
  }
  return unique.sort((a, b) => b.length - a.length);
};

const allowed = (name: ComponentName): ReadonlySet<ComponentName> => {
  const names = new Set<ComponentName>([name]);
  const deps = KNOWN_DEPS[name];
  if (deps) for (const dep of deps) names.add(dep);
  return names;
};

// ── Build & measure ───────────────────────────────────────────────

interface Scenario {
  name: ScenarioName;
  imports: readonly string[];
}

interface Result {
  name: ScenarioName;
  minBytes: number;
  gzBytes: number;
  /** Gzip of extra JS chunks. Dynamic imports land here, not in `gzBytes`. */
  deferredGzBytes: number;
  minKB: number;
  gzKB: number;
  deltaKB: number;
}

interface TreeShakeFailure {
  scenario: string;
  leaked: string;
  marker: string;
}

interface BuiltChunk {
  readonly path: string;
  readonly kind: string;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface ChunkEdges {
  readonly staticDeps: readonly string[];
  readonly dynamicDeps: readonly string[];
}

/** Initial chunks (static imports) and every chunk reached only through import(). */
const chunkGraph = async (
  chunks: readonly BuiltChunk[],
): Promise<{ initial: readonly string[]; deferred: readonly string[] } | string> => {
  const byPath = new Map(chunks.map((chunk) => [chunk.path, chunk]));
  const entryChunk = chunks.find((chunk) => chunk.kind === "entry-point") ?? chunks[0];
  if (!entryChunk) return "build produced no JavaScript";

  const edgesOf = async (path: string): Promise<ChunkEdges | string> => {
    const output = byPath.get(path);
    if (!output) return `missing chunk ${path}`;
    const file = ts.createSourceFile(path, await output.text(), ts.ScriptTarget.Latest, true);
    const staticDeps: string[] = [];
    const dynamicDeps: string[] = [];
    const walk = (node: ts.Node): void => {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
        && node.moduleSpecifier
        && ts.isStringLiteral(node.moduleSpecifier)
      ) {
        staticDeps.push(resolve(dirname(path), node.moduleSpecifier.text));
      }
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const specifier = node.arguments[0];
        if (specifier && ts.isStringLiteral(specifier)) {
          dynamicDeps.push(resolve(dirname(path), specifier.text));
        }
      }
      ts.forEachChild(node, walk);
    };
    walk(file);
    return { staticDeps, dynamicDeps };
  };

  const initial: string[] = [];
  const deferred = new Set<string>();

  const visit = async (path: string): Promise<string | undefined> => {
    if (initial.includes(path)) return undefined;
    const edges = await edgesOf(path);
    if (typeof edges === "string") return edges;
    initial.push(path);
    for (const dependency of edges.dynamicDeps) deferred.add(dependency);
    for (const dependency of edges.staticDeps) {
      const missing = await visit(dependency);
      if (missing) return missing;
    }
    return undefined;
  };

  const missing = await visit(entryChunk.path);
  if (missing) return missing;

  // A lazy chunk can import() further chunks (card → button → progress).
  // Those stay out of the initial graph and join the deferred total.
  const lazy: string[] = [];
  const queue = [...deferred].filter((path) => !initial.includes(path));
  let cursor = queue.pop();
  while (cursor !== undefined) {
    if (!lazy.includes(cursor) && !initial.includes(cursor)) {
      const edges = await edgesOf(cursor);
      if (typeof edges === "string") return edges;
      lazy.push(cursor);
      for (const dependency of [...edges.staticDeps, ...edges.dynamicDeps]) {
        if (!initial.includes(dependency) && !lazy.includes(dependency)) queue.push(dependency);
      }
    }
    cursor = queue.pop();
  }

  return { initial, deferred: lazy };
};

const concatBytes = async (paths: readonly string[], byPath: ReadonlyMap<string, BuiltChunk>): Promise<Uint8Array> => {
  const parts: Uint8Array[] = [];
  let length = 0;
  for (const path of paths) {
    const chunk = byPath.get(path);
    if (!chunk) continue;
    const bytes = new Uint8Array(await chunk.arrayBuffer());
    parts.push(bytes);
    length += bytes.byteLength;
  }
  const joined = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    joined.set(part, offset);
    offset += part.byteLength;
  }
  return joined;
};

const scenarioSource = (scenario: Scenario): string => {
  if (scenario.name === "core") {
    return `import { pipe, createBase, withElement } from "${root}/src/core/compose/index.ts"; globalThis._v = [pipe, createBase, withElement];`;
  }
  const imports = scenario.imports.join(", ");
  const from = scenario.name === "shapes" || scenario.name === "shape-heart" ? `${root}/src/core/shapes/index.ts` : entry;
  return `import { ${imports} } from "${from}"; globalThis._v = [${imports}];`;
};

const main = async (): Promise<void> => {
  const coreSource = readTree(join(root, "src/core"));
  const sources = new Map<ComponentName, string>();
  for (const component of COMPONENTS) {
    sources.set(component.name, readTree(join(root, "src/components", component.name)));
  }
  const candidates = new Map<ComponentName, readonly string[]>();
  for (const component of COMPONENTS) {
    candidates.set(component.name, uniqueLiterals(component.name, sources, coreSource));
  }

  const scratch = mkdtempSync("/tmp/mtrl-size-");
  const results: Result[] = [];
  const bundles = new Map<ScenarioName, string>();
  const buildFailures: ScenarioName[] = [];
  const scenarios: readonly Scenario[] = SCENARIO_DEFS;

  for (const scenario of scenarios) {
    const tmpFile = `${scratch}/${scenario.name.replace(/[^a-zA-Z0-9]/g, "_")}.ts`;
    await Bun.write(tmpFile, scenarioSource(scenario));

    const build = await Bun.build({
      entrypoints: [tmpFile],
      outdir: `${scratch}/out/${scenario.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
      minify: true,
      splitting: true,
      target: "browser",
      format: "esm",
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    });

    if (!build.success) {
      console.error(`  ✗ ${scenario.name} — build failed`);
      for (const log of build.logs) console.error("   ", log);
      buildFailures.push(scenario.name);
      continue;
    }

    const chunks = build.outputs.filter((output): output is typeof output & BuiltChunk =>
      output.path.endsWith(".js"),
    );
    const byPath = new Map(chunks.map((chunk) => [chunk.path, chunk]));
    const graph = await chunkGraph(chunks);
    if (typeof graph === "string") {
      console.error(`  ✗ ${scenario.name} — ${graph}`);
      buildFailures.push(scenario.name);
      continue;
    }

    const initialBytes = await concatBytes(graph.initial, byPath);
    const deferredBytes = await concatBytes(graph.deferred, byPath);
    const gzBytes = gzipSync(initialBytes).byteLength;
    const deferredGzBytes = deferredBytes.byteLength === 0 ? 0 : gzipSync(deferredBytes).byteLength;
    const texts: string[] = [];
    for (const path of graph.initial) {
      const chunk = byPath.get(path);
      if (chunk) texts.push(await chunk.text());
    }

    bundles.set(scenario.name, texts.join("\n"));
    results.push({
      name: scenario.name,
      minBytes: initialBytes.byteLength,
      gzBytes,
      deferredGzBytes,
      minKB: initialBytes.byteLength / 1024,
      gzKB: gzBytes / 1024,
      deltaKB: 0,
    });
  }

  const markers = new Map<ComponentName, readonly string[]>();
  const coreBundle = bundles.get("core") ?? "";
  for (const component of COMPONENTS) {
    const bundle = bundles.get(component.name);
    const pool = candidates.get(component.name) ?? [];
    const surviving = bundle
      ? pool.filter((marker) => quotes(bundle, marker) && !quotes(coreBundle, marker))
      : [];
    const named = surviving.filter((marker) => marker.includes(component.name));
    markers.set(component.name, (named.length > 0 ? named : surviving).slice(0, 3));
  }

  const treeShakeFailures: TreeShakeFailure[] = [];

  for (const component of COMPONENTS) {
    if ((markers.get(component.name) ?? []).length > 0) continue;
    if (!bundles.has(component.name)) continue;
    treeShakeFailures.push({
      scenario: component.name,
      leaked: component.name,
      marker: "(no surviving marker)",
    });
  }

  for (const scenario of scenarios) {
    if (scenario.name === "all") continue;
    const bundle = bundles.get(scenario.name);
    if (!bundle) continue;
    // core and the shapes scenarios may carry no component at all
    const keep =
      scenario.name === "core" || scenario.name === "shapes" || scenario.name === "shape-heart"
        ? new Set<ComponentName>()
        : allowed(scenario.name);
    for (const component of COMPONENTS) {
      if (keep.has(component.name)) continue;
      for (const marker of markers.get(component.name) ?? []) {
        if (quotes(bundle, marker)) {
          treeShakeFailures.push({ scenario: scenario.name, leaked: component.name, marker });
          break;
        }
      }
    }
  }

  const coreGz = results.find((result) => result.name === "core")?.gzKB ?? 0;
  for (const result of results) result.deltaKB = result.gzKB - coreGz;

  const COL_NAME = 20;
  const COL_MIN = 10;
  const COL_GZ = 9;
  const COL_DELTA = 12;
  const COL_DEFERRED = 12;
  const showDeferred = results.some((result) => result.deferredGzBytes > 0);
  const LINE_W = COL_NAME + COL_MIN + COL_GZ + COL_DELTA + (showDeferred ? COL_DEFERRED : 0) + (showDeferred ? 6 : 4);

  const pad = (value: string, width: number): string => value.padStart(width);
  const sep = "─".repeat(LINE_W);

  console.log("");
  console.log("  mtrl — Component Sizes");
  console.log("");
  const header = `  ${"Component".padEnd(COL_NAME)}  ${"Minified".padStart(COL_MIN)}  ${"Gzipped".padStart(COL_GZ)}  ${"vs core".padStart(COL_DELTA)}`;
  console.log(showDeferred ? `${header}  ${"Deferred".padStart(COL_DEFERRED)}` : header);
  console.log(`  ${sep}`);

  for (const result of results) {
    const min = `${result.minKB.toFixed(1)} KB`;
    const gz = `${result.gzKB.toFixed(1)} KB`;
    const delta = result.name === "core"
      ? ""
      : `${result.deltaKB >= 0 ? "+" : ""}${result.deltaKB.toFixed(1)} KB`;
    const line = `  ${result.name.padEnd(COL_NAME)}  ${pad(min, COL_MIN)}  ${pad(gz, COL_GZ)}  ${pad(delta, COL_DELTA)}`;
    if (!showDeferred) {
      console.log(line);
      continue;
    }
    const deferred = result.deferredGzBytes === 0
      ? ""
      : `+${(result.deferredGzBytes / 1024).toFixed(1)} KB`;
    console.log(`${line}  ${pad(deferred, COL_DEFERRED)}`);
  }

  console.log(`  ${sep}`);
  console.log("");

  if (buildFailures.length > 0) {
    console.log(`  ✗ Build: ${buildFailures.length} scenario(s) failed to compile`);
    for (const name of buildFailures) console.log(`    ${name}`);
    console.log("");
  }

  if (treeShakeFailures.length === 0) {
    const checked = results.filter((result) => result.name !== "all").length;
    const expected = scenarios.length - 1;
    console.log(
      checked === expected
        ? `  ✓ Tree-shaking: all ${expected} scenarios clean — unused components excluded`
        : `  ✓ Tree-shaking: ${checked} measured scenario(s) clean`,
    );
  } else {
    console.log(`  ✗ Tree-shaking: ${treeShakeFailures.length} leak(s) detected`);
    console.log("");
    for (const failure of treeShakeFailures) {
      console.log(`    ${failure.scenario}: leaked ${failure.leaked} (marker: "${failure.marker}")`);
    }
  }

  console.log("");

  const overBudget: string[] = [];

  for (const scenario of scenarios) {
    const budget = BUDGET_BYTES[scenario.name];
    const result = results.find((item) => item.name === scenario.name);
    if (!result) {
      console.log(`  ✗ ${scenario.name}: not measured (build failed)`);
      continue;
    }
    const over = result.gzBytes > budget;
    if (over) overBudget.push(result.name);
    console.log(
      `  ${over ? "✗" : "✓"} ${result.name}: ${result.gzBytes} bytes gzipped (budget ${budget})`,
    );
    const deferredBudget = DEFERRED_BUDGET_BYTES[scenario.name];
    if (deferredBudget !== undefined) {
      const deferredOver = result.deferredGzBytes > deferredBudget;
      if (deferredOver) overBudget.push(`${result.name} (deferred)`);
      console.log(
        `  ${deferredOver ? "✗" : "✓"} ${result.name} deferred: ${result.deferredGzBytes} bytes gzipped (budget ${deferredBudget})`,
      );
    }
  }

  console.log("");

  rmSync(scratch, { recursive: true, force: true });

  for (const name of missingMeasuredScenarios(results.map((result) => result.name))) {
    if (!buildFailures.includes(name)) buildFailures.push(name);
  }

  if (sizeGateFails({ buildFailures, treeShakeFailures, overBudget })) {
    process.exit(1);
  }
};

if (import.meta.main) {
  await main();
}
