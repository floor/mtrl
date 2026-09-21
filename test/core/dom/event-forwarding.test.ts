import { beforeAll, describe, expect, test } from "bun:test";
import { JSDOM } from "jsdom";
import {
  createElement,
  createElementPooled,
  createSVGElement,
  type ElementContext,
  type ForwardedEventPayload,
} from "../../../src/core/dom/create";

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");

beforeAll(() => {
  Object.assign(globalThis, {
    document: dom.window.document,
    window: dom.window,
    Element: dom.window.Element,
    HTMLElement: dom.window.HTMLElement,
    SVGElement: dom.window.SVGElement,
  });
});

// Runtime guards for existing behavior; the type fixture detects the type fix.
describe("native event forwarding", () => {
  for (const [name, create] of [
    ["HTML", createElement],
    ["pooled HTML", createElementPooled],
    ["SVG", createSVGElement],
  ] as const) {
    test(`${name} forwards the original event and listener element`, () => {
      const received: Array<{ name: string; payload: ForwardedEventPayload }> = [];
      const context: ElementContext = {
        emit(name, payload) {
          received.push({ name, payload });
        },
      };
      const element = create({
        tag: name === "SVG" ? "svg" : "button",
        forwardEvents: { click: true },
        context,
      });
      const event = new dom.window.MouseEvent("click", { bubbles: true });

      element.dispatchEvent(event);

      expect(received).toHaveLength(1);
      expect(received[0].name).toBe("click");
      expect(received[0].payload.event).toBe(event);
      expect(received[0].payload.originalEvent).toBe(event);
      expect(received[0].payload.element).toBe(element);
      expect(element.namespaceURI).toBe(
        name === "SVG" ? "http://www.w3.org/2000/svg" : "http://www.w3.org/1999/xhtml",
      );
    });
  }
});
