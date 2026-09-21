// FLO-114: public radios map and both selection/clearing payload shapes.
import createRadios, {
  RADIO_EVENTS,
  type RadiosComponent,
  type RadiosEvents,
  type RadiosChangePayload,
  type RadioOptionConfig,
} from "../../src/components/radios";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const radios = createRadios({ name: "size" });
export const onlyChangeIsEmitted: Equals<keyof RadiosEvents, "change"> = true;
export const callbackPayload: Equals<
  Parameters<Parameters<typeof radios.on<"change">>[1]>[0],
  RadiosChangePayload
> = true;
export const valueIsString: Equals<RadiosChangePayload["value"], string> = true;
export const optionCanBeCleared: Equals<RadiosChangePayload["option"], RadioOptionConfig | null> = true;
export const originalEventCanBeAbsent: Equals<RadiosChangePayload["originalEvent"], Event | undefined> = true;
export const originalEventKeyIsRequired: {} extends Pick<RadiosChangePayload, "originalEvent"> ? true : false = false;

export const nativePayload: RadiosChangePayload = {
  value: "s", option: { value: "s", label: "Small" }, originalEvent: new Event("change"),
};
export const clearedPayload: RadiosChangePayload = { value: "", option: null, originalEvent: undefined };

const onChange: RadiosEvents["change"] = payload => {
  payload.value.toUpperCase();
  payload.option?.label.toUpperCase();
  payload.originalEvent?.preventDefault();
};
export const chained: RadiosComponent = radios.on(RADIO_EVENTS.CHANGE, onChange).off("change", onChange);
radios.on("change", () => {});

// @ts-expect-error the payload is not a DOM event
radios.on("change", (event: Event) => event.preventDefault());
// @ts-expect-error off checks the payload as well
radios.off("change", (event: Event) => event.preventDefault());
// @ts-expect-error a typo must not register silently
radios.on("chnage", () => {});
// @ts-expect-error off uses the same closed map
radios.off("chnage", () => {});
// @ts-expect-error these exported constants name native input events, not emitter events
radios.on(RADIO_EVENTS.FOCUS, () => {});
// @ts-expect-error blur is not forwarded by the group
radios.on(RADIO_EVENTS.BLUR, () => {});
// @ts-expect-error clicks are available on the native inputs
radios.on("click", () => {});
// @ts-expect-error lifecycle events use a separate emitter
radios.on("mount", () => {});
// @ts-expect-error value remains a string
export const invalidValue: RadiosChangePayload = { value: 1, option: null, originalEvent: undefined };
// @ts-expect-error the originalEvent property is always present, even when undefined
export const missingOriginalEvent: RadiosChangePayload = { value: "", option: null };
