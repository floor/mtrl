// src/components/timePicker/api.ts

import { 
  TimePickerComponent, 
  TimePickerConfig, 
  TimeValue,
  TIME_PICKER_TYPE,
  TIME_PICKER_ORIENTATION,
  TIME_FORMAT,
  TIME_PERIOD
} from './types';
import { EVENTS, SELECTORS } from './config';
import { formatTime, padZero } from './utils';
import { renderTimePicker } from './render';
import { renderClockDial, getTimeValueFromClick } from './clockdial';

interface ApiOptions {
  events: {
    on: (event: string, handler: Function) => any;
    off: (event: string, handler: Function) => any;
    emit: (event: string, data?: any) => any;
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
  baseComponent: any,
  modalElement: HTMLElement,
  dialogElement: HTMLElement,
  timeValue: TimeValue,
  config: TimePickerConfig,
  options: ApiOptions
): TimePickerComponent => {
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
    isOpen,
    
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
      
      // Force re-render to ensure canvas is drawn after dialog is visible
      // This ensures the canvas has proper dimensions for rendering
      setTimeout(() => {
        renderTimePicker(dialogElement, timeValue, config);
      }, 50);
      
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
      return formatTime(timeValue, config.format === TIME_FORMAT.MILITARY);
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
        timeValue.period = hours >= 12 ? 'PM' : 'AM';
        
        // Re-render time picker
        renderTimePicker(dialogElement, timeValue, config);
        
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
        `${config.prefix}-time-picker-dialog--${TIME_PICKER_TYPE.DIAL}`,
        `${config.prefix}-time-picker-dialog--${TIME_PICKER_TYPE.INPUT}`
      );
      dialogElement.classList.add(`${config.prefix}-time-picker-dialog--${type}`);
      
      // Re-render time picker
      renderTimePicker(dialogElement, timeValue, config);
      
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
        `${config.prefix}-time-picker-dialog--${TIME_FORMAT.AMPM}`,
        `${config.prefix}-time-picker-dialog--${TIME_FORMAT.MILITARY}`
      );
      dialogElement.classList.add(`${config.prefix}-time-picker-dialog--${format}`);
      
      // Adjust time value if needed
      if (format === TIME_FORMAT.MILITARY) {
        // No need to change the hours, just ensure period is set correctly
        timeValue.period = timeValue.hours >= 12 ? 'PM' : 'AM';
      } else {
        // Convert 24h to 12h display (though internally we keep 24h)
        timeValue.period = timeValue.hours >= 12 ? 'PM' : 'AM';
      }
      
      // Re-render time picker
      renderTimePicker(dialogElement, timeValue, config);
      
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
        `${config.prefix}-time-picker-dialog--${TIME_PICKER_ORIENTATION.VERTICAL}`,
        `${config.prefix}-time-picker-dialog--${TIME_PICKER_ORIENTATION.HORIZONTAL}`
      );
      dialogElement.classList.add(`${config.prefix}-time-picker-dialog--${orientation}`);
      
      // Re-render time picker
      renderTimePicker(dialogElement, timeValue, config);
      
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
        renderTimePicker(dialogElement, timeValue, config);
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
    
    on(event: string, handler: Function) {
      options.events.on(event, handler);
      return this;
    },
    
    off(event: string, handler: Function) {
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
    
    if (target.closest(SELECTORS.PERIOD_AM)) {
      if (timeValue.period !== TIME_PERIOD.AM) {
        timeValue.period = TIME_PERIOD.AM;
        if (timeValue.hours >= 12) {
          timeValue.hours -= 12;
        }
        renderTimePicker(dialogElement, timeValue, config);
        options.events.emit(EVENTS.CHANGE, timePickerAPI.getValue());
        
        // Call onChange callback if provided
        if (config.onChange) {
          config.onChange(timePickerAPI.getValue());
        }
      }
    }

    if (target.closest(SELECTORS.PERIOD_PM)) {
      if (timeValue.period !== TIME_PERIOD.PM) {
        timeValue.period = TIME_PERIOD.PM;
        if (timeValue.hours < 12) {
          timeValue.hours += 12;
        }
        renderTimePicker(dialogElement, timeValue, config);
        options.events.emit(EVENTS.CHANGE, timePickerAPI.getValue());
        
        // Call onChange callback if provided
        if (config.onChange) {
          config.onChange(timePickerAPI.getValue());
        }
      }
    }
    
    // Handle canvas dial click
    if (target.closest(SELECTORS.DIAL_CANVAS)) {
      if (config.type === TIME_PICKER_TYPE.DIAL) {
        const canvas = target as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Determine active selector
        let activeSelector: 'hour' | 'minute' | 'second' = 'hour';
        const hoursEl = dialogElement.querySelector(SELECTORS.HOURS_INPUT);
        const minutesEl = dialogElement.querySelector(SELECTORS.MINUTES_INPUT);
        const secondsEl = dialogElement.querySelector(SELECTORS.SECONDS_INPUT);
        
        if (hoursEl && hoursEl.getAttribute('data-active') === 'true') {
          activeSelector = 'hour';
        } else if (minutesEl && minutesEl.getAttribute('data-active') === 'true') {
          activeSelector = 'minute';
        } else if (config.showSeconds && secondsEl && secondsEl.getAttribute('data-active') === 'true') {
          activeSelector = 'second';
        }
        
        // Get the time value from the click position
        const selectedValue = getTimeValueFromClick(canvas, x, y, {
          type: config.type,
          format: config.format,
          showSeconds: config.showSeconds,
          prefix: config.prefix,
          activeSelector
        });
        
        if (selectedValue !== null) {
          if (activeSelector === 'hour') {
            let newHours = selectedValue;
            
            // Adjust for 12-hour format if needed
            if (config.format === TIME_FORMAT.AMPM) {
              // Convert to 24-hour format internally
              if (timeValue.period === TIME_PERIOD.PM && selectedValue !== 12) {
                newHours += 12;
              } else if (timeValue.period === TIME_PERIOD.AM && selectedValue === 12) {
                newHours = 0;
              }
            }
            
            if (timeValue.hours !== newHours) {
              timeValue.hours = newHours;
              
              // Update display time
              const hoursDisplay = hoursEl as HTMLElement;
              if (hoursDisplay) {
                hoursDisplay.textContent = padZero(config.format === TIME_FORMAT.MILITARY 
                  ? newHours 
                  : (newHours % 12 || 12));
              }
              
              // Directly update the canvas
              const canvasElement = dialogElement.querySelector(SELECTORS.DIAL_CANVAS) as HTMLCanvasElement;
              if (canvasElement) {
                renderClockDial(canvasElement, timeValue, {
                  type: config.type,
                  format: config.format,
                  showSeconds: config.showSeconds,
                  prefix: config.prefix,
                  activeSelector
                });
              }
              
              options.events.emit(EVENTS.CHANGE, timePickerAPI.getValue());
              
              // Call onChange callback if provided
              if (config.onChange) {
                config.onChange(timePickerAPI.getValue());
              }
            }
          } else if (activeSelector === 'minute') {
            if (timeValue.minutes !== selectedValue) {
              timeValue.minutes = selectedValue;
              
              // Update display time
              const minutesDisplay = minutesEl as HTMLElement;
              if (minutesDisplay) {
                minutesDisplay.textContent = padZero(selectedValue);
              }
              
              // Directly update the canvas
              const canvasElement = dialogElement.querySelector(SELECTORS.DIAL_CANVAS) as HTMLCanvasElement;
              if (canvasElement) {
                renderClockDial(canvasElement, timeValue, {
                  type: config.type,
                  format: config.format,
                  showSeconds: config.showSeconds,
                  prefix: config.prefix,
                  activeSelector
                });
              }
              
              options.events.emit(EVENTS.CHANGE, timePickerAPI.getValue());
              
              // Call onChange callback if provided
              if (config.onChange) {
                config.onChange(timePickerAPI.getValue());
              }
            }
          } else if (activeSelector === 'second' && config.showSeconds) {
            if (timeValue.seconds !== selectedValue) {
              timeValue.seconds = selectedValue;
              
              // Update display time
              const secondsDisplay = secondsEl as HTMLElement;
              if (secondsDisplay) {
                secondsDisplay.textContent = padZero(selectedValue);
              }
              
              // Directly update the canvas
              const canvasElement = dialogElement.querySelector(SELECTORS.DIAL_CANVAS) as HTMLCanvasElement;
              if (canvasElement) {
                renderClockDial(canvasElement, timeValue, {
                  type: config.type,
                  format: config.format,
                  showSeconds: config.showSeconds,
                  prefix: config.prefix,
                  activeSelector
                });
              }
              
              options.events.emit(EVENTS.CHANGE, timePickerAPI.getValue());
              
              // Call onChange callback if provided
              if (config.onChange) {
                config.onChange(timePickerAPI.getValue());
              }
            }
          }
        }
      }
    }
  });
  
  // Set up input handling for input type time picker
  const handleInputChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const inputType = target.getAttribute('data-type');
    const value = parseInt(target.value, 10);
    
    if (isNaN(value)) return;
    
    if (inputType === 'hour') {
      let newHours = value;
      
      // Handle hour constraints
      if (config.format === TIME_FORMAT.AMPM) {
        if (value < 1) newHours = 12;
        if (value > 12) newHours = 1;
        
        // Convert to 24h format internally
        if (timeValue.period === 'PM' && newHours !== 12) {
          newHours += 12;
        } else if (timeValue.period === 'AM' && newHours === 12) {
          newHours = 0;
        }
      } else {
        if (value < 0) newHours = 0;
        if (value > 23) newHours = 23;
      }
      
      timeValue.hours = newHours;
    } else if (inputType === 'minute') {
      let newMinutes = value;
      
      // Handle minute constraints
      if (newMinutes < 0) newMinutes = 0;
      if (newMinutes > 59) newMinutes = 59;
      
      timeValue.minutes = newMinutes;
    } else if (inputType === 'second') {
      let newSeconds = value;
      
      // Handle second constraints
      if (newSeconds < 0) newSeconds = 0;
      if (newSeconds > 59) newSeconds = 59;
      
      timeValue.seconds = newSeconds;
    }
    
    // Re-render time picker with updated values
    renderTimePicker(dialogElement, timeValue, config);
    
    // Emit change event
    options.events.emit(EVENTS.CHANGE, timePickerAPI.getValue());
    
    // Call onChange callback if provided
    if (config.onChange) {
      config.onChange(timePickerAPI.getValue());
    }
  };
  
  // Add event delegation for input fields
  dialogElement.addEventListener('change', (event) => {
    const target = event.target as HTMLElement;
    if (
      target.matches(SELECTORS.HOURS_INPUT) ||
      target.matches(SELECTORS.MINUTES_INPUT) ||
      target.matches(SELECTORS.SECONDS_INPUT)
    ) {
      handleInputChange(event);
    }
  });
  
  // Add event delegation for input keyup
  dialogElement.addEventListener('keyup', (event) => {
    const target = event.target as HTMLElement;
    if (
      target.matches(SELECTORS.HOURS_INPUT) ||
      target.matches(SELECTORS.MINUTES_INPUT) ||
      target.matches(SELECTORS.SECONDS_INPUT)
    ) {
      if (event.key === 'Enter') {
        handleInputChange(event);
        
        // Move focus to next input or confirm button
        if (target.matches(SELECTORS.HOURS_INPUT)) {
          const minutesInput = dialogElement.querySelector(SELECTORS.MINUTES_INPUT);
          if (minutesInput) {
            (minutesInput as HTMLElement).focus();
          }
        } else if (target.matches(SELECTORS.MINUTES_INPUT)) {
          if (config.showSeconds) {
            const secondsInput = dialogElement.querySelector(SELECTORS.SECONDS_INPUT);
            if (secondsInput) {
              (secondsInput as HTMLElement).focus();
            }
          } else {
            const confirmButton = dialogElement.querySelector(SELECTORS.CONFIRM_BUTTON);
            if (confirmButton) {
              (confirmButton as HTMLElement).focus();
            }
          }
        } else if (target.matches(SELECTORS.SECONDS_INPUT)) {
          const confirmButton = dialogElement.querySelector(SELECTORS.CONFIRM_BUTTON);
          if (confirmButton) {
            (confirmButton as HTMLElement).focus();
          }
        }
      }
    }
  });
  
  return timePickerAPI;
};