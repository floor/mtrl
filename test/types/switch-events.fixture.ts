// FLO-114: public switch event names and the actual native/programmatic payload.
import createSwitch, {
  SWITCH_EVENTS,
  type SwitchComponent,
  type SwitchEvents,
  type SwitchChangePayload,
} from "../../src/components/switch";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const control = createSwitch();
export const onlyChangeIsEmitted: Equals<keyof SwitchEvents, "change"> = true;
export const callbackPayload: Equals<
  Parameters<Parameters<typeof control.on<"change">>[1]>[0],
  SwitchChangePayload
> = true;
export const checkedIsBoolean: Equals<SwitchChangePayload["checked"], boolean> = true;
export const valueIsTheHTMLValue: Equals<SwitchChangePayload["value"], string> = true;
export const nativeEventIsOptional: {} extends Pick<SwitchChangePayload, "nativeEvent"> ? true : false = true;
export const nativeEventIsAnEvent: Equals<NonNullable<SwitchChangePayload["nativeEvent"]>, Event> = true;

export const programmaticPayload: SwitchChangePayload = { checked: true, value: "yes" };
export const inputPayload: SwitchChangePayload = {
  checked: false, value: "yes", nativeEvent: new Event("change"),
};

const onChange: SwitchEvents["change"] = ({ checked, value, nativeEvent }) => {
  const state: boolean = checked;
  const htmlValue: string = value;
  nativeEvent?.preventDefault();
  void state;
  void htmlValue;
};
export const chained: SwitchComponent = control.on(SWITCH_EVENTS.CHANGE, onChange).off("change", onChange);
control.on("change", () => {});

// @ts-expect-error the payload is not a raw DOM event
control.on("change", (event: Event) => event.preventDefault());
// @ts-expect-error off checks the same payload
control.off("change", (event: Event) => event.preventDefault());
// @ts-expect-error misspelled names are not registered silently
control.on("chnage", () => {});
// @ts-expect-error off uses the same closed map
control.off("chnage", () => {});
// @ts-expect-error click is available on the DOM input, not the emitter
control.on("click", () => {});
// @ts-expect-error focus is available on the DOM input, not the emitter
control.on(SWITCH_EVENTS.FOCUS, () => {});
// @ts-expect-error blur is also a native input event
control.on(SWITCH_EVENTS.BLUR, () => {});
// @ts-expect-error control overrides the input feature's value setter
control.on("value", () => {});
// @ts-expect-error lifecycle events are not emitted through this API
control.on("mount", () => {});
// @ts-expect-error the payload has no DOM target field
control.on("change", payload => payload.target.checked);
// @ts-expect-error nativeEvent is an Event, not an arbitrary object
export const invalidNativeEvent: SwitchChangePayload = { checked: true, value: "yes", nativeEvent: {} };
