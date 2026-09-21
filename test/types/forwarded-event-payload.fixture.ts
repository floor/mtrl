// The public core payload must accept both element families the forwarder emits.
// Compiled by test:types and tooling:check; no runtime assertions live here.
import {
  createSVGElement,
  type ForwardedEventPayload,
} from "../../src/core/dom";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

export const defaultElementIncludesSVG: Equals<
  ForwardedEventPayload["element"],
  HTMLElement | SVGElement
> = true;

declare const svgPayload: ForwardedEventPayload<MouseEvent, SVGElement>;
export const svgIsAGeneralPayload: ForwardedEventPayload = svgPayload;

export const svgElementRemainsSpecific: Equals<
  typeof svgPayload.element,
  SVGElement
> = true;

const record = (_payload: ForwardedEventPayload): void => {};

// A real public consumer: ElementContext.emit hands its payload to a recorder.
createSVGElement({
  forwardEvents: { click: true },
  context: {
    emit(_name, payload) {
      record(payload);
    },
  },
});

// @ts-expect-error a forwarded SVG root is not an HTML button
export const svgIsNotAButton: ForwardedEventPayload<MouseEvent, HTMLButtonElement> = svgPayload;

// @ts-expect-error event targets that are not DOM elements cannot be roots
export type InvalidRoot = ForwardedEventPayload<Event, Window>;
