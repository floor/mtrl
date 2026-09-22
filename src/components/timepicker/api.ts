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
import { TIMEPICKER_EVENTS as EVENTS, TIMEPICKER_SELECTORS as SELECTORS } from './constants';
import { formatFormValue } from './utils';
import { renderTimePicker } from './render';
import { renderClockDial } from './clockdial';
import type { TimePickerEvents } from './types';
import type { EventCallback } from '../../core/state/emitter';
import type { ElementComponent } from '../../core/compose/component';
import { setFormValue } from '../../core/dom/form-value';

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
  const getValue = () => formatFormValue(timeValue, config.showSeconds === true);
  // Renderer interactions update timeValue in place. Synchronize submission
  // before notifying consumers, without replacing the focused input/radio.
  const notifyChange = () => {
    const value = getValue();
    setFormValue(formValue, value);
    options.events.emit(EVENTS.CHANGE, value);
    config.onChange?.(value);
  };
  const render = () => {
    renderTimePicker(dialogElement, timeValue, config, notifyChange);
    setFormValue(formValue, getValue());
  };
  // Track open state
  let isOpen = !!config.isOpen;
  
  // Create event handlers
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      timePickerAPI.close();
      options.events.emit(EVENTS.CANCEL);
    }
  };
  
  const handleClickOutside = (event: MouseEvent) => {
    if (event.target === modalElement) {
      timePickerAPI.close();
    }
  };
  
  // Create time picker API
  const timePickerAPI: TimePickerComponent = {
    element: baseComponent.element,
    modalElement,
    dialogElement,

    // A getter, not a copy. `isOpen` was read off the closure once, at the
    // moment this object was built, so the property never moved off its
    // initial value however many times the picker was opened -- while the
    // closure the methods read stayed correct, which is why open, close and
    // toggle all behaved and only the reported state was wrong.
    get isOpen() {
      return isOpen;
    },

    
    open() {
      if (isOpen) return this;
      
      // Show modal
      modalElement.style.display = 'block';
      
      // Add the active class to trigger animations
      // We need to force a reflow before adding the active class for the transition to work
      void modalElement.offsetWidth; // Force reflow
      modalElement.classList.add('active');
      dialogElement.classList.add('active');
      
      // Add event listeners
      document.addEventListener('keydown', handleKeydown);
      modalElement.addEventListener('click', handleClickOutside);
      
      // Update state
      isOpen = true;
      baseComponent.element.classList.add(`${config.prefix}-time-picker--open`);
      
      // Refresh the dial's theme after opening, keeping the live inputs and
      // their focus/selection intact. A delayed full render lost quick edits.
      const canvas = dialogElement.querySelector<HTMLCanvasElement>(SELECTORS.DIAL_CANVAS);
      if (canvas && config.type === TIME_PICKER_TYPE.DIAL) {
        const active = dialogElement.querySelector('[data-active="true"]')?.getAttribute('data-type');
        renderClockDial(canvas, timeValue, {
          ...config,
          activeSelector: active === 'minute' || active === 'second' ? active : 'hour'
        });
      }

      // Emit open event
      options.events.emit(EVENTS.OPEN);
      
      // Call onOpen callback if provided
      if (config.onOpen) {
        config.onOpen();
      }
      
      return this;
    },
    
    close() {
      if (!isOpen) return this;
      
      // Remove active classes to trigger fade-out transition
      modalElement.classList.remove('active');
      dialogElement.classList.remove('active');
      
      // Use setTimeout to let the transition finish before hiding completely
      setTimeout(() => {
        // Hide modal
        modalElement.style.display = 'none';
      }, 300); // Match the transition duration
      
      // Remove event listeners
      document.removeEventListener('keydown', handleKeydown);
      modalElement.removeEventListener('click', handleClickOutside);
      
      // Update state
      isOpen = false;
      baseComponent.element.classList.remove(`${config.prefix}-time-picker--open`);
      
      // Emit close event
      options.events.emit(EVENTS.CLOSE);
      
      // Call onClose callback if provided
      if (config.onClose) {
        config.onClose();
      }
      
      return this;
    },
    
    toggle() {
      return isOpen ? this.close() : this.open();
    },
    
    getValue() {
      return getValue();
    },
    
    getTimeObject() {
      return { ...timeValue };
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
        
        // Update time value
        timeValue.hours = hours;
        timeValue.minutes = minutes;
        timeValue.seconds = seconds;
        timeValue.period = hours >= 12 ? TIME_PERIOD.PM : TIME_PERIOD.AM;
        
        // Re-render time picker
        render();
        
        // Emit change event
        options.events.emit(EVENTS.CHANGE, this.getValue());
        
        // Call onChange callback if provided
        if (config.onChange) {
          config.onChange(this.getValue());
        }
      } catch (error) {
        console.error('Error setting time value:', error);
      }
      
      return this;
    },
    
    setType(type: TIME_PICKER_TYPE) {
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
      return config.type;
    },
    
    setFormat(format: TIME_FORMAT) {
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
      
      // Re-render time picker
      render();
      
      // Emit change event
      options.events.emit(EVENTS.CHANGE, this.getValue());
      
      return this;
    },
    
    getFormat() {
      return config.format;
    },
    
    setOrientation(orientation: TIME_PICKER_ORIENTATION) {
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
      return config.orientation;
    },
    
    setTitle(title: string) {
      config.title = title;
      
      // Update title element if it exists
      const titleElement = dialogElement.querySelector(SELECTORS.TITLE);
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
    if (target.closest(SELECTORS.CANCEL_BUTTON)) {
      timePickerAPI.close();
      options.events.emit(EVENTS.CANCEL);
      
      // Call onCancel callback if provided
      if (config.onCancel) {
        config.onCancel();
      }
    }
    
    // Handle confirm button click
    if (target.closest(SELECTORS.CONFIRM_BUTTON)) {
      timePickerAPI.close();
      options.events.emit(EVENTS.CONFIRM, timePickerAPI.getValue());
      
      // Call onConfirm callback if provided
      if (config.onConfirm) {
        config.onConfirm(timePickerAPI.getValue());
      }
    }
    
    // Handle toggle type button click (switch between dial and input)
    if (target.closest(SELECTORS.TOGGLE_TYPE_BUTTON)) {
      const newType = config.type === TIME_PICKER_TYPE.DIAL 
        ? TIME_PICKER_TYPE.INPUT 
        : TIME_PICKER_TYPE.DIAL;
      timePickerAPI.setType(newType);
    }
    
  });

  // The initial render uses the same synchronization path as later renders.
  render();
  return timePickerAPI;
};
