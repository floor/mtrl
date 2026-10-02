// src/svelte/runtime.ts
/**
 * What every generated Svelte component (`dist/svelte/*.svelte`) runs.
 *
 * A component renders its tag with `<svelte:element>`, spreads
 * `attributes(...)` on it and attaches `action`. Attributes are rendered as
 * attributes, so server markup carries them; live-state properties
 * (`checked`, `value`) are `$bindable()` props the action writes to the
 * element and writes back after each element event, so `bind:checked` works;
 * the attribute a live property shadows is its `default*` prop. Element
 * events are `on<event>` callback props, as Svelte 5 names them. The element
 * registers when the action first runs, never at import.
 *
 * Each component can also emit a declarative shadow root on the server
 * (FLO-375). `shadowMarkup` reads the renderer `mtrl/ssr/svelte` installs on
 * `Symbol.for("mtrl.ssr")` — the same bridge as React — and returns the
 * `<template shadowrootmode>` string there, or `""` in the browser, when no
 * renderer is registered, and when the element opts out of SSR. The client
 * renders nothing where the parser already consumed the template. Nothing
 * here imports the server renderer.
 *
 * @module svelte
 */

import type { Snippet } from "svelte";
import type { Action } from "svelte/action";
import type { HTMLAttributes } from "svelte/elements";
import type { DefineOptions, ElementEvents, ElementProperties, ElementProps, ElementSlotProp } from "../elements";
import {
  camel,
  describe,
  describeDeclaration,
  getPrefix,
  isBrowser,
  serverDefaults,
  toAttribute,
  writeDefaults,
  writeLive,
  type ComponentSpec,
  type DeclarationSpec,
  type DefaultProps,
  type FormProps,
  type RetiredEvents,
} from "../elements/adapter";

export { configure } from "../elements/adapter";

/** `change` → `onchange`, as Svelte 5 names event props, typed with the element's event. */
export type EventProps<S> = {
  [K in keyof ElementEvents<S> & string as `on${K}`]?: (event: ElementEvents<S>[K]) => void;
};

type BaseProps<S> = ElementProps<S> & DefaultProps<S> & FormProps<S> & EventProps<S>;

/**
 * Each named slot as a snippet prop (`{#snippet actions()}`); a text prop of
 * the same name (`headline`) takes its text or a snippet (FLO-325).
 */
type SnippetProps<S, P> = {
  [K in ElementSlotProp<S>]?: (K extends keyof P ? Exclude<P[K], undefined> : never) | Snippet;
};

type OwnProps<S> = Omit<BaseProps<S>, ElementSlotProp<S>> & SnippetProps<S, BaseProps<S>>;

/**
 * `nonce` is global; Svelte types it on script and style only. `popover`,
 * `inputmode`, `enterkeyhint` and `itemprop` are already on `HTMLAttributes`
 * (`inputMode`, `enterKeyHint` and `itemProp` are not Svelte prop names).
 * A release that already declares a key keeps its own type.
 */
type SvelteHostGaps = {
  nonce?: string;
};

type Missing<Base, Extra> = {
  [K in Exclude<keyof Extra, keyof Base>]?: K extends keyof Extra ? Extra[K] : never;
};

type SvelteHostAttributes = HTMLAttributes<HTMLElement> & Missing<HTMLAttributes<HTMLElement>, SvelteHostGaps>;

/**
 * Props of a generated component: the element's own, plus any HTML attribute for the host.
 * `OwnProps` includes the element's `on<event>` handlers (`onchange`), so those names keep the component's event.
 */
export type SvelteProps<S> = OwnProps<S> &
  Omit<SvelteHostAttributes, keyof OwnProps<S> | "children" | RetiredProps<S>> &
  { [K in RetiredProps<S>]?: `${K} was removed in 1.0: use onchange` } & { children?: Snippet };

/** The handler props of events 1.0 removed (`ontoggle` on the icon button): refused, see `RetiredEvents`. */
type RetiredProps<S> = `on${RetiredEvents<S>}`;

/** The live properties a generated component binds (`bind:checked`). */
export type Bindable<S> = keyof ElementProperties<S> & string;

export type DeclarationProps<A> = A & Omit<SvelteHostAttributes, keyof A | "children"> & { children?: Snippet };

/** What a generated component passes its action on every update. */
export interface Binding {
  /** The component's props other than the bindable ones and `children`. */
  props: Record<string, unknown>;
  /** The bindable props' current values. */
  live: Record<string, unknown>;
  /** Writes a bindable prop back, for `bind:`. */
  set: Record<string, (value: unknown) => void>;
}

export interface Adapter {
  tag: string;
  /** What to spread on the element. */
  attributes: (props: Record<string, unknown>, live: Record<string, unknown>) => Record<string, unknown>;
  /** The named snippets, each with the slot it renders into (`headerAction` → `header-action`). */
  snippets: (props: Record<string, unknown>) => Array<[slot: string, snippet: Snippet]>;
  action: Action<HTMLElement, Binding>;
}

/**
 * The runtime of the Svelte component for an element.
 * @param spec - The element's spec (`switchElement.spec`)
 * @param define - Registers the element and anything it needs (`defineSwitch`)
 */
export const adapter = (spec: ComponentSpec, define: (options?: DefineOptions) => string): Adapter => {
  const described = describe(spec);
  const { attributes, properties, events, form } = described;
  const eventProps = new Set(events.map((event) => `on${event}`));
  // A named snippet is a function prop named after a slot the element
  // declares (`headerAction` for `header-action`); any other function, a
  // handler or a spread callback, is not rendered (FLO-334).
  const slots = new Map(described.slots.map((slot) => [camel(slot), slot]));
  const isSnippet = (key: string, value: unknown): boolean => typeof value === "function" && slots.has(key);

  const hostAttributes = (props: Record<string, unknown>, live: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      const attribute = attributes.get(key);
      if (eventProps.has(key)) continue; // the action listens
      if (isSnippet(key, value)) continue; // rendered into its slot (FLO-325)
      if (attribute) {
        // Svelte writes a key the element has as a property; a shadowed
        // attribute (`checked`) shares its name with the live property, so
        // the browser gets it as an attribute from the action instead.
        if (attribute.shadowed && isBrowser) continue;
        result[attribute.name] = toAttribute(attribute.type, value);
      } else if (key !== "name" || form) {
        result[key] = value;
      }
    }
    if (!isBrowser) for (const [name, value] of serverDefaults(described, (p) => live[p])) result[name] ??= value;
    // Attachments (`{@attach}`) are symbol-keyed props: Svelte applies them
    // from the spread, which `Object.entries` does not see (FLO-325).
    for (const symbol of Object.getOwnPropertySymbols(props)) result[symbol as unknown as string] = props[symbol as unknown as string];
    return result;
  };

  const snippets = (props: Record<string, unknown>): Array<[string, Snippet]> =>
    Object.entries(props)
      .filter(([key, value]) => isSnippet(key, value))
      .map(([key, value]) => [slots.get(key) as string, value as Snippet]);

  const action: Action<HTMLElement, Binding> = (node, initial) => {
    let binding = initial;
    const target = node as unknown as Record<string, unknown>;

    const sync = (): void => {
      writeDefaults(node, described, (key) => binding.props[key]);
      writeLive(node, described, (property) => binding.live[property]);
    };

    sync();
    define({ prefix: getPrefix() });
    sync();

    const listeners = events.map((event) => {
      const listener = (e: Event): void => {
        const handler = binding.props[`on${event}`];
        if (typeof handler === "function") (handler as (e: Event) => void)(e);
        for (const property of properties) {
          const value = target[property];
          if (value !== binding.live[property]) binding.set[property]?.(value);
        }
      };
      node.addEventListener(event, listener);
      return (): void => node.removeEventListener(event, listener);
    });

    return {
      update(next: Binding) {
        binding = next;
        sync();
      },
      destroy() {
        listeners.forEach((remove) => remove());
      },
    };
  };

  return { tag: `${getPrefix()}-${spec.name}`, attributes: hostAttributes, snippets, action };
};

/** The runtime of the Svelte component for a declaration child; its parent registers the tag. */
export const declaration = (
  spec: DeclarationSpec
): { tag: string; attributes: (props: Record<string, unknown>) => Record<string, unknown> } => {
  const attributes = describeDeclaration(spec);
  return {
    tag: `${getPrefix()}-${spec.name}`,
    attributes: (props) => {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(props)) {
        const attribute = attributes.get(key);
        result[attribute ? attribute.name : key] = attribute ? toAttribute(attribute.type, value) : value;
      }
      return result;
    },
  };
};

/**
 * Installed only by `mtrl/ssr/svelte` on `Symbol.for("mtrl.ssr")`. Returns the
 * `<template shadowrootmode>` for one host, or `""` when the host opts out.
 */
export type SvelteShadowRenderer = (
  tag: string,
  attributes: Record<string, unknown>,
  children: Snippet | undefined,
  slots: Array<[slot: string, snippet: Snippet]>,
  prefix: string,
) => string;

/**
 * The declarative shadow template for a host, or `""` in the browser, when
 * `mtrl/ssr/svelte` was not imported, and when the element opts out of SSR.
 * Generated components emit it with `{#if shadow}{@html shadow}{/if}`.
 */
export const shadowMarkup = (
  runtime: Adapter,
  props: Record<string, unknown>,
  children: Snippet | undefined,
  live: Record<string, unknown>,
): string => {
  if (isBrowser) return "";
  const render = (globalThis as unknown as Record<symbol, { svelte?: SvelteShadowRenderer } | undefined>)[Symbol.for("mtrl.ssr")]?.svelte;
  if (!render) return "";
  return render(runtime.tag, runtime.attributes(props, live), children, runtime.snippets(props), getPrefix());
};
