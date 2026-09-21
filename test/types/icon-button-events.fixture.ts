// FLO-114: compile the public component barrel, including its event map.
// Runtime forwarding is covered by test/components/icon-button/behavior.fixture.ts.
import {
  createIconButton,
  type IconButtonComponent,
  type IconButtonEvents,
} from "../../src/components/icon-button";
import type { ForwardedEventPayload } from "../../src/core/dom";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const button = createIconButton({ ariaLabel: "Favorite" });

export const exactlyTheForwardedEvents: Equals<
  keyof IconButtonEvents,
  "click" | "focus" | "blur"
> = true;

export const clickPayload: Equals<
  Parameters<Parameters<typeof button.on<"click">>[1]>[0],
  ForwardedEventPayload<MouseEvent, HTMLButtonElement>
> = true;

export const focusPayload: Equals<
  Parameters<Parameters<typeof button.on<"focus">>[1]>[0],
  ForwardedEventPayload<FocusEvent, HTMLButtonElement>
> = true;

export const blurPayload: Equals<
  Parameters<Parameters<typeof button.on<"blur">>[1]>[0],
  ForwardedEventPayload<FocusEvent, HTMLButtonElement>
> = true;

const onClick: IconButtonEvents["click"] = ({ event, originalEvent, element }) => {
  event.preventDefault();
  originalEvent.preventDefault();
  element.disabled = true;
};

export const chaining: IconButtonComponent = button.on("click", onClick).off("click", onClick);
button.on("focus", () => {}).off("blur", () => {});

// @ts-expect-error misspelled event names must not silently register
button.on("clik", () => {});
// @ts-expect-error off uses the same closed event map
button.off("clik", () => {});
// @ts-expect-error the payload wraps the native event
button.on("click", (event: MouseEvent) => event.preventDefault());
// @ts-expect-error off also checks the handler payload
button.off("click", (event: MouseEvent) => event.preventDefault());
// @ts-expect-error focus does not forward a keyboard event
button.on("focus", (_payload: ForwardedEventPayload<KeyboardEvent, HTMLButtonElement>) => {});

// Toggle is a DOM event, not a forwarded emitter event.
// @ts-expect-error listen through element.addEventListener instead
button.on("toggle", () => {});
// @ts-expect-error off has the same event boundary
button.off("toggle", () => {});
// @ts-expect-error lifecycle events belong to the lifecycle API
button.on("mount", () => {});

button.element.addEventListener("toggle", () => {});
