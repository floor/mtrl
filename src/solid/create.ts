// src/solid/create.ts
/**
 * Solid components over the elements.
 *
 * `createComponent` renders the element's tag with `Dynamic`. Attributes are
 * props, rendered as attributes so server markup carries them; live-state
 * properties (`checked`, `value`) are props the component writes to the
 * element whenever they change; the attribute a live property shadows is its
 * `default*` prop. Element events are `on<Event>` callbacks. Props stay
 * reactive: every host attribute is a getter over the component's props. The
 * element registers on mount, never at import.
 *
 * Written without JSX, so it compiles with the rest of the library.
 *
 * When `mtrl/ssr/solid` is loaded, a server render prepends the declarative
 * shadow template. The client renders nothing in its place: the HTML parser
 * has already moved that template into the shadow root. Without the import
 * the markup is unchanged (FLO-374).
 *
 * @module solid
 */

import { createEffect, createMemo, mergeProps, onCleanup, onMount, splitProps, type Component, type JSX } from "solid-js";
import { Dynamic, isServer } from "solid-js/web";
import type { AttributeType, DefineOptions, ElementEvents, ElementProps, ElementSlotProp } from "../elements";
import {
  camel,
  describe,
  describeDeclaration,
  getPrefix,
  pascal,
  toAttribute,
  writeDefaults,
  writeLive,
  type ComponentSpec,
  type DeclarationSpec,
  type DefaultProps,
  type FormProps,
  type Pascal,
  type RetiredEvents,
} from "../elements/adapter";
import { shadow } from "./shadow";

export { configure } from "../elements/adapter";
export type { DefaultProps, FormProps } from "../elements/adapter";

/** `change` → `onChange`, typed with the element's event. */
export type EventProps<S> = {
  [K in keyof ElementEvents<S> & string as `on${Pascal<K>}`]?: (event: ElementEvents<S>[K]) => void;
};

type BaseProps<S> = ElementProps<S> & DefaultProps<S> & FormProps<S> & EventProps<S>;

/**
 * Each named slot as a prop taking JSX (`actions={<Button />}`), rendered
 * into a `<span slot="…">` the adapter owns; a text prop of the same name
 * (`headline`) takes its text or JSX (FLO-333).
 */
type SlotProps<S> = { [K in ElementSlotProp<S>]?: JSX.Element };

type OwnProps<S> = Omit<BaseProps<S>, ElementSlotProp<S>> & SlotProps<S>;

/**
 * Globals solid-js 1.8 leaves off `JSX.HTMLAttributes`: `popover` until 1.8.15,
 * `enterkeyhint` (typed on input and textarea only), and `nonce` (script and style
 * only; on `DOMAttributes` from 1.9). `enterKeyHint` is not a Solid prop name.
 * A release that already declares a key keeps its own type, including `popover`'s boolean.
 */
type SolidHostGaps = {
  popover?: "" | "auto" | "manual" | "hint";
  enterkeyhint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
  nonce?: string;
};

type Missing<Base, Extra> = {
  [K in Exclude<keyof Extra, keyof Base>]?: K extends keyof Extra ? Extra[K] : never;
};

/** `JSX.HTMLAttributes` for the host, plus globals a supported Solid 1.8 type omits. */
export type SolidHostAttributes<E extends HTMLElement = HTMLElement> =
  JSX.HTMLAttributes<E> & Missing<JSX.HTMLAttributes<E>, SolidHostGaps>;

/**
 * Props of a generated component: the element's own, plus any HTML attribute for the host.
 * `OwnProps` includes the element's `on*` handlers, so those names keep the component's event.
 */
export type SolidProps<S, E extends HTMLElement> = OwnProps<S> &
  Omit<SolidHostAttributes, keyof OwnProps<S> | "ref" | RetiredProps<S>> &
  { [K in RetiredProps<S>]?: `${K} was removed in 1.0: use onChange` } & {
    ref?: E | ((element: E) => void);
  };

/** The handler props of events 1.0 removed (`onToggle` on the icon button): refused, see `RetiredEvents`. */
type RetiredProps<S> = `on${Pascal<RetiredEvents<S>>}`;

export type DeclarationProps<A> = A & Omit<SolidHostAttributes, keyof A>;

/** A generated component. */
export type MComponent<S, E extends HTMLElement> = Component<SolidProps<S, E>>;

/** A generated declaration component. */
export type MDeclaration<A> = Component<DeclarationProps<A>>;

type Props = Record<string, unknown>;

/**
 * A value as Solid should render it on the host. Solid's server renderer
 * treats `checked`, `disabled` and the like as boolean attributes and drops a
 * falsy value, so a present boolean is `true` here, not the `""` other
 * adapters use.
 */
const toHost = (type: AttributeType, value: unknown): unknown => {
  const attribute = toAttribute(type, value);
  return type === "boolean" && attribute !== undefined ? true : attribute;
};

/**
 * The Solid component for an element.
 * @param spec - The element's spec (`switchElement.spec`)
 * @param define - Registers the element and anything it needs (`defineSwitch`)
 * @param _name - Unused: Solid components have no display name. Kept so every
 *   adapter's generated list has the same shape.
 */
export const createComponent = <S, E extends HTMLElement>(
  spec: ComponentSpec,
  define: (options?: DefineOptions) => string,
  _name?: string
): MComponent<S, E> => {
  const described = describe(spec);
  const { attributes, properties, events, form } = described;
  const eventProps = events.map((event) => `on${pascal(event)}`);
  const slots = described.slots.map((slot) => [camel(slot), slot] as const);
  const slotKeys = new Set(slots.map(([key]) => key));
  const own = [...new Set([...attributes.keys(), ...properties, ...eventProps, ...slotKeys, ...(form ? ["name"] : []), "ref", "children"])];

  const component = (props: Props): JSX.Element => {
    const [, others] = splitProps(props, own);
    let element: E | undefined;
    // Each slot prop read once: reading JSX creates its nodes, and the
    // attribute and the children both look at it (hydration keys must match).
    const slotted = new Map(slots.map(([key]) => [key, createMemo(() => props[key])]));

    // Every host attribute is a getter, so Solid keeps it reactive.
    const host: Props = {};
    for (const [key, attribute] of attributes) {
      // Solid writes a key the element has as a property; a shadowed attribute
      // (`checked`) shares its name with the live property, so the browser
      // gets it as an attribute from the effect below instead.
      if (attribute.shadowed && !isServer) continue;
      Object.defineProperty(host, attribute.name, {
        enumerable: true,
        get: () => {
          const value = slotted.get(key)?.() ?? props[key];
          // Nodes for the same-named slot are not the attribute's text.
          if (slotKeys.has(key) && value != null && typeof value !== "string") return undefined;
          if (value === undefined && attribute.shadowed) {
            // On the server a live value is the markup's default, so the page
            // renders in that state before it hydrates.
            return toHost(attribute.type, props[attribute.name]);
          }
          return toHost(attribute.type, value);
        },
      });
    }
    if (form) Object.defineProperty(host, "name", { enumerable: true, get: () => props.name });
    // The default slot's children, then a `<span slot="…">` per named slot
    // given nodes (text for a same-named attribute stays the attribute).
    // Each wrapper is its own memo, rebuilt only when its slot's prop
    // changes, not when the default slot's children do (FLO-334).
    const wrappers = slots.map(([key, slot]) =>
      createMemo(() => {
        const value = slotted.get(key)?.();
        if (value == null || value === false || (attributes.has(key) && typeof value === "string")) return null;
        return Dynamic({ component: "span", slot, style: "display: contents", children: value } as never);
      }));
    // Attributes the shadow renderer reads. Slot nodes stay out: a component
    // in a slot is not the attribute's text.
    const shadowAttributes = (): Record<string, unknown> => {
      const snapshot: Record<string, unknown> = {};
      const take = (source: object): void => {
        for (const key of Object.keys(source)) {
          if (key === "children" || key === "ref" || key === "component") continue;
          const value = (source as Props)[key];
          if (typeof value === "function" || value === undefined) continue;
          snapshot[key] = value;
        }
      };
      take(host);
      take(others);
      return snapshot;
    };
    const tag = `${getPrefix()}-${spec.name}`;
    Object.defineProperty(host, "children", {
      enumerable: true,
      get: () => {
        const named = wrappers.map((wrapper) => wrapper()).filter((wrapper) => wrapper !== null);
        const body = (named.length ? [props.children, ...named] : props.children) as JSX.Element;
        // Render children once in the page's owner and hydration context. The
        // server hook serializes this same body for both light and shadow DOM.
        return isServer ? shadow(tag, shadowAttributes(), body) : body;
      },
    });

    const ref = (node: E): void => {
      element = node;
      const forwarded = props.ref;
      if (typeof forwarded === "function") (forwarded as (el: E) => void)(node);
    };

    const sync = (): void => {
      if (!element) return;
      writeDefaults(element, described, (key) => props[key]);
      writeLive(element, described, (property) => props[property]);
    };

    onMount(() => {
      const el = element;
      if (!el) return;
      sync();
      define({ prefix: getPrefix() });
      sync();
      for (const event of events) {
        const listener = (e: Event): void => {
          const handler = props[`on${pascal(event)}`];
          if (typeof handler === "function") (handler as (e: Event) => void)(e);
        };
        el.addEventListener(event, listener);
        onCleanup(() => el.removeEventListener(event, listener));
      }
    });
    // Reads every live prop and default, so it reruns when one changes.
    createEffect(sync);

    return Dynamic(mergeProps(others, host, { component: `${getPrefix()}-${spec.name}`, ref }) as never);
  };
  return component as unknown as MComponent<S, E>;
};

/** The Solid component for a declaration child; its parent registers the tag. */
export const createDeclaration = <A>(spec: DeclarationSpec, _name?: string): MDeclaration<A> => {
  const attributes = describeDeclaration(spec);
  const component = (props: Props): JSX.Element => {
    const [, others] = splitProps(props, [...attributes.keys()]);
    const host: Props = {};
    for (const [key, attribute] of attributes) {
      Object.defineProperty(host, attribute.name, {
        enumerable: true,
        get: () => toHost(attribute.type, props[key]),
      });
    }
    return Dynamic(mergeProps(others, host, { component: `${getPrefix()}-${spec.name}` }) as never);
  };
  return component as unknown as MDeclaration<A>;
};
