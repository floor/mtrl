// src/components/carousel/config.ts
import {
  createComponentConfig,
  createElementConfig,
} from "../../core/config/component";
import { CarouselConfig } from "./types";
import { CAROUSEL_DEFAULTS } from "./constants";

export const defaultConfig: CarouselConfig = {
  variant: CAROUSEL_DEFAULTS.VARIANT,
  snap: CAROUSEL_DEFAULTS.SNAP,
  snapDuration: CAROUSEL_DEFAULTS.SNAP_DURATION,
  gap: CAROUSEL_DEFAULTS.GAP,
  cornerRadius: CAROUSEL_DEFAULTS.CORNER_RADIUS,
  initialSlide: CAROUSEL_DEFAULTS.INITIAL_SLIDE,
  loop: CAROUSEL_DEFAULTS.LOOP,
  peek: CAROUSEL_DEFAULTS.PEEK,
  prefix: "carousel",
};

export const createBaseConfig = (config: CarouselConfig = {}): CarouselConfig =>
  createComponentConfig(defaultConfig, config, "carousel") as CarouselConfig;

export const getElementConfig = (config: CarouselConfig) => {
  return createElementConfig(config, {
    tag: "div",
    attributes: {
      role: "region",
      "aria-roledescription": "carousel",
      "aria-live": "polite",
    },
    className: config.class,
    forwardEvents: {
      keydown: true,
      focus: true,
      blur: true,
    },
  });
};
