// src/components/carousel/types.ts

import type { SlotConfig, SlotConfigResolver } from "./presets";

export type CarouselVariant =
  | "static"
  | "full"
  | "hero"
  | "hero-center"
  | "multi"
  | "uncontained"
  | (string & {});

export interface CarouselSlide {
  image: string;
  title?: string;
  accent?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
}

export interface CarouselConfig {
  variant?: CarouselVariant | SlotConfig | SlotConfigResolver;
  snap?: boolean;
  snapDuration?: number;
  peek?: number | string | "auto";
  gap?: number;
  cornerRadius?: number;
  initialSlide?: number;
  slides?: CarouselSlide[];
  loop?: boolean;
  prefix?: string;
  componentName?: string;
  class?: string;
}

export interface CarouselComponent {
  element: HTMLElement;

  slides: SlidesAPI;

  lifecycle: {
    destroy: () => void;
  };

  getClass: (name: string) => string;

  next: () => CarouselComponent;
  prev: () => CarouselComponent;
  goTo: (index: number) => CarouselComponent;
  getCurrentSlide: () => number;

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
