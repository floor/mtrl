// FLO-114: carousel public events match navigation and root focus forwarding.
import createCarousel, {
  CAROUSEL_EVENTS,
  type CarouselComponent,
  type CarouselEvents,
  type CarouselChangePayload,
} from "../../src/components/carousel";
import type { ForwardedEventPayload } from "../../src/core/dom";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const carousel = createCarousel();
export const names: Equals<keyof CarouselEvents, "change" | "focus" | "blur"> = true;
export const change: Equals<Parameters<CarouselEvents["change"]>[0], CarouselChangePayload> = true;
export const changeShape: Equals<CarouselChangePayload, { index: number }> = true;
export const focus: Equals<Parameters<CarouselEvents["focus"]>[0], ForwardedEventPayload<FocusEvent, HTMLElement>> = true;
export const blur: Equals<Parameters<CarouselEvents["blur"]>[0], ForwardedEventPayload<FocusEvent, HTMLElement>> = true;
export const inferredChange: Equals<Parameters<Parameters<typeof carousel.on<"change">>[1]>[0], CarouselChangePayload> = true;

const onChange: CarouselEvents["change"] = ({ index }) => { const current: number = index; void current; };
export const chained: CarouselComponent = carousel.on(CAROUSEL_EVENTS.CHANGE, onChange).off("change", onChange);
carousel.on("change", () => {});
carousel.on("focus", payload => { payload.event.relatedTarget; payload.element.style; });
carousel.on("blur", payload => payload.originalEvent.preventDefault());

// @ts-expect-error change carries an object, not a raw DOM event
carousel.on("change", (event: Event) => event.preventDefault());
// @ts-expect-error off checks the same payload
carousel.off("change", (index: number) => index.toFixed());
// @ts-expect-error misspelled names are rejected
carousel.on("chnage", () => {});
// @ts-expect-error off shares the closed event map
carousel.off("chnage", () => {});
// @ts-expect-error keyboard navigation does not forward keydown through on()
carousel.on("keydown", () => {});
// @ts-expect-error native scroll drives change, not a forwarded scroll event
carousel.on("scroll", () => {});
// @ts-expect-error focusin is handled internally, not forwarded
carousel.on("focusin", () => {});
// @ts-expect-error click is not forwarded
carousel.on("click", () => {});
// @ts-expect-error lifecycle events are not emitted through on()
carousel.on("destroy", () => {});
// @ts-expect-error focus uses a wrapped payload
carousel.on("focus", (event: FocusEvent) => event.relatedTarget);
// @ts-expect-error forwarded payloads do not carry a finished carousel
carousel.on("focus", payload => payload.component.next());
// @ts-expect-error focus retains its native event type
carousel.on("blur", payload => payload.event.clientX);
// @ts-expect-error change does not carry a DOM target
carousel.on("change", payload => payload.target);
// @ts-expect-error the index is numeric
export const invalidIndex: CarouselChangePayload = { index: "1" };
