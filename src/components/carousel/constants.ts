// src/components/carousel/constants.ts

export const CAROUSEL_VARIANTS = {
  STATIC: "static",
  FULL: "full",
  HERO: "hero",
  HERO_CENTER: "hero-center",
  MULTI: "multi",
  UNCONTAINED: "uncontained",
} as const;

export const CAROUSEL_EVENTS = {
  SLIDE_CHANGE: "slide-change",
  SLIDE_CHANGED: "slide-changed",
  RESIZE: "resize",
} as const;

export const CAROUSEL_DEFAULTS = {
  VARIANT: "hero" as const,
  SNAP: true,
  SNAP_DURATION: 400,
  GAP: 8,
  CORNER_RADIUS: 16,
  INITIAL_SLIDE: 0,
  LOOP: true,
  PEEK: "auto" as const,
} as const;

