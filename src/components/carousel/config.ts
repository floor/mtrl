// src/components/carousel/config.ts
import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { CarouselConfig, CarouselVariant } from "./types";
import { CAROUSEL_DEFAULTS, CAROUSEL_VARIANTS } from "./constants";

export const defaultConfig: CarouselConfig = {
  variant: CAROUSEL_DEFAULTS.VARIANT,
  cornerRadius: CAROUSEL_DEFAULTS.CORNER_RADIUS,
  initialSlide: CAROUSEL_DEFAULTS.INITIAL_SLIDE,
  minSmallItemWidth: CAROUSEL_DEFAULTS.MIN_SMALL_ITEM_WIDTH,
  maxSmallItemWidth: CAROUSEL_DEFAULTS.MAX_SMALL_ITEM_WIDTH,
};

/** Layout-dependent defaults: full-screen has no padding and 16dp between items; uncontained scrolls freely */
export const resolveLayoutDefaults = (config: CarouselConfig): Required<Pick<CarouselConfig, "variant" | "gap" | "padding" | "snap">> => {
  const variant = (config.variant || CAROUSEL_DEFAULTS.VARIANT) as CarouselVariant;
  const fullScreen = variant === CAROUSEL_VARIANTS.FULL_SCREEN;
  return {
    variant,
    gap: config.gap ?? (fullScreen ? CAROUSEL_DEFAULTS.GAP_FULL_SCREEN : CAROUSEL_DEFAULTS.GAP),
    padding: config.padding ?? (fullScreen ? 0 : CAROUSEL_DEFAULTS.PADDING),
    snap: config.snap ?? variant !== CAROUSEL_VARIANTS.UNCONTAINED,
  };
};

export const createBaseConfig = (config: CarouselConfig = {}): CarouselConfig =>
  createComponentConfig(defaultConfig, config, "carousel") as CarouselConfig;

export const getElementConfig = (config: CarouselConfig) => {
  const { variant } = resolveLayoutDefaults(config);
  return createElementConfig(config, {
    tag: "div",
    attributes: {
      role: "region",
      "aria-roledescription": "carousel",
      "aria-label": config.ariaLabel || "Carousel",
    },
    className: [
      config.class,
      `${config.prefix}-carousel--${variant}`,
      variant === CAROUSEL_VARIANTS.FULL_SCREEN ? `${config.prefix}-carousel--vertical` : null,
    ],
    forwardEvents: {
      focus: true,
      blur: true,
    },
  });
};
