// src/elements/timepicker.ts
/**
 * `<m-timepicker>`: the time picker as a form-associated custom element.
 *
 * The factory renders no field of its own, only its modal dialog, so the
 * element shows nothing until it opens: an app opens it from its own control
 * with `show()` or the `open` attribute (a `<label for>` pointing at it opens
 * it too), and shows the value where it likes. The dialog is a native
 * `<dialog>` in the element's shadow root shown with `showModal()`: the page
 * outside is inert, and focus goes back to whatever opened it.
 *
 * The value is a 24-hour time, `HH:MM`, or `HH:MM:SS` when `step` is under a
 * minute, as on `<input type=time>`; empty is `""`. The dial starts on the
 * value, or on the current time when there is none.
 *
 * The dial edits a draft (FLO-288): `input` is dispatched with `{ value }`
 * as it moves, and OK commits it, dispatching `change` with `{ value }` when
 * the time differs; Cancel, Escape and the backdrop discard it. `open`
 * reflects the dialog's state, as on `<dialog open>`; `open` and `close` are
 * dispatched as it opens and closes (not when the attribute is what changed).
 *
 * `step` is in seconds, as on `<input type=time>`: under a minute it shows
 * seconds and is their step (`secondStep`); from a minute up it is the
 * minute step (`minuteStep`), rounded to whole minutes, which is the finest
 * the dial has. `show-seconds` shows seconds whatever the step, so a 5- or
 * 15-minute step can go with them; the value is then `HH:MM:SS`. `min` and
 * `max` are the factory's `minTime` and `maxTime`. Those four and `name` have
 * no setter: changing one recreates the picker, keeping the value. `disabled` is the factory's: it does not open. The
 * element reports `required` itself, as `valueMissing`.
 *
 * Parts: `time-picker`, `dialog`, `title`, `selectors`, `hours`, `minutes`, `period`, `dial`,
 * `dial-handle`, `actions`, `cancel`, `confirm`, among others.
 *
 * @module elements
 */

import createTimePicker from "../components/timepicker";
import {
  TIME_FORMAT, TIME_PICKER_ORIENTATION, TIME_PICKER_TYPE,
  type TimePickerComponent, type TimePickerConfig, type TimePickerValueEvent,
} from "../components/timepicker/types";
import { createEmitter, type EventCallback } from "../core/state/emitter";
import { defineElement, type DefineOptions, type ElementHost, type ElementInstance, type ElementSpec } from "./define";

/** The time picker as the element sees it: its value can be empty. */
export interface TimepickerElementComponent {
  element: HTMLElement;
  picker: TimePickerComponent;
  /** The committed time, or "" before one is set or confirmed. */
  getValue: () => string;
  setValue: (value: string) => void;
  /** Opens the dialog, unless the picker is disabled. */
  show: () => void;
  /** Closes the dialog without committing. */
  close: () => void;
  isOpen: () => boolean;
  required: boolean;
  /** In `material` 3.0.0 `on` and `off` take the time picker's event map: any other name is a type error, and each handler's argument is typed. */
  on: (event: string, handler: EventCallback) => void;
  off: (event: string, handler: EventCallback) => void;
  destroy: () => void;
}

interface TimepickerElementConfig extends TimePickerConfig {
  step?: number;
  required?: boolean;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

/** `step` in seconds to the dial's steps. */
const steps = (step: number | undefined): Partial<TimePickerConfig> => {
  if (!step || step <= 0) return {};
  if (step < 60) return { showSeconds: true, secondStep: Math.round(step) || 1 };
  return { minuteStep: Math.round(step / 60) };
};

/**
 * The factory keeps the draft and the committed time (FLO-288), but always
 * holds a time: the element adds only whether its value is empty, as
 * `<input type=time>`'s can be. The first OK fills it, with a `change` even
 * when the factory's committed time did not move.
 */
const create = (config: TimepickerElementConfig): TimepickerElementComponent => {
  const { step, required, value, ...rest } = config;
  const initial = value && TIME.test(value) ? value : "";
  const picker = createTimePicker({ ...rest, ...steps(step), value: initial || undefined });
  const changes = createEmitter();
  let empty = !initial;
  const onChange = (event: TimePickerValueEvent): void => {
    empty = false;
    changes.emit("change", event);
  };
  const onConfirm = (time: string): void => {
    if (empty) onChange({ value: time });
  };
  picker.on("change", onChange);
  picker.on("confirm", onConfirm);

  return {
    element: picker.element,
    picker,
    getValue: () => (empty ? "" : picker.getValue()),
    setValue: (next) => {
      if (next && TIME.test(next)) {
        empty = false;
        picker.setValue(next);
      } else {
        empty = true;
      }
    },
    show: () => void picker.open(),
    close: () => void picker.close(),
    isOpen: () => picker.isOpen,
    required: !!required,
    // `change` is the element's; the rest are the factory's own.
    on: (event, handler) => void (event === "change" ? changes.on(event, handler) : picker.on(event as "input", handler as (e: TimePickerValueEvent) => void)),
    off: (event, handler) => void (event === "change" ? changes.off(event, handler) : picker.off(event as "input", handler as (e: TimePickerValueEvent) => void)),
    destroy: () => {
      picker.off("change", onChange);
      picker.off("confirm", onConfirm);
      changes.clear();
      picker.destroy();
    },
  };
};

const hosts = new WeakMap<TimepickerElementComponent, ElementHost<TimepickerElementComponent>>();

let missing: string | null = null;
/** The browser's own message for a required time left empty. */
const valueMissingMessage = (): string =>
  (missing ??= Object.assign(document.createElement("input"), { type: "time", required: true }).validationMessage ||
    "Please fill out this field.");

const validate = (c: TimepickerElementComponent): void => {
  const internals = hosts.get(c)?.internals;
  if (!internals) return;
  if (c.required && !c.getValue()) internals.setValidity({ valueMissing: true }, valueMissingMessage());
  else internals.setValidity({});
};

const setValue = (c: TimepickerElementComponent, value: unknown): void => {
  c.setValue(value === null || value === undefined ? "" : String(value));
  validate(c);
};

const setDisabled = (c: TimepickerElementComponent, disabled: boolean): void =>
  void (disabled ? c.picker.disable() : c.picker.enable());

/** Opens or closes the dialog; `open` then says whether it did (a disabled picker stays closed). */
const setOpen = (c: TimepickerElementComponent, open: boolean, host: HTMLElement): void => {
  if (open) c.show();
  else c.close();
  host.toggleAttribute("open", c.isOpen());
};

const timepickerSpec = {
  name: "timepicker",
  create: (config) => create(config as TimepickerElementConfig),
  styles: ["timepicker"],
  // Nothing shows until the dialog opens, which is in the top layer.
  hostStyles: ":host{display:contents}",
  attributes: {
    // The default value; not called once the element is dirty.
    value: { type: "string", config: "value", update: (c, v) => setValue(c, v) },
    format: {
      type: "string",
      config: "format",
      update: (c, v) => void c.picker.setFormat(v === "24h" ? TIME_FORMAT.MILITARY : TIME_FORMAT.AMPM),
    },
    type: {
      type: "string",
      config: "type",
      update: (c, v) => void c.picker.setType(v === "input" ? TIME_PICKER_TYPE.INPUT : TIME_PICKER_TYPE.DIAL),
    },
    orientation: {
      type: "string",
      config: "orientation",
      update: (c, v) =>
        void c.picker.setOrientation(v === "horizontal" ? TIME_PICKER_ORIENTATION.HORIZONTAL : TIME_PICKER_ORIENTATION.VERTICAL),
    },
    // The factory's limits, steps and seconds are read once: a change recreates it.
    min: { type: "string", config: "minTime" },
    max: { type: "string", config: "maxTime" },
    step: { type: "number", config: "step" },
    "show-seconds": { type: "boolean", config: "showSeconds" },
    label: { type: "string", config: "title", update: (c, v) => void c.picker.setTitle(v === null ? "" : String(v)) },
    required: {
      type: "boolean",
      config: "required",
      update: (c, v) => {
        c.required = !!v;
        validate(c);
      },
    },
    disabled: { type: "boolean", config: "disabled", update: (c, v) => setDisabled(c, !!v) },
    open: { type: "boolean", update: (c, v, host) => setOpen(c, !!v, host) },
  },
  properties: {
    value: { get: (c): string => c.getValue(), set: setValue },
  },
  model: "value" as const,
  methods: ["show", "close"] as const,
  events: {
    change: { detail: (payload) => ({ value: (payload as TimePickerValueEvent).value }) },
    // The draft, live, as the dial and the fields move.
    input: { detail: (payload) => ({ value: (payload as TimePickerValueEvent).value }) },
    open: { detail: () => null, state: true },
    close: { detail: () => null, state: true },
  },
  form: {
    value: (c) => c.getValue(),
    events: ["change"],
    activate: (c) => c.show(),
    state: (c) => c.getValue(),
    restore: (c, state) => setValue(c, state),
    disable: (c, disabled) => setDisabled(c, disabled),
  },
  setup: (host, c) => {
    hosts.set(c, host);
    validate(c);
    // `open` reflects the dialog's state, as on <dialog>.
    const reflect = (): void => void host.toggleAttribute("open", c.isOpen());
    const onChange = (): void => validate(c);
    c.on("open", reflect);
    c.on("close", reflect);
    c.on("change", onChange);
    // The input mode's native `input` events are composed and would reach the
    // host beside the element's own `input`, which carries the time.
    const stop = (event: Event): void => event.stopPropagation();
    c.element.addEventListener("input", stop);
    if (host.hasAttribute("open")) setOpen(c, true, host);
    return () => {
      c.off("open", reflect);
      c.off("close", reflect);
      c.off("change", onChange);
      c.element.removeEventListener("input", stop);
    };
  },
} satisfies ElementSpec<TimepickerElementComponent>;

export const timepickerElement = defineElement<TimepickerElementComponent>(timepickerSpec);
export type TimepickerSpec = typeof timepickerSpec;
/** `<m-timepicker>` as a ref or a query returns it. */
export type TimepickerElement = ElementInstance<TimepickerSpec, TimepickerElementComponent>;

/** Registers `<m-timepicker>` (or `<prefix-timepicker>`). */
export const defineTimepicker = (options?: DefineOptions): string => timepickerElement.define(options);

declare global {
  /** `document.querySelector("m-…")` and `createElement` return the element's type (the default prefix). */
  interface HTMLElementTagNameMap {
    "m-timepicker": TimepickerElement;
  }
}
