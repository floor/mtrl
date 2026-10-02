// src/components/timepicker/types.ts
import type { ForwardedEventPayload } from "../../core/dom";
import type { NormalizedEvent } from "../../core/utils/mobile";

/** Normalized touch-end event emitted by the interactive root on touch devices. */
export type TimePickerTapPayload = NormalizedEvent;

/** Horizontal swipe emitted by the interactive root on touch devices. */
export interface TimePickerSwipePayload {
  direction: "left" | "right";
  deltaX: number;
  deltaY: number;
}

/**
 * The payload of `change` and `input`: the 24-hour value, the same shape as
 * the `<m-timepicker>` element's events (FLO-320).
 */
export interface TimePickerValueEvent {
  /** HH:MM, or HH:MM:SS with showSeconds */
  value: string;
}

/** Events emitted by the picker API and its interactive root. */
export interface TimePickerEvents {
  /**
   * The committed 24-hour value (HH:MM, or HH:MM:SS with showSeconds), also
   * submitted by the form: once when OK commits a different time. setValue is
   * silent (FLO-328). Moves on the dial or in the fields are `input` (FLO-288).
   */
  change: (event: TimePickerValueEvent) => void;
  /** The draft, as the dial, fields or AM/PM change it while the picker is open (FLO-288). */
  input: (event: TimePickerValueEvent) => void;
  /** The confirmed 24-hour value, matching getValue() and the submitted form value. */
  confirm: (value: string) => void;
  open: () => void;
  close: () => void;
  cancel: () => void;
  /** Root events; the dialog is inside the root (FLO-288), so its clicks and keys reach these too. */
  click: (payload: ForwardedEventPayload<MouseEvent, HTMLElement>) => void;
  keydown: (payload: ForwardedEventPayload<KeyboardEvent, HTMLElement>) => void;
  tap: (payload: TimePickerTapPayload) => void;
  swipe: (payload: TimePickerSwipePayload) => void;
}

/**
 * Time picker display type
 * @enum {string}
 */
export enum TIME_PICKER_TYPE {
  /** Clock dial-based time picker */
  DIAL = 'dial',
  /** Text input-based time picker */
  INPUT = 'input'
}

/**
 * Time picker orientation
 * @enum {string}
 */
export enum TIME_PICKER_ORIENTATION {
  /** Vertical layout (default on mobile) */
  VERTICAL = 'vertical',
  /** Horizontal layout */
  HORIZONTAL = 'horizontal'
}

/**
 * Time format (12-hour or 24-hour)
 * @enum {string}
 */
export enum TIME_FORMAT {
  /** 12-hour format with AM/PM */
  AMPM = '12h',
  /** 24-hour format */
  MILITARY = '24h'
}

/** A time format as the enum or its string value, `'12h'` or `'24h'` (FLO-323) */
export type TimeFormat = TIME_FORMAT | `${TIME_FORMAT}`;
/** A time picker type as the enum or its string value, `'dial'` or `'input'` */
export type TimePickerType = TIME_PICKER_TYPE | `${TIME_PICKER_TYPE}`;
/** An orientation as the enum or its string value, `'vertical'` or `'horizontal'` */
export type TimePickerOrientation = TIME_PICKER_ORIENTATION | `${TIME_PICKER_ORIENTATION}`;

/**
 * Period of day for 12-hour format
 * @enum {string}
 */
export enum TIME_PERIOD {
  /** Morning */
  AM = 'AM',
  /** Afternoon/Evening */
  PM = 'PM'
}

/**
 * Configuration interface for the TimePicker component
 * @category Components
 */
export interface TimePickerConfig {
  /**
   * Initial time value in 24-hour format (HH:MM)
   * @example '14:30'
   */
  value?: string;

  /**
   * Form field name. A time picker renders no form control of its own, so it
   * submits nothing unless this is set; with it, a hidden input on the
   * picker's element carries the current time as 24-hour `HH:mm` — or
   * `HH:mm:ss` when `showSeconds` is on — whatever format the picker displays.
   */
  name?: string;

  /**
   * Type of time picker to display
   * @default TIME_PICKER_TYPE.DIAL
   */
  // The enum or its string value, as the other components take theirs (FLO-323)
  type?: TimePickerType;

  /**
   * Time format to use (12h or 24h)
   * @default TIME_FORMAT.AMPM
   */
  format?: TimeFormat;

  /**
   * Layout orientation for the time picker
   * @default TIME_PICKER_ORIENTATION.VERTICAL
   */
  orientation?: TimePickerOrientation;

  /**
   * Title text for the time picker
   * @example 'Select departure time'
   */
  title?: string;

  /**
   * Whether to show seconds selector
   * @default false
   */
  showSeconds?: boolean;

  /**
   * Additional CSS classes to add to the time picker
   * @example 'custom-picker dark-theme'
   */
  class?: string;

  /**
   * Component prefix for class names
   * @default 'mtrl'
   */
  prefix?: string;

  /**
   * Component name used in class generation
   */
  componentName?: string;

  /**
   * Whether to close the picker when time is selected
   * @default true
   * @deprecated Never applied, and has no effect: the time picker is confirmed
   * with OK, as M3 specifies (FLO-281).
   */
  closeOnSelect?: boolean;

  /**
   * Earliest selectable time, 24-hour `HH:MM` or `HH:MM:SS`. Dial numbers and
   * AM/PM that cannot reach it are disabled, and a picked or typed time before
   * it moves up to it. `setValue` is not held to it.
   * @example '09:00'
   */
  minTime?: string;

  /**
   * Latest selectable time, 24-hour `HH:MM` or `HH:MM:SS`; as `minTime`, at the
   * other end.
   * @example '18:00'
   */
  maxTime?: string;

  /**
   * Minute step: dial minutes off it are disabled, a pointer between them picks
   * the nearest, and a typed minute rounds to it when committed.
   * @default 1
   */
  minuteStep?: number;

  /**
   * Second step, as `minuteStep`, when seconds are shown.
   * @default 1
   */
  secondStep?: number;

  /**
   * Custom text for cancel button
   * @default 'Cancel'
   */
  cancelText?: string;

  /**
   * Custom text for confirm button
   * @default 'OK'
   */
  confirmText?: string;

  /**
   * Whether the time picker is initially visible (for inline mode)
   * In 1.0 this option is named `open`.
   * @default false
   */
  isOpen?: boolean;

  /**
   * Whether the picker is disabled: it does not open (FLO-288)
   * @default false
   */
  disabled?: boolean;

  /**
   * Where the dialog is appended. By default it stays in the component's own
   * element, as the other modals' do (FLO-288); it was document.body.
   * @default the component's element
   */
  container?: string | HTMLElement;

  /**
   * Custom icon for the clock button
   */
  clockIcon?: string;

  /**
   * Custom icon for the keyboard button
   */
  keyboardIcon?: string;

  /**
   * Callback when the user commits a new time (on OK; setValue is silent); receives
   * HH:MM or HH:MM:SS in 24-hour format
   */
  onChange?: (event: TimePickerValueEvent) => void;

  /**
   * Callback as the draft changes while the picker is open (FLO-288)
   */
  onInput?: (event: TimePickerValueEvent) => void;

  /**
   * Callback when time picker is opened
   */
  onOpen?: () => void;

  /**
   * Callback when time picker is closed
   */
  onClose?: () => void;

  /**
   * Callback when time is confirmed; receives the same 24-hour value as getValue().
   * In 1.0 it receives `{ value }`, the object a `confirm` listener receives.
   */
  onConfirm?: (time: string) => void;

  /**
   * Callback when time picker is canceled
   */
  onCancel?: () => void;
}

/**
 * Configuration as it leaves `createBaseConfig`.
 *
 * `TimePickerConfig` marks these optional because a caller may omit them.
 * Once the defaults have been merged they are all present, and everything
 * downstream — the renderer, the clock dial, the API — reads them as such.
 * Saying so here is what lets that hold without each reader guessing.
 * @category Components
 * @internal
 */
export type ResolvedTimePickerConfig = TimePickerConfig &
  Required<
    Pick<
      TimePickerConfig,
      | "type"
      | "format"
      | "orientation"
      | "showSeconds"
      | "closeOnSelect"
      | "minuteStep"
      | "secondStep"
      | "cancelText"
      | "confirmText"
      | "isOpen"
      | "clockIcon"
      | "keyboardIcon"
      | "prefix"
    >
  > & {
    /** The dialog title's id, unique per picker (FLO-278). */
    titleId?: string;
  };

/**
 * Time value object
 * @category Components
 */
export interface TimeValue {
  /** Hours (0-23) */
  hours: number;
  /** Minutes (0-59) */
  minutes: number;
  /** Seconds (0-59), optional */
  seconds?: number;
  /** AM/PM for 12-hour format */
  period?: TIME_PERIOD;
}

/**
 * TimePicker component interface
 * @category Components
 */
export interface TimePickerComponent {
  /** The time picker's container DOM element */
  element: HTMLElement;

  /** Modal container element */
  modalElement: HTMLElement;

  /** Dialog container element */
  dialogElement: HTMLElement;

  /** Whether the time picker is currently open. In 1.0 it is a method: `isOpen()`. */
  isOpen: boolean;

  /**
   * Opens the time picker
   * @returns The time picker component for chaining
   */
  open: () => TimePickerComponent;

  /**
   * Closes the time picker
   * @returns The time picker component for chaining
   */
  close: () => TimePickerComponent;

  /**
   * Toggles the time picker open/closed state
   * @returns The time picker component for chaining
   */
  toggle: () => TimePickerComponent;

  /**
   * Gets the current time value
   * @returns Current time string in 24-hour format (HH:MM, or HH:MM:SS when showSeconds is true)
   */
  getValue: () => string;

  /**
   * Gets the current time as a TimeValue object
   * @returns Current time object with hours, minutes, seconds, and period
   */
  getTimeObject: () => TimeValue;

  /**
   * Sets the time value. Silent: neither `change` nor onChange
   * @param time - Time string in 24-hour format (HH:MM or HH:MM:SS)
   * @returns The time picker component for chaining
   */
  setValue: (time: string) => TimePickerComponent;

  /**
   * Sets the time picker type (dial or input)
   * @param type - Time picker type
   * @returns The time picker component for chaining
   */
  setType: (type: TimePickerType) => TimePickerComponent;

  /**
   * Gets the current time picker type
   * @returns Current time picker type
   */
  getType: () => TIME_PICKER_TYPE;

  /**
   * Sets the time format (12h or 24h)
   * @param format - Time format
   * @returns The time picker component for chaining
   */
  setFormat: (format: TimeFormat) => TimePickerComponent;

  /**
   * Gets the current time format
   * @returns Current time format
   */
  getFormat: () => TIME_FORMAT;

  /**
   * Sets the time picker orientation
   * @param orientation - Time picker orientation
   * @returns The time picker component for chaining
   */
  setOrientation: (orientation: TimePickerOrientation) => TimePickerComponent;

  /**
   * Gets the current time picker orientation
   * @returns Current time picker orientation
   */
  getOrientation: () => TIME_PICKER_ORIENTATION;

  /**
   * Sets the time picker title
   * @param title - Title text
   * @returns The time picker component for chaining
   */
  setTitle: (title: string) => TimePickerComponent;

  /**
   * Gets the current time picker title
   * @returns Current title text
   */
  getTitle: () => string;

  /** Enables the picker (FLO-288) */
  enable: () => TimePickerComponent;

  /** Disables the picker: it does not open, and an open one is cancelled */
  disable: () => TimePickerComponent;

  /** Whether the picker is disabled */
  isDisabled: () => boolean;

  /**
   * Destroys the time picker component and cleans up resources
   */
  destroy: () => void;

  /**
   * Adds an event listener to the time picker
   * @param event - Event name ('change', 'open', 'close', etc.)
   * @param handler - Event handler function
   * @returns The time picker component for chaining
   */
  on: <K extends keyof TimePickerEvents>(event: K, handler: TimePickerEvents[K]) => TimePickerComponent;

  /**
   * Removes an event listener from the time picker
   * @param event - Event name
   * @param handler - Event handler function
   * @returns The time picker component for chaining
   */
  off: <K extends keyof TimePickerEvents>(event: K, handler: TimePickerEvents[K]) => TimePickerComponent;
}