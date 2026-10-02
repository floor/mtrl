// src/elements/carousel.ts
/**
 * `<m-carousel>` with `<m-carousel-item>` children.
 *
 * Each `<m-carousel-item>` declares one item (`src`, `alt`, `description`,
 * `button-text`, `button-url`, `value`, and its text as the label). The
 * carousel reads them into the factory's config and updates in place when
 * they change; the children stay where the framework put them.
 *
 * `variant` and the sizing attributes have no setter on the carousel:
 * changing one recreates it. `index` on `<m-carousel>` is the default current
 * item, which moves the live one until the user or script changes it; the
 * `index` property is the live one, and `change` reports the item the user
 * scrolls, swipes or arrows to.
 *
 * The carousel fills the host's height, as the factory fills its
 * container's: give `<m-carousel>` a height.
 *
 * Parts: `carousel`, `scroller`, `track`, `item`, `content`, `title`, `snap`.
 *
 * @module elements
 */

import createCarousel from "../components/carousel";
import type { CarouselChangePayload, CarouselComponent, CarouselConfig, CarouselSlide } from "../components/carousel/types";
import {
  createDeclarationClass, defineElement, DEFAULT_PREFIX, type Config, type DefineOptions, type ElementAttributes,
  type ElementInstance, type ElementSpec,
} from "./define";

interface DeclaredItem {
  value: string;
  slide: CarouselSlide;
}

/** The factory's config, with the slides as the element declares them. */
type CarouselElementConfig = Omit<CarouselConfig, "slides"> & { slides?: DeclaredItem[] };

/** The value of each item, in order: the slides API knows items by index only. */
const itemValues = new WeakMap<CarouselComponent, string[]>();

const declaredItems = (host: HTMLElement): DeclaredItem[] => {
  const itemTag = `${host.localName}-item`;
  const items: DeclaredItem[] = [];
  for (const child of Array.from(host.children)) {
    if (child.localName !== itemTag) continue;
    const title = child.getAttribute("label") ?? (child.textContent ?? "").trim();
    const slide: CarouselSlide = {
      image: child.getAttribute("src") ?? undefined,
      alt: child.getAttribute("alt") ?? undefined,
      title: title || undefined,
      description: child.getAttribute("description") ?? undefined,
      buttonText: child.getAttribute("button-text") ?? undefined,
      buttonUrl: child.getAttribute("button-url") ?? undefined,
    };
    items.push({ value: child.getAttribute("value") ?? (title || String(items.length)), slide });
  }
  return items;
};

const readCarousel = (host: HTMLElement): Config => ({ slides: declaredItems(host) }) satisfies CarouselElementConfig;

const create = (config: CarouselElementConfig): CarouselComponent => {
  const items = config.slides ?? [];
  const component = createCarousel({ ...config, slides: items.map((item) => item.slide) });
  itemValues.set(component, items.map((item) => item.value));
  return component;
};

const sameSlide = (a: CarouselSlide | null, b: CarouselSlide): boolean =>
  !!a && (Object.keys(b) as Array<keyof CarouselSlide>).every((key) => a[key] === b[key]);

/**
 * Applies the declared items in place through the slides API: removals,
 * insertions, moves and content changes. Keeps the component and its current
 * item. Returns false for a repeated value, which cannot say which item is
 * which, so the element rebuilds instead.
 */
const updateCarousel = (host: HTMLElement, component: CarouselComponent): boolean => {
  const declared = declaredItems(host);
  const wanted = declared.map((item) => item.value);
  if (new Set(wanted).size !== wanted.length) return false;
  const values = itemValues.get(component) ?? [];
  if (new Set(values).size !== values.length) return false;

  for (let i = values.length - 1; i >= 0; i--) {
    if (!wanted.includes(values[i] as string)) {
      component.removeSlide(i);
      values.splice(i, 1);
    }
  }
  declared.forEach(({ value, slide }, i) => {
    if (values[i] === value) {
      if (!sameSlide(component.slides.getSlide(i), slide)) component.slides.updateSlide(i, slide);
      return;
    }
    const from = values.indexOf(value);
    if (from !== -1) {
      component.removeSlide(from);
      values.splice(from, 1);
    }
    component.addSlide(slide, i);
    values.splice(i, 0, value);
  });
  itemValues.set(component, values);
  return true;
};

const carouselSpec = {
  name: "carousel",
  // Its geometry depends on measured layout.
  ssr: false,
  create: (config) => create(config as CarouselElementConfig),
  styles: ["carousel"],
  hostStyles: ":host{display:block}",
  attributes: {
    wheel: { type: "boolean", config: "wheel", update: (c, v) => void c.setWheel(!!v) },
    variant: { type: "string", config: "variant" },
    index: { type: "number", config: "initialSlide", update: (c, v) => void c.goTo(Number(v ?? 0)) },
    "item-width": { type: "number", config: "itemWidth" },
    gap: { type: "number", config: "gap" },
    padding: { type: "number", config: "padding" },
    "corner-radius": { type: "number", config: "cornerRadius" },
    "min-small-item-width": { type: "number", config: "minSmallItemWidth" },
    "max-small-item-width": { type: "number", config: "maxSmallItemWidth" },
    "aria-label": {
      type: "string",
      config: "ariaLabel",
      // The factory names an unnamed carousel "Carousel".
      update: (c, v) => c.element.setAttribute("aria-label", v === null ? "Carousel" : String(v)),
    },
  },
  properties: {
    index: {
      get: (c): number => c.getCurrentSlide(),
      set: (c, v) => void c.goTo(Number(v ?? 0)),
      config: "initialSlide",
    },
  },
  model: "index" as const,
  methods: ["next", "prev", "goTo"] as const,
  events: {
    change: {
      detail: (payload) => ({ value: (payload as CarouselChangePayload).value }),
    },
  },
  config: readCarousel,
  observeChildren: updateCarousel,
} satisfies ElementSpec<CarouselComponent>;

export const carouselElement = defineElement<CarouselComponent>(carouselSpec);
export type CarouselSpec = typeof carouselSpec;
/** `<m-carousel>` as a ref or a query returns it. */
export type CarouselElement = ElementInstance<CarouselSpec, CarouselComponent>;

/**
 * `<m-carousel-item>` declares one item and renders nothing. Its text
 * content is the label unless `label` is set.
 */
export const carouselItemDeclaration = {
  name: "carousel-item",
  attributes: {
    value: { type: "string" },
    src: { type: "string" },
    alt: { type: "string" },
    label: { type: "string" },
    description: { type: "string" },
    "button-text": { type: "string" },
    "button-url": { type: "string" },
  },
} as const;
export type CarouselItemAttributes = ElementAttributes<typeof carouselItemDeclaration>;

/** Registers `<m-carousel>` and `<m-carousel-item>` (or with another prefix). */
export const defineCarousel = (options?: DefineOptions): string => {
  const itemTag = `${options?.prefix ?? DEFAULT_PREFIX}-${carouselItemDeclaration.name}`;
  // Defined first, so items already in the page are upgraded before the
  // carousel reads them.
  if (!customElements.get(itemTag)) customElements.define(itemTag, createDeclarationClass(carouselItemDeclaration.attributes));
  return carouselElement.define(options);
};

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-carousel": CarouselElement;
    "m-carousel-item": HTMLElement & CarouselItemAttributes;
  }
}
