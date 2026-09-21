// FLO-114: public checkbox event names and the actual native/programmatic payload.
import createCheckbox, {
  type CheckboxComponent,
  type CheckboxEvents,
  type CheckboxChangePayload,
} from "../../src/components/checkbox";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

const checkbox = createCheckbox();
export const onlyChangeIsEmitted: Equals<keyof CheckboxEvents, "change"> = true;
export const callbackPayload: Equals<
  Parameters<Parameters<typeof checkbox.on<"change">>[1]>[0],
  CheckboxChangePayload
> = true;
export const checkedIsBoolean: Equals<CheckboxChangePayload["checked"], boolean> = true;
export const valueIsTheHTMLValue: Equals<CheckboxChangePayload["value"], string> = true;
export const nativeEventIsOptional: {} extends Pick<CheckboxChangePayload, "nativeEvent"> ? true : false = true;
export const nativeEventIsAnEvent: Equals<NonNullable<CheckboxChangePayload["nativeEvent"]>, Event> = true;

export const programmaticPayload: CheckboxChangePayload = { checked: true, value: "yes" };
export const inputPayload: CheckboxChangePayload = {
  checked: false, value: "yes", nativeEvent: new Event("change"),
};

const onChange: CheckboxEvents["change"] = ({ checked, value, nativeEvent }) => {
  const state: boolean = checked;
  const htmlValue: string = value;
  nativeEvent?.preventDefault();
  void state;
  void htmlValue;
};
export const chained: CheckboxComponent = checkbox.on("change", onChange).off("change", onChange);
checkbox.on("change", () => {});

// @ts-expect-error the payload is not a raw DOM event
checkbox.on("change", (event: Event) => event.preventDefault());
// @ts-expect-error off checks the same payload
checkbox.off("change", (event: Event) => event.preventDefault());
// @ts-expect-error misspelled names are not registered silently
checkbox.on("chnage", () => {});
// @ts-expect-error off uses the same closed map
checkbox.off("chnage", () => {});
// @ts-expect-error click is available on the DOM input, not the emitter
checkbox.on("click", () => {});
// @ts-expect-error focus is available on the DOM input, not the emitter
checkbox.on("focus", () => {});
// @ts-expect-error checkbox overrides the input feature's value setter
checkbox.on("value", () => {});
// @ts-expect-error lifecycle events are not emitted through this API
checkbox.on("mount", () => {});
// @ts-expect-error the old documentation's target field does not exist
checkbox.on("change", payload => payload.target.checked);
// @ts-expect-error nativeEvent is an Event, not an arbitrary object
export const invalidNativeEvent: CheckboxChangePayload = { checked: true, value: "yes", nativeEvent: {} };
