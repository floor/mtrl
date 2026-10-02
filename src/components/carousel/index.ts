// src/components/carousel/index.ts
export { default, createCarousel } from "./carousel";

export {
  CAROUSEL_VARIANTS,
  CAROUSEL_EVENTS,
  CAROUSEL_DEFAULTS,
} from "./constants";

export type {
  CarouselConfig,
  CarouselComponent,
  CarouselEvents,
  CarouselChangePayload,
  CarouselSlide,
  CarouselVariant,
  // Public: CarouselComponent.slides is typed with it (FLO-381 keeps it)
  SlidesAPI,
} from "./types";
export * from "./constants";
