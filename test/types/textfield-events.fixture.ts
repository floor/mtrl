// FLO-114: public textfield event names and the payloads its input feature emits.
import createTextfield, {
  type TextfieldComponent,
  type TextfieldEvents,
  type TextfieldValuePayload,
  type TextfieldFocusPayload,
} from "../../src/components/textfield";
import { TEXTFIELD_EVENTS } from "../../src/components/textfield/constants";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const field = createTextfield();
export const eventNames: Equals<keyof TextfieldEvents, "input" | "change" | "focus" | "blur"> = true;
export const valueShape: Equals<TextfieldValuePayload, { value: string; isEmpty: boolean; isAutofilled: boolean }> = true;
export const focusShape: Equals<TextfieldFocusPayload, { isEmpty: boolean }> = true;
export const inputPayload: Equals<Parameters<Parameters<typeof field.on<"input">>[1]>[0], TextfieldValuePayload> = true;
export const changePayload: Equals<Parameters<Parameters<typeof field.on<"change">>[1]>[0], TextfieldValuePayload> = true;
export const focusPayload: Equals<Parameters<Parameters<typeof field.on<"focus">>[1]>[0], TextfieldFocusPayload> = true;
export const blurPayload: Equals<Parameters<Parameters<typeof field.on<"blur">>[1]>[0], TextfieldFocusPayload> = true;

const onValue: TextfieldEvents["input"] = ({ value, isEmpty, isAutofilled }) => {
  const text: string = value;
  const flags: boolean[] = [isEmpty, isAutofilled];
  void text;
  void flags;
};
const onFocus: TextfieldEvents["focus"] = ({ isEmpty }) => { const empty: boolean = isEmpty; void empty; };
export const chained: TextfieldComponent = field
  .on(TEXTFIELD_EVENTS.INPUT, onValue).off("input", onValue)
  .on(TEXTFIELD_EVENTS.CHANGE, onValue).off("change", onValue)
  .on(TEXTFIELD_EVENTS.FOCUS, onFocus).off("focus", onFocus)
  .on(TEXTFIELD_EVENTS.BLUR, onFocus).off("blur", onFocus);
field.on("input", () => {});

// @ts-expect-error these are payload objects, not raw DOM events
field.on("input", (event: InputEvent) => event.preventDefault());
// @ts-expect-error off checks the same payload
field.off("change", (event: Event) => event.preventDefault());
// @ts-expect-error focus does not forward a FocusEvent
field.on("focus", (event: FocusEvent) => event.preventDefault());
// @ts-expect-error misspelled events are rejected
field.on("chnage", () => {});
// @ts-expect-error off uses the same closed map
field.off("chnage", () => {});
// @ts-expect-error keyboard events belong to input.addEventListener
field.on(TEXTFIELD_EVENTS.KEYDOWN, () => {});
// @ts-expect-error keyup is not forwarded either
field.on(TEXTFIELD_EVENTS.KEYUP, () => {});
// @ts-expect-error enter has no emitter path
field.on(TEXTFIELD_EVENTS.ENTER, () => {});
// @ts-expect-error the programmatic setter is silent
field.on("value", () => {});
// @ts-expect-error lifecycle events are not forwarded
field.on("destroy", () => {});
// @ts-expect-error payloads have no DOM target
field.on("input", payload => payload.target.value);
// @ts-expect-error focus carries only the empty state
field.on("focus", payload => payload.value);
// @ts-expect-error autofill state is required on every value event
export const missingAutofill: TextfieldValuePayload = { value: "x", isEmpty: false };
