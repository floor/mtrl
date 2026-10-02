// src/components/timePicker/api.ts

import { 
  TimePickerComponent, 
  ResolvedTimePickerConfig, 
  TimeValue,
  TIME_PICKER_TYPE,
  TIME_PICKER_ORIENTATION,
  TIME_FORMAT,
  TIME_PERIOD
} from './types';
import { TIMEPICKER_EVENTS as EVENTS } from './constants';
import { formatFormValue } from './utils';
import { renderTimePicker } from './render';
import type { TimePickerEvents, TimeFormat, TimePickerType, TimePickerOrientation } from './types';
import type { EventCallback } from '../../core/state/emitter';
import type { ElementComponent } from '../../core/compose/component';
import { setFormValue } from '../../core/dom/form-value';
import { deepActiveElement } from '../../core/dom/focus';

interface ApiOptions {
  events: {
    on: (event: string, handler: EventCallback) => void;
    off: (event: string, handler: EventCallback) => void;
    emit: (event: string, data?: unknown) => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Creates the API for TimePicker component
 * 
 * @param baseComponent - Base component with element and events
 * @param modalElement - Modal overlay element
 * @param dialogElement - Dialog content element
 * @param timeValue - Current time value
 * @param config - Component configuration
 * @param options - API options with events and lifecycle methods
 * @returns TimePicker component API
 */
export const createTimePickerAPI = (
  baseComponent: ElementComponent,
  modalElement: HTMLElement,
  dialogElement: HTMLElement,
  timeValue: TimeValue,
  config: ResolvedTimePickerConfig,
  options: ApiOptions,
  formValue: HTMLInputElement | null = null
): TimePickerComponent => {
  // A draft and a committed value (FLO-288). The renderer edits `timeValue`
  // in place: that is the draft, shown while the picker is open. OK commits
  // it; Cancel, Escape and the backdrop put the committed value back. M3's
  // Cancel discards, as the date picker's does; here every move of the dial
  // was the value, with a `change` each time, and Cancel kept it.
  let committed: TimeValue = { ...timeValue };
  const format = (time: TimeValue) => formatFormValue(time, config.showSeconds === true);
  const getValue = () => format(committed);
  // The committed value changed: the form, then `change`.
  const notifyChange = () => {
    const value = getValue();
    setFormValue(formValue, value);
    options.events.emit(EVENTS.CHANGE, { value });
  };
  // The draft changed: `input`, as a native input's.
  const notifyInput = () => {
    const event = { value: getValue(), draftValue: format(timeValue) };
    options.events.emit(EVENTS.INPUT, event);
  };
  const render = () => {
    renderTimePicker(dialogElement, timeValue, config, notifyInput);
    setFormValue(formValue, getValue());
  };
  const restoreDraft = () => {
    Object.assign(timeValue, committed);
    render();
  };
  const commit = () => {
    const before = getValue();
    committed = { ...timeValue };
    if (getValue() !== before) notifyChange();
  };
  let disabled = config.disabled === true;
  const markDisabled = () => {
    baseComponent.element.classList.toggle(`${config.prefix}-time-picker--disabled`, disabled);
    if (disabled) baseComponent.element.setAttribute("aria-disabled", "true");
    else baseComponent.element.removeAttribute("aria-disabled");
  };
  markDisabled();
  // Selectors from the picker's own prefix: TIMEPICKER_SELECTORS spells `.mtrl-`,
  // so with a custom prefix cancel, confirm, the toggle and setTitle found
  // nothing. FLO-278.
  const part = (name: string) => `.${config.prefix}-time-picker__${name}`;
  const dialog = dialogElement as HTMLDialogElement;
  // Track open state
  let isOpen = false;
  let returnFocus: HTMLElement | null = null;

  // Cancel discards the draft. The event goes out while the picker is still
  // open, as confirm's does.
  const cancel = () => {
    restoreDraft();
    options.events.emit(EVENTS.CANCEL);
    timePickerAPI.close();
  };
  // OK commits the draft: one `change` if it differs, then `confirm`, both
  // while the picker is open; it emitted confirm after closing (FLO-288).
  const confirm = () => {
    commit();
    options.events.emit(EVENTS.CONFIRM, { value: getValue() });
    timePickerAPI.close();
  };
  // Escape reaches this picker only, through its dialog's cancel event; it was a
  // document listener that closed every open picker. FLO-278.
  const handleCancel = (event: Event) => {
    event.preventDefault();
    cancel();
  };
  // A click on the backdrop lands on the dialog element itself, outside its box.
  const handleClickOutside = (event: MouseEvent) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) cancel();
  };
  const focusField = () => {
    const field = dialog.querySelector<HTMLElement>('[data-active="true"]') ?? dialog.querySelector<HTMLElement>('input, button');
    field?.focus();
  };
  
  // Create time picker API
  const timePickerAPI: TimePickerComponent = {
    element: baseComponent.element,
    modalElement,
    dialogElement,

    // A method, as on every overlay (FLO-548); it was a getter property.
    isOpen: () => isOpen,

    
    open() {
      if (isOpen || disabled) return this;
      // Each opening edits a fresh draft of the committed value.
      restoreDraft();
      // The dialog is in the component's own element (FLO-288); an app that
      // only calls open() never put that element in the page.
      if (!baseComponent.element.isConnected && !dialog.isConnected) document.body.append(baseComponent.element);
      
      // Whatever really had focus, through any shadow roots (FLO-284).
      const active = deepActiveElement();
      returnFocus = active instanceof HTMLElement && active !== document.body ? active : null;
      // The top layer, scrim and inert page are the browser's; environments
      // without dialog methods still get the open state.
      if (typeof dialog.showModal === 'function' && dialog.isConnected) dialog.showModal();
      else dialog.setAttribute('open', '');
      dialogElement.classList.add('active');
      focusField();
      
      // Update state
      isOpen = true;
      baseComponent.element.classList.add(`${config.prefix}-time-picker--open`);
      
      options.events.emit(EVENTS.OPEN);
      
      return this;
    },
    
    close() {
      if (!isOpen) return this;
      
      dialogElement.classList.remove('active');
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
      if (returnFocus?.isConnected) returnFocus.focus();
      returnFocus = null;
      
      // Update state
      isOpen = false;
      baseComponent.element.classList.remove(`${config.prefix}-time-picker--open`);
      
      options.events.emit(EVENTS.CLOSE);
      
      return this;
    },
    
    toggle() {
      return isOpen ? this.close() : this.open();
    },
    
    getValue() {
      return getValue();
    },
    
    getTimeObject() {
      return { ...committed };
    },
    
    setValue(time: string) {
      try {
        // Parse time string (throw error if invalid)
        const parsedTime = time.split(':');
        const hours = parseInt(parsedTime[0], 10);
        const minutes = parseInt(parsedTime[1], 10);
        const seconds = parsedTime[2] ? parseInt(parsedTime[2], 10) : 0;
        
        if (
          isNaN(hours) || hours < 0 || hours > 23 ||
          isNaN(minutes) || minutes < 0 || minutes > 59 ||
          isNaN(seconds) || seconds < 0 || seconds > 59
        ) {
          throw new Error('Invalid time format. Use HH:MM or HH:MM:SS (24-hour format).');
        }

        // Update time value: committed, and the draft with it
        timeValue.hours = hours;
        timeValue.minutes = minutes;
        timeValue.seconds = seconds;
        timeValue.period = hours >= 12 ? TIME_PERIOD.PM : TIME_PERIOD.AM;
        
        committed = { ...timeValue };

        // Re-render time picker, which writes the form value. Silently: a
        // value set by script emits neither `change` nor onChange, as a
        // native input's; OK does (FLO-328).
        render();
      } catch (error) {
        console.error('Error setting time value:', error);
      }
      
      return this;
    },
    
    setType(type: TimePickerType) {
      if (config.type === type) return this;
      
      // Update config
      config.type = type;
      
      // Update class
      dialogElement.classList.remove(
        `${config.prefix}-time-picker__dialog--${TIME_PICKER_TYPE.DIAL}`,
        `${config.prefix}-time-picker__dialog--${TIME_PICKER_TYPE.INPUT}`
      );
      dialogElement.classList.add(`${config.prefix}-time-picker__dialog--${type}`);
      
      // Re-render time picker
      render();
      
      return this;
    },
    
    getType() {
      // A string value is the enum's own: the same string at runtime
      return config.type as TIME_PICKER_TYPE;
    },
    
    setFormat(format: TimeFormat) {
      if (config.format === format) return this;
      
      // Update config
      config.format = format;
      
      // Update class
      dialogElement.classList.remove(
        `${config.prefix}-time-picker__dialog--${TIME_FORMAT.AMPM}`,
        `${config.prefix}-time-picker__dialog--${TIME_FORMAT.MILITARY}`
      );
      dialogElement.classList.add(`${config.prefix}-time-picker__dialog--${format}`);
      
      // Adjust time value if needed
      if (format === TIME_FORMAT.MILITARY) {
        // No need to change the hours, just ensure period is set correctly
        timeValue.period = timeValue.hours >= 12 ? TIME_PERIOD.PM : TIME_PERIOD.AM;
      } else {
        // Convert 24h to 12h display (though internally we keep 24h)
        timeValue.period = timeValue.hours >= 12 ? TIME_PERIOD.PM : TIME_PERIOD.AM;
      }
      
      // Re-render time picker. The value is 24-hour whatever the display, so a
      // format change is not a change of value, and emits nothing: it emitted
      // `change` without calling onChange. FLO-281.
      render();
      
      return this;
    },
    
    getFormat() {
      return config.format as TIME_FORMAT;
    },
    
    setOrientation(orientation: TimePickerOrientation) {
      if (config.orientation === orientation) return this;
      
      // Update config
      config.orientation = orientation;
      
      // Update class
      dialogElement.classList.remove(
        `${config.prefix}-time-picker__dialog--${TIME_PICKER_ORIENTATION.VERTICAL}`,
        `${config.prefix}-time-picker__dialog--${TIME_PICKER_ORIENTATION.HORIZONTAL}`
      );
      dialogElement.classList.add(`${config.prefix}-time-picker__dialog--${orientation}`);
      
      // Re-render time picker
      render();
      
      return this;
    },
    
    getOrientation() {
      return config.orientation as TIME_PICKER_ORIENTATION;
    },
    
    setTitle(title: string) {
      config.title = title;
      
      // Update title element if it exists
      const titleElement = dialogElement.querySelector(part('title'));
      if (titleElement) {
        titleElement.textContent = title;
      } else {
        // Re-render to add title
        render();
      }
      
      return this;
    },
    
    getTitle() {
      return config.title || '';
    },

    // A disabled picker does not open (FLO-288); disabling closes an open one.
    enable() {
      disabled = false;
      markDisabled();
      return this;
    },

    disable() {
      if (isOpen) cancel();
      disabled = true;
      markDisabled();
      return this;
    },

    isDisabled() {
      return disabled;
    },
    
    destroy() {
      // Close if open
      if (isOpen) {
        this.close();
      }
      
      // Remove from DOM
      if (modalElement && modalElement.parentNode) {
        modalElement.parentNode.removeChild(modalElement);
      }
      
      // Call lifecycle destroy
      options.lifecycle.destroy();
    },
    
    on<K extends keyof TimePickerEvents>(event: K, handler: TimePickerEvents[K]) {
      options.events.on(event, handler);
      return this;
    },
    
    off<K extends keyof TimePickerEvents>(event: K, handler: TimePickerEvents[K]) {
      options.events.off(event, handler);
      return this;
    }
  };
  
  // Set up event handlers for the time picker dialog
  dialogElement.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    // Handle cancel button click
    if (target.closest(part('cancel'))) cancel();
    
    // Handle confirm button click
    if (target.closest(part('confirm'))) confirm();
    
    // Handle toggle type button click (switch between dial and input)
    if (target.closest(part('toggle-type'))) {
      const newType = config.type === TIME_PICKER_TYPE.DIAL 
        ? TIME_PICKER_TYPE.INPUT 
        : TIME_PICKER_TYPE.DIAL;
      timePickerAPI.setType(newType);
      // The re-render replaced the toggle; keep focus where the person pressed,
      // or on the hour field when they switched to typing.
      const next = newType === TIME_PICKER_TYPE.INPUT ? dialogElement.querySelector<HTMLInputElement>(part('hours')) : dialogElement.querySelector<HTMLElement>(part('toggle-type'));
      next?.focus();
      if (next instanceof HTMLInputElement) next.select();
    }
    
  });

  dialog.addEventListener('cancel', handleCancel);
  // The dialog is in the component's element, which can sit in a form: Enter
  // in its fields moves between them and must not submit that form.
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target instanceof HTMLInputElement) event.preventDefault();
  });
  dialog.addEventListener('click', handleClickOutside);

  // The initial render uses the same synchronization path as later renders.
  render();
  // A config option is the listener registered at creation, ahead of any
  // listener the caller adds afterwards.
  if (config.onChange) timePickerAPI.on(EVENTS.CHANGE, config.onChange);
  if (config.onInput) timePickerAPI.on(EVENTS.INPUT, config.onInput);
  if (config.onOpen) timePickerAPI.on(EVENTS.OPEN, config.onOpen);
  if (config.onClose) timePickerAPI.on(EVENTS.CLOSE, config.onClose);
  if (config.onCancel) timePickerAPI.on(EVENTS.CANCEL, config.onCancel);
  if (config.onConfirm) timePickerAPI.on(EVENTS.CONFIRM, config.onConfirm);
  return timePickerAPI;
};
