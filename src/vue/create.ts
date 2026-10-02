// src/vue/create.ts
/**
 * Vue components over the elements.
 *
 * `createComponent` renders the element's tag. Attributes are props, rendered
 * as attributes so server markup carries them; live-state properties
 * (`checked`, `value`) are props the component writes to the element, with
 * `update:<name>` events so `v-model:checked` works, and the spec's model
 * property doubles as `modelValue` so plain `v-model` works; the attribute a
 * live property shadows is its `default*` prop. Element events are Vue events
 * of the same name. The element registers on mount, never at import.
 *
 * When `mtrl/ssr/vue` is loaded, a server render emits the declarative shadow
 * template and the light DOM from a single pass over the slots, including an
 * `async setup()` child under Suspense. The client renders the slots and not
 * the template: the HTML parser has already moved that template into the
 * shadow root. Without the import the markup is unchanged (FLO-373).
 *
 * @module vue
 */

import {
  createStaticVNode,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  cloneVNode,
  Comment,
  Fragment,
  Text,
  type DefineSetupFnComponent,
  type FunctionalComponent,
  type Slots,
  type SlotsType,
  type HTMLAttributes,
  type VNode,
  type VNodeChild,
} from "vue";
import type { DefineOptions, ElementEvents, ElementProperties, ElementProps, ElementSlots } from "../elements";
import {
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
  type ModelOf,
  type RetiredEvents,
} from "../elements/adapter";
import { shadow } from "./shadow";

export { configure } from "../elements/adapter";

/** `modelValue` for the spec's model property, so plain `v-model` binds it. */
export type ModelProps<S> = [ModelOf<S>] extends [never]
  ? Record<never, never>
  : { modelValue?: ElementProperties<S>[ModelOf<S>] };

type OwnProps<S> = ElementProps<S> & DefaultProps<S> & FormProps<S> & ModelProps<S>;

type EnterKeyHint = "enter" | "done" | "go" | "next" | "previous" | "search" | "send";

/**
 * Globals Vue's `HTMLAttributes` omits. `popover` is absent through 3.5.
 * `enterkeyhint` and `enterKeyHint` arrive on that interface in 3.5 (3.4 types
 * the camelCase name on input only). `nonce` is typed on script, style and link.
 * `inputmode` and `itemprop` are the Vue names (`inputMode` and `itemProp` are not).
 * A release that already declares a key keeps its own type.
 */
type VueHostGaps = {
  popover?: "" | "auto" | "manual" | "hint";
  enterkeyhint?: EnterKeyHint;
  enterKeyHint?: EnterKeyHint;
  nonce?: string;
};

type Missing<Base, Extra> = {
  [K in Exclude<keyof Extra, keyof Base>]?: K extends keyof Extra ? Extra[K] : never;
};

/** `HTMLAttributes` for the host, plus globals a supported Vue release omits. */
type VueHostAttributes = HTMLAttributes & Missing<HTMLAttributes, VueHostGaps>;

/**
 * `on…` names Vue builds from this component's emits (`change` → `onChange`).
 * Vue intersects those with the declared props, so a host handler of the same
 * name would meet the component's and the parameter would become
 * `Event | CustomEvent`. Dropping them leaves the emit's handler.
 * `onUpdate:*` is the `v-model` family. Vue's attributes do not declare it;
 * omitting it keeps a later collision from intersecting the binding callback.
 */
type EventKeys<S> =
  | `on${Capitalize<keyof ElementEvents<S> & string>}`
  | `onUpdate:${keyof ElementProperties<S> & string}`
  | ([ModelOf<S>] extends [never] ? never : "onUpdate:modelValue");

/** Props of a generated component: the element's own, plus any HTML attribute for the host. */
export type VueProps<S> = OwnProps<S> &
  Omit<VueHostAttributes, keyof OwnProps<S> | EventKeys<S> | RetiredProps<S>> &
  { [K in RetiredProps<S>]?: `${K} was removed in 1.0: use onChange` };

/** The handler props of events 1.0 removed (`onToggle` on the icon button): refused, see `RetiredEvents`. */
type RetiredProps<S> = `on${Capitalize<RetiredEvents<S>>}`;

/** Its events: the element's, and `update:*` for two-way binding. */
export type VueEmits<S> = {
  [K in keyof ElementEvents<S> & string]: (event: ElementEvents<S>[K]) => true;
} & {
  [K in keyof ElementProperties<S> & string as `update:${K}`]: (value: NonNullable<ElementProperties<S>[K]>) => true;
} & ([ModelOf<S>] extends [never]
    ? Record<never, never>
    : { "update:modelValue": (value: NonNullable<ElementProperties<S>[ModelOf<S>]>) => true });

/**
 * What a generated component's template ref exposes besides Vue's instance:
 * `ref<InstanceType<typeof MSwitch> & Exposed<SwitchElement>>()`.
 */
export interface Exposed<E extends HTMLElement> {
  readonly element: E | null;
}

/**
 * A generated component; named so declarations stay short. `_E` is the
 * element its template ref exposes as `element` (see `Exposed`).
 */
export type MComponent<S, _E extends HTMLElement> = DefineSetupFnComponent<VueProps<S>, VueEmits<S>, VueSlots<S>>;

/** Its slots: the default one, and each named slot the element reads (`<template #actions>`, FLO-325). */
export type VueSlots<S> = SlotsType<{ default?: () => VNodeChild } & { [K in ElementSlots<S>]?: () => VNodeChild }>;

/** A named slot's nodes, each carrying `slot="<name>"` for the element; text is wrapped to carry it. */
const tag = (nodes: VNode[], slot: string): VNode[] =>
  nodes.flatMap((node) => {
    if (node.type === Fragment) return tag(node.children as VNode[], slot);
    if (node.type === Comment) return [];
    if (node.type === Text) return [h("span", { slot, style: "display: contents" }, node.children as string)];
    return [cloneVNode(node, { slot })];
  });

/** The default slot's nodes, then every named slot's, tagged (FLO-325). */
const slotted = (slots: Slots): VNode[] => [
  ...(slots.default?.() ?? []),
  ...Object.entries(slots).flatMap(([name, render]) =>
    name === "default" || name.startsWith("_") || typeof render !== "function" ? [] : tag(render(), name)),
];

/** A generated declaration component: its attributes, plus any HTML attribute for the host. */
export type MDeclaration<A> = FunctionalComponent<A & Omit<VueHostAttributes, keyof A>>;

const accept = (): true => true;

/**
 * The Vue component for an element.
 * @param spec - The element's spec (`switchElement.spec`)
 * @param define - Registers the element and anything it needs (`defineSwitch`)
 */
export const createComponent = <S, E extends HTMLElement>(
  spec: ComponentSpec,
  define: (options?: DefineOptions) => string,
  name: string
): MComponent<S, E> => {
  const described = describe(spec);
  const { attributes, properties, events, model, form } = described;
  const props = [...attributes.keys(), ...properties, ...(model ? ["modelValue"] : []), ...(form ? ["name"] : [])];
  const emits = Object.fromEntries(
    [...events, ...properties.map((p) => `update:${p}`), ...(model ? ["update:modelValue"] : [])].map((e) => [e, accept])
  );

  const component = defineComponent(
    (raw: Record<string, unknown>, { emit, slots, expose, attrs }) => {
      const props = raw;
      const element = ref<E | null>(null);
      expose({
        get element() {
          return element.value;
        },
      });

      /** A live property's value from its props: `modelValue` stands in for the model property. */
      const live = (property: string): unknown =>
        property === model && props.modelValue !== undefined ? props.modelValue : props[property];

      const host = (): Record<string, unknown> => {
        const result: Record<string, unknown> = { ref: element };
        for (const [key, attribute] of attributes) {
          const value = toAttribute(attribute.type, props[key]);
          // Vue writes a key the element has as a property; a shadowed
          // attribute (`checked`) shares its name with the live property, so
          // the browser gets it as an attribute below instead.
          if (attribute.shadowed && isBrowser) continue;
          result[attribute.name] = value;
        }
        if (!isBrowser) for (const [name, value] of serverDefaults(described, live)) result[name] ??= value;
        if (form && props.name !== undefined) result.name = props.name;
        return result;
      };

      const sync = (): void => {
        const el = element.value;
        if (!el) return;
        writeDefaults(el, described, (key) => props[key]);
        writeLive(el, described, live);
      };

      const listeners: Array<() => void> = [];
      onMounted(() => {
        const el = element.value;
        if (!el) return;
        sync();
        define({ prefix: getPrefix() });
        sync();
        for (const event of events) {
          const listener = (e: Event): void => {
            emit(event, e);
            const target = el as unknown as Record<string, unknown>;
            for (const property of properties) {
              const value = target[property];
              if (value !== live(property)) {
                emit(`update:${property}`, value);
                if (property === model) emit("update:modelValue", value);
              }
            }
          };
          el.addEventListener(event, listener);
          listeners.push(() => el.removeEventListener(event, listener));
        }
      });
      onUpdated(sync);
      onBeforeUnmount(() => listeners.splice(0).forEach((remove) => remove()));

      const tag = (): string => `${getPrefix()}-${spec.name}`;
      // Fallthrough (`id`, `class`, `style`) is not in `host()`. The shadow
      // string needs it; the page vnode still inherits it from Vue.
      const shadowProps = (): Record<string, unknown> => {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(host())) {
          if (key === "ref" || typeof value === "function" || value === undefined) continue;
          result[key] = value;
        }
        for (const [key, value] of Object.entries(attrs)) {
          if (key === "ref" || typeof value === "function" || value === undefined || Object.prototype.hasOwnProperty.call(result, key)) continue;
          result[key] = value;
        }
        return result;
      };

      return () => {
        const nodes = slotted(slots);
        // Unregistered, or in the browser, this is "" and the vnode children
        // stay `nodes`. The parser consumes a template, so the client must not
        // render one of its own. On the server the bridge has already rendered
        // `nodes` once; rendering them again would run an async child twice.
        const inner = isBrowser ? "" : shadow(tag(), shadowProps(), () => nodes);
        if (typeof inner !== "string") {
          // A promise is an object, and Vue would treat it as a slot. The
          // static vnode pushes its children straight into the SSR buffer.
          const held = createStaticVNode("", 1);
          held.children = inner as unknown as string;
          return h(tag(), host(), [held]);
        }
        if (inner) return h(tag(), host(), [createStaticVNode(inner, 1)]);
        return h(tag(), host(), nodes);
      };
    },
    { name, props, emits }
  );
  return component as unknown as MComponent<S, E>;
};

/** The Vue component for a declaration child; its parent registers the tag. */
export const createDeclaration = <A>(spec: DeclarationSpec, name: string): MDeclaration<A> => {
  const attributes = describeDeclaration(spec);
  const component: FunctionalComponent<A> = (props, { slots, attrs }) => {
    const host: Record<string, unknown> = { ...attrs };
    for (const [key, value] of Object.entries(props as Record<string, unknown>)) {
      const attribute = attributes.get(key);
      if (attribute) host[attribute.name] = toAttribute(attribute.type, value);
    }
    return h(`${getPrefix()}-${spec.name}`, host, slots.default?.());
  };
  component.displayName = name;
  component.props = [...attributes.keys()] as unknown as FunctionalComponent<A>["props"];
  // Declared props stay the element's attributes. Everything else, including
  // a host HTML attribute, arrives in `attrs` and is copied onto the element.
  return component as unknown as MDeclaration<A>;
};
