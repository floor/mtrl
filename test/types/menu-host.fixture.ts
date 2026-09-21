// test/types/menu-host.fixture.ts
//
// Menu's internal host, `MenuFeatureHost`, declared twelve manager methods as
// `(...args: unknown[]) => unknown`. That is wider than any of the producers,
// and under `strictFunctionTypes` a host promising to call a method with
// *anything* cannot accept one that takes typed parameters — which is what
// made the pipe in menu.ts fail to resolve, typing every stage after it
// `unknown` and producing menu's other three errors (FLO-114).
//
// The signatures are now taken from the implementations in `features/`. They
// are asserted here because the placeholder they replaced was accepted by
// everything, so nothing else notices if one drifts back.
//
// Note what the placeholders were hiding. Typing them surfaced four real
// disagreements, all fixed in the same commit:
//
//   - `handleSubmenuLeave` takes no parameters, and the mouseleave handler in
//     controller.ts was passing it the event, which was silently discarded;
//   - `currentItems()` was annotated `unknown[]` through a cast, throwing away
//     the `MenuContent[]` it actually returns;
//   - `activeSubmenus` was being passed into `setupKeyboardHandlers` and never
//     read by it;
//   - three submenu actions were passed as `null` when `component.submenu` is
//     absent, and keyboard.ts calls all four of them unguarded. `withSubmenu`
//     is unconditional in the pipe, so the null never occurs today — but the
//     guard the ternary was reaching for did not work. They are optional now,
//     and called through `?.`.
//
// Compiled by `bun run tooling:check` via tsconfig.types.json.
import type {
  KeyboardActions,
  KeyboardMenuState,
  MenuContent,
  MenuFeatureHost,
  MenuItem,
} from "../../src/components/menu/types";

/** true when A and B are the same type */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/** the placeholder every one of these used to have */
type Placeholder = (...args: unknown[]) => unknown;

type Submenu = NonNullable<MenuFeatureHost["submenu"]>;
type Keyboard = NonNullable<MenuFeatureHost["keyboard"]>;
type Position = NonNullable<MenuFeatureHost["position"]>;

// --- none of them is the placeholder any more ------------------------------

export const submenuClickIsTyped: Equals<
  NonNullable<Submenu["handleSubmenuClick"]>,
  Placeholder
> = false;
export const closeSubmenuIsTyped: Equals<
  NonNullable<Submenu["closeSubmenu"]>,
  Placeholder
> = false;
export const keydownIsTyped: Equals<Keyboard["handleMenuKeydown"], Placeholder> = false;
export const positionMenuIsTyped: Equals<Position["positionMenu"], Placeholder> = false;

// --- and they say what the implementations say -----------------------------

export const submenuClickTakesAnItem: Equals<
  Parameters<NonNullable<Submenu["handleSubmenuClick"]>>,
  [MenuItem, number, HTMLElement]
> = true;

export const submenuLeaveTakesNothing: Equals<
  Parameters<Submenu["handleSubmenuLeave"]>,
  []
> = true;

export const closeSubmenuTakesALevel: Equals<
  Parameters<NonNullable<Submenu["closeSubmenu"]>>,
  [number]
> = true;

export const keydownTakesAKeyboardEvent: Equals<
  Parameters<Keyboard["handleMenuKeydown"]>,
  [KeyboardEvent, KeyboardMenuState, KeyboardActions]
> = true;

// positionSubmenu's third parameter has a default in the implementation, so
// it is optional here rather than required.
export const positionSubmenuLevelIsOptional: Equals<
  Parameters<Position["positionSubmenu"]>,
  [HTMLElement, HTMLElement, (number | undefined)?]
> = true;

// --- the state the keyboard reads ------------------------------------------

// `items` is MenuContent[], which is what currentItems() returns now that its
// `unknown[]` cast is gone.
export const keyboardStateCarriesItems: Equals<
  KeyboardMenuState,
  { items: MenuContent[] }
> = true;

// --- what the host rejects -------------------------------------------------
//
// Each directive below fails the build if the line it guards stops being an
// error, so each is an assertion in both directions.

declare const submenu: Submenu;
declare const keyboard: Keyboard;

// The call the placeholder used to allow: anything at all.
// @ts-expect-error handleSubmenuClick takes an item, an index and an element
submenu.handleSubmenuClick?.("whatever");

// @ts-expect-error handleSubmenuLeave takes no parameters -- this was the bug
submenu.handleSubmenuLeave(new Event("mouseleave"));

// @ts-expect-error closeSubmenu takes a level, not an element
submenu.closeSubmenu?.(document.createElement("div"));

// @ts-expect-error handleInitialFocus takes "keyboard" | "mouse"
keyboard.handleInitialFocus(document.createElement("div"), "touch");

// --- what it still allows --------------------------------------------------

submenu.handleSubmenuLeave();
submenu.closeSubmenu?.(1);
keyboard.handleInitialFocus(document.createElement("div"), "keyboard");
