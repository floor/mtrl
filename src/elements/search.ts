// src/elements/search.ts
/**
 * `<m-search>` with `<m-search-suggestion>` children: the search as a
 * form-associated custom element.
 *
 * Each `<m-search-suggestion>` declares one suggestion: `value`, its text (or
 * `label`), `icon` and `group` (a divider separates groups). The search reads
 * them into the factory's suggestions and redraws the list in place when they
 * change, in one pass per batch of changes: an app replacing them as the user
 * types gets one redraw, and none when they come back the same.
 *
 * The `value` attribute is the default query and the `value` property the
 * live one, as on a native input: the attribute moves the value until the
 * user or script changes it, and a form reset returns to it. The value is
 * submitted under the host's `name`.
 *
 * Events: `input` as the query changes (typing, and the clear button or
 * Escape emptying it), `change` when it is submitted (Enter), `select` when a
 * suggestion is chosen, `open` and `close` as the view opens and closes, and
 * `action` on a click of the trailing icon or the avatar. Enter on a
 * highlighted suggestion is the selection only.
 *
 * The open view is the factory's: in the top layer, docked (a popover over a
 * scrim) or full screen (a modal dialog), inside the element's shadow root.
 * `open` shows it and reflects its state; `show()` and `close()` are its
 * methods, as on `<m-dialog>`. `focus()` focuses the input, which opens the
 * view as a click does.
 *
 * `leading-icon`, `trailing-icon`, `avatar` and their labels have no setter
 * on the search: changing one recreates it, keeping the value.
 *
 * Parts: `search`, `surface`, `container`, `leading-icon`, `input`, `clear-button`, `trailing`,
 * `divider`, `content`, `suggestions`, `status`, among others.
 *
 * @module elements
 */

import createSearch from "../components/search";
import type {
  SearchComponent, SearchConfig, SearchEvent, SearchEventType, SearchSuggestion, SearchTrailingItem,
} from "../components/search/types";
import { PREFIX } from "../core/config";
import {
  createDeclarationClass, defineElement, DEFAULT_PREFIX, type AttributeValue, type Config, type DefineOptions, type ElementAttributes,
  type ElementInstance, type ElementSpec,
} from "./define";

type Handler = (event: SearchEvent) => void;

/** The search, with the element's events, methods and input. */
export interface SearchElementComponent extends Omit<SearchComponent, "on" | "off"> {
  /**
   * Subscribes by the element's event names (`open`, `select`…) as well as the factory's.
   * In `material` 3.0.0 `on` and `off` take a closed map of those names: any other name is a type error.
   */
  on: (event: string, handler: Handler) => SearchElementComponent;
  off: (event: string, handler: Handler) => SearchElementComponent;
  /** Opens the view. */
  show: () => SearchElementComponent;
  /** Closes the view. */
  close: () => SearchElementComponent;
  /** The combobox. */
  input: HTMLInputElement;
}

interface SearchElementConfig extends SearchConfig {
  open?: boolean;
  widthMin?: AttributeValue;
  widthMax?: AttributeValue;
  noClearButton?: boolean;
  noExpandOnFocus?: boolean;
  noCollapseOnBlur?: boolean;
  ariaLabel?: string;
  trailingIcon?: string;
  trailingLabel?: string;
  avatar?: string;
  avatarLabel?: string;
}

/** The factory's events each element event is made of. */
const ALIASES: Record<string, readonly SearchEventType[]> = {
  // The factory emits `input` when the clear button or Escape empties the
  // query as well (FLO-291).
  input: ["input"],
  change: ["submit"],
  select: ["suggestionSelect"],
  open: ["expand"],
  close: ["collapse"],
};

const declaredSuggestions = (host: HTMLElement): SearchSuggestion[] => {
  const suggestionTag = `${host.localName}-suggestion`;
  const suggestions: SearchSuggestion[] = [];
  for (const child of Array.from(host.children)) {
    if (child.localName !== suggestionTag) continue;
    const text = child.getAttribute("label") ?? (child.textContent ?? "").trim();
    suggestions.push({
      text,
      value: child.getAttribute("value") ?? text,
      icon: child.getAttribute("icon") ?? undefined,
      group: child.getAttribute("group") ?? undefined,
    });
  }
  return suggestions;
};

/** The suggestions last applied to each search. */
const applied = new WeakMap<SearchElementComponent, string>();

/**
 * `min-width` / `max-width`: a number of pixels or a CSS length, on the custom
 * property the factory's minWidth / maxWidth set (FLO-290). Removed, the
 * stylesheet's M3 360 and 720dp apply.
 */
const setWidth = (c: SearchComponent, edge: "min" | "max", value: AttributeValue | undefined): void => {
  const name = `--${PREFIX}-search-${edge}-width`;
  if (value === null || value === undefined || value === "") c.element.style.removeProperty(name);
  else c.element.style.setProperty(name, /^\d+(\.\d+)?$/.test(String(value)) ? `${value}px` : String(value));
};

const create = (config: SearchElementConfig): SearchElementComponent => {
  const { open, ariaLabel, trailingIcon, trailingLabel, avatar, avatarLabel, widthMin, widthMax, noClearButton, noExpandOnFocus, noCollapseOnBlur, ...rest } = config;
  const trailingItems: SearchTrailingItem[] = [];
  if (trailingIcon) trailingItems.push({ id: "trailing-icon", type: "icon", content: trailingIcon, ariaLabel: trailingLabel });
  // The avatar is an action here (`action`), so a button: the factory draws an
  // avatar with onClick as one, and one without as an image out of the tab
  // order (FLO-291). The click itself is handled by `action` in setup.
  if (avatar) trailingItems.push({ id: "avatar", type: "avatar", content: avatar, ariaLabel: avatarLabel, onClick: () => {} });
  // A button needs a name, and none is invented for it.
  if (avatar && !avatarLabel) console.warn("[mtrl] search: an avatar without avatar-label is a button with no accessible name.");
  const search = createSearch({
    ...rest,
    // The `no-` attributes turn the factory's defaults off (#263).
    showClearButton: !noClearButton,
    expandOnFocus: !noExpandOnFocus,
    collapseOnBlur: !noCollapseOnBlur,
    ...(open ? { initialState: "view" } : {}),
    ...(trailingItems.length ? { trailingItems } : {}),
  });
  if (widthMin !== undefined) setWidth(search, "min", widthMin);
  if (widthMax !== undefined) setWidth(search, "max", widthMax);
  const input = search.element.querySelector("input") as HTMLInputElement;
  // The factory takes no aria-label: the placeholder names the combobox.
  if (ariaLabel) input.setAttribute("aria-label", ariaLabel);

  const { on, off } = search;
  const component: SearchElementComponent = Object.assign(search, {
    input,
    show: () => {
      search.expand();
      return component;
    },
    close: () => {
      search.collapse();
      return component;
    },
    on: (event: string, handler: Handler) => {
      for (const name of ALIASES[event] ?? [event]) on(name as SearchEventType, handler);
      return component;
    },
    off: (event: string, handler: Handler) => {
      for (const name of ALIASES[event] ?? [event]) off(name as SearchEventType, handler);
      return component;
    },
  });
  applied.set(component, JSON.stringify(search.getSuggestions()));
  return component;
};

/** Applies the declared suggestions in place, redrawing the list only when they changed. */
const updateSuggestions = (host: HTMLElement, c: SearchElementComponent): boolean => {
  const suggestions = declaredSuggestions(host);
  const key = JSON.stringify(suggestions);
  if (applied.get(c) !== key) {
    applied.set(c, key);
    c.setSuggestions(suggestions);
  }
  return true;
};

const setValue = (c: SearchElementComponent, value: unknown): void => void c.setValue(String(value ?? ""), false);

const setDisabled = (c: SearchElementComponent, disabled: boolean): void => {
  if (disabled) c.collapse().disable();
  else c.enable();
};

const setOpen = (c: SearchElementComponent, open: boolean): void => {
  if (open !== c.isExpanded()) void (open ? c.expand() : c.collapse());
};

const searchSpec = {
  name: "search",
  create: (config) => create(config as SearchElementConfig),
  styles: ["search"],
  // A block, as the bar fills its container between its minimum and maximum
  // widths.
  hostStyles: ":host{display:block}",
  attributes: {
    placeholder: {
      type: "string",
      config: "placeholder",
      update: (c, v, host) => {
        // The factory names the combobox after its placeholder: aria-label wins.
        c.setPlaceholder(v === null ? "Search" : String(v));
        const label = host.getAttribute("aria-label");
        if (label !== null) c.input.setAttribute("aria-label", label);
      },
    },
    // The default value; not called once the element is dirty.
    value: { type: "string", config: "value", update: (c, v) => setValue(c, v) },
    variant: {
      type: "string",
      config: "variant",
      update: (c, v) => void c.setVariant(v === "divided" ? "divided" : "contained"),
    },
    "view-mode": {
      type: "string",
      config: "viewMode",
      update: (c, v) => void c.setViewMode(v === "fullscreen" ? "fullscreen" : "docked"),
    },
    // #263: the width range, in place; the `no-` switches recreate the search.
    "min-width": { type: "string", config: "widthMin", update: (c, v) => setWidth(c, "min", v) },
    "max-width": { type: "string", config: "widthMax", update: (c, v) => setWidth(c, "max", v) },
    "no-clear-button": { type: "boolean", config: "noClearButton" },
    "no-expand-on-focus": { type: "boolean", config: "noExpandOnFocus" },
    "no-collapse-on-blur": { type: "boolean", config: "noCollapseOnBlur" },
    "full-width": {
      type: "boolean",
      config: "fullWidth",
      update: (c, v) => void c.element.classList.toggle(`${PREFIX}-search--full-width`, !!v),
    },
    "leading-icon": { type: "string", config: "leadingIcon" },
    "trailing-icon": { type: "string", config: "trailingIcon" },
    "trailing-label": { type: "string", config: "trailingLabel" },
    avatar: { type: "string", config: "avatar" },
    "avatar-label": { type: "string", config: "avatarLabel" },
    open: { type: "boolean", config: "open", update: (c, v) => setOpen(c, !!v) },
    disabled: { type: "boolean", config: "disabled", update: (c, v) => setDisabled(c, !!v) },
    "aria-label": {
      type: "string",
      config: "ariaLabel",
      update: (c, v) => c.input.setAttribute("aria-label", v === null ? c.getPlaceholder() : String(v)),
    },
  },
  properties: {
    value: { get: (c): string => c.getValue(), set: setValue },
  },
  methods: ["show", "close", "focus"] as const,
  model: "value" as const,
  events: {
    input: { detail: (payload) => ({ value: (payload as SearchEvent).value }) },
    change: { detail: (payload) => ({ value: (payload as SearchEvent).value }) },
    select: { detail: (payload) => ({ value: (payload as SearchEvent).value }) },
    // State: they do not change the value, and leave the model clean.
    open: { detail: () => null, state: true },
    close: { detail: () => null, state: true },
    // Dispatched by `setup` on a click of the trailing icon or the avatar.
    // Listed here for its type and the adapters.
    action: { detail: (payload) => payload as { value: string } },
  },
  form: {
    value: (c) => c.getValue(),
    control: (c) => c.input,
    activate: (c) => void c.focus(),
    state: (c) => c.getValue(),
    restore: (c, state) => setValue(c, state),
    disable: (c, disabled) => setDisabled(c, disabled),
  },
  config: (host): Config => ({ suggestions: declaredSuggestions(host) }) satisfies SearchConfig,
  setup: (host, c) => {
    // The inner input's native `input` event is composed and would reach the
    // page beside the element's own: it stops at the shadow root.
    const stop = (event: Event): void => event.stopPropagation();
    c.input.addEventListener("input", stop);
    // `open` reflects the view's state: Escape, an outside press and a chosen
    // suggestion close it.
    const reflect = (): void => void host.toggleAttribute("open", c.isExpanded());
    c.on("open", reflect);
    c.on("close", reflect);
    const onClick = (event: MouseEvent): void => {
      const item = (event.target as Element).closest?.("[data-trailing-id]");
      const value = item?.getAttribute("data-trailing-id");
      if (!value || c.isDisabled()) return;
      host.dispatchEvent(new CustomEvent("action", { detail: { value }, bubbles: true, composed: true }));
    };
    c.element.addEventListener("click", onClick);
    return () => {
      c.input.removeEventListener("input", stop);
      c.off("open", reflect);
      c.off("close", reflect);
      c.element.removeEventListener("click", onClick);
    };
  },
  observeChildren: updateSuggestions,
} satisfies ElementSpec<SearchElementComponent>;

export const searchElement = defineElement<SearchElementComponent>(searchSpec);
export type SearchSpec = typeof searchSpec;
/** `<m-search>` as a ref or a query returns it. */
export type SearchElement = ElementInstance<SearchSpec, SearchElementComponent>;

/**
 * `<m-search-suggestion>` declares one suggestion and renders nothing. Its
 * text is the label unless `label` is set; `value` defaults to the label.
 */
export const searchSuggestionDeclaration = {
  name: "search-suggestion",
  attributes: {
    value: { type: "string" },
    label: { type: "string" },
    icon: { type: "string" },
    group: { type: "string" },
  },
} as const;
export type SearchSuggestionAttributes = ElementAttributes<typeof searchSuggestionDeclaration>;

/** Registers `<m-search>` and `<m-search-suggestion>` (or with another prefix). */
export const defineSearch = (options?: DefineOptions): string => {
  const suggestionTag = `${options?.prefix ?? DEFAULT_PREFIX}-${searchSuggestionDeclaration.name}`;
  // Defined first, so suggestions already in the page are upgraded before the
  // search reads them.
  if (!customElements.get(suggestionTag)) {
    customElements.define(suggestionTag, createDeclarationClass(searchSuggestionDeclaration.attributes));
  }
  return searchElement.define(options);
};

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-search": SearchElement;
    "m-search-suggestion": HTMLElement & SearchSuggestionAttributes;
  }
}
