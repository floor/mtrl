// src/components/carousel/types.ts

export type CarouselVariant =
  | "multi-browse"
  | "uncontained"
  | "hero"
  | "hero-center"
  | "full-screen";

/**
 * Content of one carousel item. Either an image with optional text and a
 * call to action, or arbitrary content.
 */
export interface CarouselSlide {
  image?: string;
  /** Alternative text for the image; empty when the image is decorative */
  alt?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  /** Custom content, replaces the image and text */
  content?: HTMLElement | string;
}

export interface CarouselConfig {
  /** Layout, "multi-browse" by default */
  variant?: CarouselVariant;
  slides?: CarouselSlide[];
  /**
   * Width of a large item in px. Multi-browse and uncontained layouts
   * treat it as the preferred width, hero layouts as a maximum (the
   * container width by default).
   */
  itemWidth?: number;
  /** Space between items, 8 by default (16 for full-screen) */
  gap?: number;
  /** Space between the container edges and the items, 16 by default (0 for full-screen) */
  padding?: number;
  /** Corner radius of the items, 28 by default */
  cornerRadius?: number;
  /** Snap to items after scrolling; on by default except for uncontained layouts */
  snap?: boolean;
  initialSlide?: number;
  minSmallItemWidth?: number;
  maxSmallItemWidth?: number;
  /** Accessible name of the carousel */
  ariaLabel?: string;
  prefix?: string;
  componentName?: string;
  class?: string;
}

export interface CarouselComponent {
  element: HTMLElement;
  slides: SlidesAPI;
  lifecycle: { destroy: () => void };
  getClass: (name: string) => string;

  next: () => CarouselComponent;
  prev: () => CarouselComponent;
  goTo: (index: number) => CarouselComponent;
  getCurrentSlide: () => number;
  getVariant: () => CarouselVariant;

  addSlide: (slide: CarouselSlide, index?: number) => CarouselComponent;
  removeSlide: (index: number) => CarouselComponent;

  destroy: () => void;
  on: (event: string, handler: Function) => CarouselComponent;
  off: (event: string, handler: Function) => CarouselComponent;
  addClass: (...classes: string[]) => CarouselComponent;
}

export interface SlidesAPI {
  addSlide: (slide: CarouselSlide, index?: number) => SlidesAPI;
  removeSlide: (index: number) => SlidesAPI;
  updateSlide: (index: number, slide: CarouselSlide) => SlidesAPI;
  getSlide: (index: number) => CarouselSlide | null;
  getCount: () => number;
  getElements: () => HTMLElement[];
}
