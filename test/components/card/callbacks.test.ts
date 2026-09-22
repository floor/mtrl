import { expect, test } from "bun:test";
import createCard, { withSwipeable } from "../../../src/components/card";
import type { CardComponent } from "../../../src/components/card/types";
import { callbacksFixture } from "../callbacks.fixture";

const mount = callbacksFixture();

for (const direction of ["left", "right"] as const) {
  for (const input of ["button", "touch"] as const) {
    test(`card ${direction} swipe via ${input} exposes the enhanced card including reset`, () => {
      const calls: CardComponent[] = [];
      const handler = (card: CardComponent): void => { calls.push(card); card.swipeable?.reset(); };
      const base = mount(createCard());
      const card = withSwipeable({ onSwipeLeft: handler, onSwipeRight: handler })(base);
      if (input === "button") {
        card.element.querySelector<HTMLButtonElement>(`[aria-label="Perform swipe ${direction} action"]`)!.click();
      } else {
        for (const [type, x] of [["touchstart", 100], ["touchmove", direction === "left" ? 0 : 200]] as const) {
          const event = new Event(type, { bubbles: true });
          Object.defineProperty(event, "touches", { value: [{ clientX: x }] });
          card.element.dispatchEvent(event);
        }
        card.element.dispatchEvent(new Event("touchend", { bubbles: true }));
      }
      expect(calls).toHaveLength(1);
      expect(calls[0] === card).toBe(true);
      expect(card.element.style.transform).toBe("translateX(0)");
    });
  }
}
