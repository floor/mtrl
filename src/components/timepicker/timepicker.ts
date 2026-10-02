// src/components/timepicker/timePicker.ts

import { pipe } from "../../core/compose";
import { createBase, withElement } from "../../core/compose/component";
import { withEvents, withLifecycle } from "../../core/compose/features";
import {
  TimePickerConfig,
  TimePickerComponent,
  TimeValue,
  TIME_PERIOD,
} from "./types";
import { createBaseConfig, getContainerConfig, getApiConfig } from "./config";
import { createTimePickerAPI } from "./api";
import { parseTime, formatFormValue } from "./utils";
import { createFormValue } from "../../core/dom/form-value";

/**
 * Creates a new TimePicker component
 * @param {TimePickerConfig} config - TimePicker configuration object
 * @returns {TimePickerComponent} TimePicker component instance
 */
let pickers = 0;

const createTimePicker = (
  config: TimePickerConfig = {}
): TimePickerComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    // Create base component with container element
    const baseComponent = pipe(
      createBase,
      withEvents(),
      withElement(getContainerConfig(baseConfig)),
      withLifecycle()
    )(baseConfig);

    // A native modal dialog (FLO-278): showModal() puts it in the top layer with
    // its ::backdrop scrim, makes the page inert and keeps focus inside, and its
    // cancel event is this picker's Escape. It was a portaled div with an inline
    // backdrop, no focus handling, and a document-wide Escape. `modalElement`
    // stays in the API and is the same element.
    baseConfig.titleId = `${baseConfig.prefix}-time-picker-${++pickers}__title`;
    const dialogElement = document.createElement("dialog");
    dialogElement.setAttribute("aria-labelledby", baseConfig.titleId);
    dialogElement.className = [
      `${baseConfig.prefix}-time-picker__dialog`,
      `${baseConfig.prefix}-time-picker__dialog--${baseConfig.type}`,
      `${baseConfig.prefix}-time-picker__dialog--${baseConfig.orientation}`,
      `${baseConfig.prefix}-time-picker__dialog--${baseConfig.format}`,
    ].join(" ");
    const modalElement = dialogElement;

    // In the component's own element unless a container is given, as the
    // other modals are (FLO-288): it was portaled to document.body, out of the
    // component's tree and any shadow root the component is in.
    const container =
      typeof baseConfig.container === "string"
        ? document.querySelector(baseConfig.container) || baseComponent.element
        : baseConfig.container || baseComponent.element;

    container.appendChild(modalElement);

    // Parse initial time value
    let timeValue: TimeValue;
    if (baseConfig.value) {
      timeValue = parseTime(baseConfig.value, baseConfig.format);
    } else {
      // Default to current time
      const now = new Date();
      timeValue = {
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: baseConfig.showSeconds ? now.getSeconds() : 0,
        period: now.getHours() >= 12 ? TIME_PERIOD.PM : TIME_PERIOD.AM,
      };
    }

    // A time picker renders no form control of its own, so without this it
    // submits nothing. It lives on the component's own element rather than in
    // the dialog, which is portaled to the body and outside any form. Always
    // 24-hour, whatever the picker displays.
    const formValue = createFormValue(
      baseComponent.element,
      baseConfig.name,
      formatFormValue(timeValue, baseConfig.showSeconds === true)
    );

    // Create time picker API
    const timePicker = createTimePickerAPI(
      baseComponent,
      modalElement,
      dialogElement,
      timeValue,
      baseConfig,
      getApiConfig(baseComponent),
      formValue
    );

    // Open time picker if initially open
    if (baseConfig.open) {
      setTimeout(() => timePicker.open(), 0);
    }

    return timePicker;
  } catch (error) {
    console.error("TimePicker creation error:", error);
    throw new Error(
      `Failed to create time picker: ${(error as Error).message}`
    );
  }
};

export default createTimePicker;
