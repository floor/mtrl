// src/elements/adapter.ts
/**
 * What every framework adapter shares: how a spec's attributes, live
 * properties and events become a framework's props, how values are written as
 * attributes, and the tag prefix. Framework-free; each adapter
 * (`src/react`, `src/vue`, …) builds on it.
 *
 * @module elements
 */

import {
  DEFAULT_PREFIX,
  type AttributeType,
  type DefineOptions,
  type ElementAttributes,
  type ElementProperties,
} from "./define";
import { usePreupgradePrefix } from "./styles";

/** The runtime parts of an element spec an adapter reads. */
export interface ComponentSpec {
  name: string;
  attributes?: Record<string, { type: AttributeType }>;
  properties?: Record<string, unknown>;
  events?: Record<string, unknown>;
  slot?: { attribute: string };
  slots?: readonly string[];
  form?: unknown;
  model?: string;
}

/** A declaration child (`<m-tab>`): attributes and children only, no behaviour. */
export interface DeclarationSpec {
  name: string;
  attributes: Record<string, { type: AttributeType }>;
}

export type Pascal<S extends string> = S extends `${infer H}-${infer T}` ? `${Capitalize<H>}${Pascal<T>}` : Capitalize<S>;

/** An attribute a live property shadows is set through `default<Name>`. */
export type DefaultProps<S> = {
  [K in keyof ElementProperties<S> & keyof ElementAttributes<S> & string as `default${Capitalize<K>}`]?: ElementAttributes<S>[K];
};

/**
 * Events a component had in 0.10 and 1.0 removed: the icon button's `toggle`.
 * The adapters refuse the matching handler prop (`onToggle`, `ontoggle`): its
 * type is a sentence, so the compiler's error says what to do. It would
 * otherwise fall through to the host's native handler of that name, compile,
 * and never fire when the button toggles. A 1.x migration guard, with no
 * run-time code: drop it in 2.0.
 */
export type RetiredEvents<S> = [S] extends [import("./icon-button").IconButtonSpec]
  ? [import("./icon-button").IconButtonSpec] extends [S] ? "toggle" : never
  : never;

/** A form-associated element takes `name`. */
export type FormProps<S> = S extends { form: unknown } ? { name?: string } : Record<never, never>;

/** The live property a framework's two-way binding (`v-model`, `bind:`) drives. */
export type ModelOf<S> = S extends { model: infer M extends keyof ElementProperties<S> & string } ? M : never;

export const camel = (name: string): string => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
export const pascal = (name: string): string => camel(name).replace(/^./, (c) => c.toUpperCase());

/**
 * An attribute value as a framework should render it. A present boolean is
 * `""`, which the element reads as true whether it arrives as an attribute or
 * as a property.
 */
export const toAttribute = (type: AttributeType, value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (type === "boolean") return value === false || value === "false" ? undefined : "";
  return String(value);
};

export interface AttributeProp {
  /** The attribute's name on the element. */
  name: string;
  type: AttributeType;
  /** A live property of the same name exists; this prop is its `default*`. */
  shadowed: boolean;
}

/** A spec, read once into the maps an adapter needs. */
export interface Described {
  /** Prop name (camelCase, or `default<Name>` when shadowed) to attribute. */
  attributes: Map<string, AttributeProp>;
  /** Live-state property names. */
  properties: string[];
  /** Event names, as the element dispatches them. */
  events: string[];
  /** The property two-way binding drives, if any. */
  model: string | undefined;
  form: boolean;
  /** Live property name to the attribute it shadows (`checked` → the `checked` attribute). */
  shadowedBy: Map<string, AttributeProp>;
  /** The named slots, as `slot="…"` names them (FLO-325). */
  slots: readonly string[];
}

export const describe = (spec: ComponentSpec): Described => {
  const properties = Object.keys(spec.properties ?? {});
  const attributes = new Map<string, AttributeProp>();
  for (const [name, attribute] of Object.entries(spec.attributes ?? {})) {
    const key = camel(name);
    const shadowed = properties.includes(key);
    attributes.set(shadowed ? `default${pascal(key)}` : key, { name, type: attribute.type, shadowed });
  }
  if (spec.slot) attributes.set(spec.slot.attribute, { name: spec.slot.attribute, type: "string", shadowed: false });
  const shadowedBy = new Map([...attributes.values()].filter((a) => a.shadowed).map((a) => [a.name, a]));
  return {
    attributes,
    properties,
    events: Object.keys(spec.events ?? {}),
    model: spec.model,
    form: !!spec.form,
    shadowedBy,
    slots: spec.slots ?? [],
  };
};

/**
 * Writes the attributes live properties shadow (`defaultChecked` → the
 * `checked` attribute) on the element. Frameworks would assign a same-named
 * prop to the live property, so every adapter writes these itself in the
 * browser. A prop that is not given leaves the attribute alone.
 */
export const writeDefaults = (element: HTMLElement, described: Described, read: (prop: string) => unknown): void => {
  for (const [key, attribute] of described.attributes) {
    if (!attribute.shadowed) continue;
    const raw = read(key);
    if (raw === undefined) continue;
    const value = toAttribute(attribute.type, raw);
    if (value === undefined) element.removeAttribute(attribute.name);
    else if (element.getAttribute(attribute.name) !== value) element.setAttribute(attribute.name, value);
  }
};

/** Writes live-state props to the element. A prop that is not given leaves the element's own state. */
export const writeLive = (element: HTMLElement, described: Described, read: (property: string) => unknown): void => {
  const target = element as unknown as Record<string, unknown>;
  for (const property of described.properties) {
    const value = read(property);
    if (value !== undefined && target[property] !== value) target[property] = value;
  }
};

/**
 * On the server a live value is the markup's default, so the page renders in
 * that state before it hydrates: the attribute each given live property
 * shadows, with its value.
 */
export const serverDefaults = (described: Described, read: (property: string) => unknown): Array<[string, string]> => {
  const result: Array<[string, string]> = [];
  for (const property of described.properties) {
    const attribute = described.shadowedBy.get(property);
    const value = attribute ? toAttribute(attribute.type, read(property)) : undefined;
    if (attribute && value !== undefined) result.push([attribute.name, value]);
  }
  return result;
};

export const describeDeclaration = (spec: DeclarationSpec): Map<string, AttributeProp> =>
  new Map(Object.entries(spec.attributes).map(([name, a]) => [camel(name), { name, type: a.type, shadowed: false }]));

let prefix = DEFAULT_PREFIX;

/** The tag prefix adapters render. */
export const getPrefix = (): string => prefix;

/** Sets the tag prefix every adapter renders. Call before the first render. */
export const configure = (options: DefineOptions): void => {
  prefix = options.prefix ?? DEFAULT_PREFIX;
  usePreupgradePrefix(prefix);
};

export const isBrowser = typeof window !== "undefined";
