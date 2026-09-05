// src/components/carousel/carousel.ts
import { pipe } from "../../core/compose";
import { createBase, withElement } from "../../core/compose/component";
import { withEvents, withLifecycle } from "../../core/compose/features";
import { withSlides, withScroll } from "./features";
import { withAPI } from "./api";
import { CarouselConfig, CarouselComponent } from "./types";
import { createBaseConfig, getElementConfig } from "./config";

/**
 * Creates a Material 3 carousel.
 *
 * Items are laid out by a keyline strategy per layout (multi-browse,
 * uncontained, hero, centred hero, full-screen) and scrolled natively;
 * they change size as they move through the layout and snap into place.
 *
 * @example
 * ```ts
 * const carousel = createCarousel({
 *   variant: 'hero',
 *   itemWidth: 360,
 *   slides: [
 *     { image: 'a.jpg', title: 'Alpha' },
 *     { image: 'b.jpg', title: 'Beta' },
 *   ],
 * });
 * carousel.on('change', ({ index }) => console.log(index));
 * ```
 *
 * @category Components
 */
export const createCarousel = (config: CarouselConfig = {}): CarouselComponent => {
  const baseConfig = createBaseConfig(config);
  return pipe(
    createBase,
    withEvents(),
    withElement(getElementConfig(baseConfig)),
    withSlides(baseConfig),
    withLifecycle(),
    withScroll(baseConfig),
    withAPI(),
  )(baseConfig);
};

export default createCarousel;
