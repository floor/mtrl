// src/react/create.ts
"use client";
/**
 * React components over the elements.
 *
 * `createComponent` renders the element's tag and keeps React's model:
 * attributes are passed as attributes, so server-rendered markup carries them;
 * live-state properties (`checked`, `value`) are set on the element after each
 * render, and are controlled when given, like React's own inputs; the
 * attribute they shadow is the `default*` prop. Events are typed `on*`
 * callbacks. The element is registered on first mount, never at import.
 *
 * Works the same on React 18 and 19: the component sets properties and
 * attaches listeners itself rather than relying on React 19's custom element
 * support.
 *
 * @module react
 */

import * as React from "react";
import { shadow } from "./shadow";
import type { DefineOptions, ElementEvents, ElementProps, ElementSlotProp } from "../elements";
import {
  camel,
  describe,
  describeDeclaration,
  getPrefix,
  isBrowser,
  pascal,
  serverDefaults,
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

export { configure } from "../elements/adapter";
export type { DefaultProps, FormProps } from "../elements/adapter";

/** `change` → `onChange`, typed with the element's event. */
export type EventProps<S> = {
  [K in keyof ElementEvents<S> & string as `on${Pascal<K>}`]?: (event: ElementEvents<S>[K]) => void;
};

type BaseProps<S> = ElementProps<S> & DefaultProps<S> & EventProps<S>;

/**
 * Each named slot as a prop taking nodes (`actions={<Button />}`), rendered
 * into a `<span slot="…">` the adapter owns; a text prop of the same name
 * (`headline`) takes its text or nodes (FLO-333).
 */
type SlotProps<S> = { [K in ElementSlotProp<S>]?: React.ReactNode };

type OwnProps<S> = Omit<BaseProps<S>, ElementSlotProp<S>> & SlotProps<S>;

/**
 * `@types/react` 18's `HTMLAttributes` has no `popover` through 18.3.31.
 * `enterKeyHint` joins that interface in 18.3.31; earlier 18 types it on inputs.
 * `nonce` is absent on 18.0.0 and present by 18.0.28.
 * A release that already declares a key keeps its own type.
 */
type ReactHostGaps = {
  popover?: "" | "auto" | "manual" | "hint";
  enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send";
  nonce?: string;
};

type Missing<Base, Extra> = {
  [K in Exclude<keyof Extra, keyof Base>]?: K extends keyof Extra ? Extra[K] : never;
};

/** `HTMLAttributes` for the host, plus globals a supported React 18 type omits. */
export type ReactHostAttributes<E extends HTMLElement = HTMLElement> =
  React.HTMLAttributes<E> & Missing<React.HTMLAttributes<E>, ReactHostGaps>;

/**
 * Props of a generated component: the element's own, plus any HTML attribute for the host.
 * `OwnProps` includes the element's `on*` handlers, so those names keep the component's event.
 */
export type ComponentProps<S> = OwnProps<S> &
  FormProps<S> &
  Omit<ReactHostAttributes, keyof OwnProps<S> | RetiredProps<S>> &
  { [K in RetiredProps<S>]?: `${K} was removed in 1.0: use onChange` } & { children?: React.ReactNode };

/** The handler props of events 1.0 removed (`onToggle` on the icon button): refused, see `RetiredEvents`. */
type RetiredProps<S> = `on${Pascal<RetiredEvents<S>>}`;

/** A generated component; named so declarations stay short. */
export type MComponent<S, E extends HTMLElement> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<ComponentProps<S>> & React.RefAttributes<E>
>;

const useIsomorphicLayoutEffect = isBrowser ? React.useLayoutEffect : React.useEffect;

const assignRef = <E>(ref: React.ForwardedRef<E>, value: E | null): void => {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
};

/**
 * The React component for an element.
 * @param spec - The element's spec (`switchElement.spec`)
 * @param define - Registers the element and anything it needs (`defineSwitch`)
 */
export const createComponent = <S, E extends HTMLElement>(
  spec: ComponentSpec,
  define: (options?: DefineOptions) => string,
  displayName: string
): MComponent<S, E> => {
  const described = describe(spec);
  const properties = new Set(described.properties);
  const attributes = described.attributes;
  const events = new Map(described.events.map((event) => [`on${pascal(event)}`, event]));
  const slots = new Map(described.slots.map((slot) => [camel(slot), slot]));

  const Component = React.forwardRef<E, ComponentProps<S>>((props, forwardedRef) => {
    const element = React.useRef<E | null>(null);
    const host: Record<string, unknown> = {};
    const live: Record<string, unknown> = {};
    const handlers: Record<string, (event: Event) => void> = {};
    const named: React.ReactNode[] = [];
    for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
      const event = events.get(key);
      const attribute = attributes.get(key);
      const slot = slots.get(key);
      // A named slot's nodes, unless it is text for the same-named attribute.
      if (slot !== undefined && !(attribute && typeof value === "string")) {
        if (value != null && value !== false) {
          named.push(React.createElement("span", { key: slot, slot, style: { display: "contents" } }, value as React.ReactNode));
        }
        continue;
      }
      if (event) {
        if (typeof value === "function") handlers[event] = value as (event: Event) => void;
      } else if (properties.has(key)) {
        live[key] = value;
      } else if (attribute?.shadowed) {
        // React 19 assigns a prop to a same-named element property in the
        // browser, which here is the live state (`checked`), not the default.
        // The server renders the attribute; the browser writes it below.
        if (!isBrowser) host[attribute.name] = toAttribute(attribute.type, value);
      } else if (attribute) {
        host[attribute.name] = toAttribute(attribute.type, value);
      } else if (key === "className") {
        // React 18 renders className on a custom element as a literal
        // `className` attribute; React 19 as `class`. Pass `class` to both.
        host.class = value;
      } else {
        host[key] = value;
      }
    }

    if (!isBrowser) {
      for (const [name, value] of serverDefaults(described, (property) => live[property])) host[name] ??= value;
    }

    // The latest handlers and controlled values, read by listeners that are
    // attached once.
    const latest = React.useRef({ handlers, live });
    useIsomorphicLayoutEffect(() => {
      latest.current = { handlers, live };
    });

    // Defaults first, so an element upgraded by define() is created from them.
    useIsomorphicLayoutEffect(() => {
      if (element.current) writeDefaults(element.current, described, (key) => (props as Record<string, unknown>)[key]);
    });

    useIsomorphicLayoutEffect(() => {
      define({ prefix: getPrefix() });
    }, []);

    // Controlled properties follow their props after every render.
    useIsomorphicLayoutEffect(() => {
      if (element.current) writeLive(element.current, described, (property) => live[property]);
    });

    React.useEffect(() => {
      const el = element.current;
      if (!el) return;
      const listeners = [...new Set(events.values())].map((event) => {
        const listener = (e: Event): void => {
          latest.current.handlers[event]?.(e);
          // Controlled: if the handler did not change the prop, put it back,
          // as React does for <input checked>. React flushes a state update
          // from the handler before this microtask runs.
          queueMicrotask(() => {
            if (element.current) writeLive(element.current, described, (property) => latest.current.live[property]);
          });
        };
        el.addEventListener(event, listener);
        return (): void => el.removeEventListener(event, listener);
      });
      return () => listeners.forEach((remove) => remove());
    }, []);

    const ref = React.useCallback(
      (node: E | null) => {
        element.current = node;
        assignRef(forwardedRef, node);
      },
      [forwardedRef]
    );

    // `children` to the default slot, then each named slot's wrapper.
    const { children, ...attributesAndProps } = host;
    const tag = `${getPrefix()}-${spec.name}`;
    return React.createElement(tag, { ...attributesAndProps, ref },
      shadow(tag, attributesAndProps, React.createElement(React.Fragment, null, children as React.ReactNode, ...named)),
      children as React.ReactNode, ...named);
  });
  Component.displayName = displayName;
  return Component as MComponent<S, E>;
};

export type DeclarationProps<A> = A & Omit<ReactHostAttributes, keyof A> & { children?: React.ReactNode };

/** A generated declaration component. */
export type MDeclaration<A> = React.ForwardRefExoticComponent<
  React.PropsWithoutRef<DeclarationProps<A>> & React.RefAttributes<HTMLElement>
>;

/** The React component for a declaration child; its parent registers the tag. */
export const createDeclaration = <A>(
  spec: DeclarationSpec,
  displayName: string
): MDeclaration<A> => {
  const attributes = describeDeclaration(spec);
  const Component = React.forwardRef<HTMLElement, DeclarationProps<A>>((props, ref) => {
    const host: Record<string, unknown> = { ref };
    for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
      const attribute = attributes.get(key);
      const name = attribute ? attribute.name : key === "className" ? "class" : key;
      host[name] = attribute ? toAttribute(attribute.type, value) : value;
    }
    return React.createElement(`${getPrefix()}-${spec.name}`, host);
  });
  Component.displayName = displayName;
  return Component as MDeclaration<A>;
};
