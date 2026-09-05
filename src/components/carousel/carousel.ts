// src/components/carousel/carousel.ts
import { pipe } from "../../core/compose";
import { createBase, withElement } from "../../core/compose/component";
import { withEvents, withLifecycle } from "../../core/compose/features";
import { withSlides, withScroll } from "./features";
import { withAPI } from "./api";
import { CarouselConfig, CarouselComponent } from "./types";
import { createBaseConfig, getElementConfig } from "./config";

export const createCarousel = (
  config: CarouselConfig = {},
): CarouselComponent => {
  const baseConfig = createBaseConfig(config);

  const core = pipe(
    createBase,
    withEvents(),
    withElement(getElementConfig(baseConfig)),
  )(baseConfig);

  core.element.style.position = "relative";
  core.element.style.overflow = "hidden";
  core.element.style.userSelect = "none";
  core.element.style.touchAction = "pan-y";
  core.element.style.cursor = "grab";

  if (baseConfig.variant) {
    core.element.dataset.variant = typeof baseConfig.variant === "string"
      ? baseConfig.variant
      : "custom";
  }

  const withSlidesComponent = withSlides(baseConfig)(core);
  const withScrollComponent = withScroll(baseConfig)(withSlidesComponent);
  const withLifecycleComponent = withLifecycle()(withScrollComponent);

  return withAPI()(withLifecycleComponent);
};

export default createCarousel;
