// src/components/timepicker/render.ts

import { TimePickerConfig, TimeValue, TIME_PICKER_TYPE, TIME_PICKER_ORIENTATION, TIME_FORMAT, TIME_PERIOD } from './types';
import { 
  TIMEPICKER_DIAL, 
  TIMEPICKER_VALUES, 
  TIMEPICKER_ICONS,
  TIMEPICKER_SELECTORS
} from './constants';
import { padZero, convertTo12Hour } from './utils';
import { renderClockDial, getTimeValueFromClick } from './clockdial';

/**
 * Renders the time picker dialog
 * @param {HTMLElement} container - Dialog container element
 * @param {TimeValue} timeValue - Current time value
 * @param {TimePickerConfig} config - Time picker configuration
 * @param {Function} onTimeChange - Optional callback when time changes
 */
export const renderTimePicker = (
  container: HTMLElement,
  timeValue: TimeValue,
  config: TimePickerConfig,
  onTimeChange?: (key: 'hours' | 'minutes' | 'seconds', value: number) => void
): void => {
  // Clear container content
  container.innerHTML = '';
  
  // Create title if provided
  if (config.title) {
    const title = document.createElement('div');
    title.className = `${config.prefix}-time-picker-title`;
    title.textContent = config.title;
    title.id = `${config.prefix}-time-picker-title`;
    container.appendChild(title);
  }
  
  // Create content container
  const content = document.createElement('div');
  content.className = `${config.prefix}-time-picker-content`;
  container.appendChild(content);
  
  // Create time input container (same for both modes)
  const inputContainer = document.createElement('div');
  inputContainer.className = `${config.prefix}-time-picker-input-container`;
  content.appendChild(inputContainer);
  
  // Determine display hours based on format
  const { hours: displayHours } = config.format === TIME_FORMAT.MILITARY 
    ? { hours: timeValue.hours } 
    : convertTo12Hour(timeValue.hours);
  
  // Create hours input field
  const hoursInputContainer = document.createElement('div');
  hoursInputContainer.className = `${config.prefix}-time-picker-time-input-field`;
  
  const hoursInput = document.createElement('input');
  hoursInput.type = 'number';
  hoursInput.className = `${config.prefix}-time-picker-hours`;
  hoursInput.min = config.format === TIME_FORMAT.MILITARY ? '0' : '1';
  hoursInput.max = config.format === TIME_FORMAT.MILITARY ? '23' : '12';
  hoursInput.value = padZero(displayHours);
  hoursInput.setAttribute('data-type', 'hour');
  hoursInput.setAttribute('inputmode', 'numeric');
  hoursInput.setAttribute('pattern', '[0-9]*');
    
  hoursInputContainer.appendChild(hoursInput);
  inputContainer.appendChild(hoursInputContainer);
  
  // Create separator
  const separator = document.createElement('div');
  separator.className = `${config.prefix}-time-picker-separator`;
  separator.textContent = ':';
  inputContainer.appendChild(separator);
  
  // Create minutes input field
  const minutesInputContainer = document.createElement('div');
  minutesInputContainer.className = `${config.prefix}-time-picker-time-input-field`;
  
  const minutesInput = document.createElement('input');
  minutesInput.type = 'number';
  minutesInput.className = `${config.prefix}-time-picker-minutes`;
  minutesInput.min = '0';
  minutesInput.max = '59';
  minutesInput.value = padZero(timeValue.minutes);
  minutesInput.setAttribute('data-type', 'minute');
  minutesInput.setAttribute('inputmode', 'numeric');
  minutesInput.setAttribute('pattern', '[0-9]*');
  
  minutesInputContainer.appendChild(minutesInput);
  inputContainer.appendChild(minutesInputContainer);
  
  // Add seconds if enabled
  let secondsInput;
  if (config.showSeconds) {
    const secondsSeparator = document.createElement('div');
    secondsSeparator.className = `${config.prefix}-time-picker-separator`;
    secondsSeparator.textContent = ':';
    inputContainer.appendChild(secondsSeparator);
    
    const secondsInputContainer = document.createElement('div');
    secondsInputContainer.className = `${config.prefix}-time-picker-time-input-field`;
    
    secondsInput = document.createElement('input');
    secondsInput.type = 'number';
    secondsInput.className = `${config.prefix}-time-picker-seconds`;
    secondsInput.min = '0';
    secondsInput.max = '59';
    secondsInput.value = padZero(timeValue.seconds || 0);
    secondsInput.setAttribute('data-type', 'second');
    secondsInput.setAttribute('inputmode', 'numeric');
    secondsInput.setAttribute('pattern', '[0-9]*');
    
    const secondsLabel = document.createElement('label');
    secondsLabel.className = `${config.prefix}-time-picker-input-label`;
    secondsLabel.textContent = 'Second';
    
    secondsInputContainer.appendChild(secondsInput);
    secondsInputContainer.appendChild(secondsLabel);
    inputContainer.appendChild(secondsInputContainer);
  }
  
  // Add period selector for 12-hour format
  if (config.format === TIME_FORMAT.AMPM) {
    const periodContainer = document.createElement('div');
    periodContainer.className = `${config.prefix}-time-picker-period`;
    
    const amPeriod = document.createElement('div');
    amPeriod.className = `${config.prefix}-time-picker-period-am ${timeValue.period === TIME_PERIOD.AM ? `${config.prefix}-time-picker-period--selected` : ''}`;
    amPeriod.textContent = TIME_PERIOD.AM;
    amPeriod.setAttribute('role', 'button');
    amPeriod.setAttribute('tabindex', '0');
    amPeriod.setAttribute('aria-pressed', timeValue.period === TIME_PERIOD.AM ? 'true' : 'false');
    
    const pmPeriod = document.createElement('div');
    pmPeriod.className = `${config.prefix}-time-picker-period-pm ${timeValue.period === TIME_PERIOD.PM ? `${config.prefix}-time-picker-period--selected` : ''}`;
    pmPeriod.textContent = TIME_PERIOD.PM;
    pmPeriod.setAttribute('role', 'button');
    pmPeriod.setAttribute('tabindex', '0');
    pmPeriod.setAttribute('aria-pressed', timeValue.period === TIME_PERIOD.PM ? 'true' : 'false');
    
    periodContainer.appendChild(amPeriod);
    periodContainer.appendChild(pmPeriod);
    inputContainer.appendChild(periodContainer);
  }
  
  // Create canvas-based dial container (shown/hidden based on mode)
  const dialContainer = document.createElement('div');
  dialContainer.className = `${config.prefix}-time-picker-dial`;
  dialContainer.style.display = config.type === TIME_PICKER_TYPE.DIAL ? 'block' : 'none';
  content.appendChild(dialContainer);
  
  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.className = `${config.prefix}-time-picker-dial-canvas`;
  canvas.width = TIMEPICKER_DIAL.DIAMETER;
  canvas.height = TIMEPICKER_DIAL.DIAMETER;
  canvas.style.width = `${TIMEPICKER_DIAL.DIAMETER}px`;
  canvas.style.height = `${TIMEPICKER_DIAL.DIAMETER}px`;
  dialContainer.appendChild(canvas);
  
  // Create actions container
  const actions = document.createElement('div');
  actions.className = `${config.prefix}-time-picker-actions`;
  container.appendChild(actions);
  
  // Create type toggle button
  const toggleTypeButton = document.createElement('button');
  toggleTypeButton.className = `${config.prefix}-time-picker-toggle-type`;
  toggleTypeButton.setAttribute('aria-label', config.type === TIME_PICKER_TYPE.DIAL 
    ? 'Switch to keyboard input' 
    : 'Switch to dial selector');
  toggleTypeButton.innerHTML = config.type === TIME_PICKER_TYPE.DIAL 
    ? config.keyboardIcon || TIMEPICKER_ICONS.KEYBOARD 
    : config.clockIcon || TIMEPICKER_ICONS.CLOCK;
  actions.appendChild(toggleTypeButton);
  
  // Create action buttons container
  const actionButtons = document.createElement('div');
  actionButtons.className = `${config.prefix}-time-picker-action-buttons`;
  actions.appendChild(actionButtons);
  
  // Create cancel button
  const cancelButton = document.createElement('button');
  cancelButton.className = `${config.prefix}-time-picker-cancel`;
  cancelButton.textContent = config.cancelText || 'Cancel';
  cancelButton.setAttribute('type', 'button');
  actionButtons.appendChild(cancelButton);
  
  // Create confirm button
  const confirmButton = document.createElement('button');
  confirmButton.className = `${config.prefix}-time-picker-confirm`;
  confirmButton.textContent = config.confirmText || 'OK';
  confirmButton.setAttribute('type', 'button');
  actionButtons.appendChild(confirmButton);
  
  // Track active selector for clock dial
  let activeSelector: 'hour' | 'minute' | 'second' = 'hour';
  
  // Render initial clock dial if in dial mode
  if (config.type === TIME_PICKER_TYPE.DIAL) {
    setTimeout(() => {
      renderClockDial(canvas, timeValue, {
        type: config.type,
        format: config.format,
        showSeconds: config.showSeconds,
        prefix: config.prefix,
        activeSelector
      });
    }, 0);
  }
  
  // Add event listener for toggle button
  toggleTypeButton.addEventListener('click', () => {
    // Toggle dial visibility
    if (dialContainer.style.display === 'none') {
      // Switch to dial mode
      dialContainer.style.display = 'block';
      toggleTypeButton.innerHTML = config.keyboardIcon || TIMEPICKER_ICONS.KEYBOARD;
      toggleTypeButton.setAttribute('aria-label', 'Switch to keyboard input');
      
      // Set focus on dial
      setTimeout(() => {
        canvas.focus();
        
        // Apply active state to hour input by default
        const hourElements = document.querySelectorAll(`.${config.prefix}-time-picker-hours`);
        hourElements.forEach(el => el.setAttribute('data-active', 'true'));
        
        const minuteElements = document.querySelectorAll(`.${config.prefix}-time-picker-minutes`);
        minuteElements.forEach(el => el.setAttribute('data-active', 'false'));
        
        const secondElements = document.querySelectorAll(`.${config.prefix}-time-picker-seconds`);
        secondElements.forEach(el => el.setAttribute('data-active', 'false'));
        
        // Render clock dial
        renderClockDial(canvas, timeValue, {
          type: TIME_PICKER_TYPE.DIAL,
          format: config.format,
          showSeconds: config.showSeconds,
          prefix: config.prefix,
          activeSelector: 'hour'
        });
      }, 50);
    } else {
      // Switch to input mode
      dialContainer.style.display = 'none';
      toggleTypeButton.innerHTML = config.clockIcon || TIMEPICKER_ICONS.CLOCK;
      toggleTypeButton.setAttribute('aria-label', 'Switch to dial selector');
      
      // Focus on hours input
      setTimeout(() => {
        hoursInput.focus();
        hoursInput.select();
      }, 50);
    }
  });
  
  // Handle input time changes
  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const type = target.getAttribute('data-type');
    const value = target.value;
    
    // Skip processing if the field is empty (user might be in the middle of typing)
    if (value === '') return;
    
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    if (type === 'hour') {
      let newHours = numValue;
      
      // Handle hour constraints
      if (config.format === TIME_FORMAT.AMPM) {
        // Special handling for 12-hour format
        if (numValue < 0) newHours = 1;
        if (numValue > 12) newHours = 12;
        
        // Convert to 24h format internally
        if (timeValue.period === 'PM' && newHours !== 12) {
          newHours += 12;
        } else if (timeValue.period === 'AM' && newHours === 12) {
          newHours = 0;
        }
      } else {
        // 24-hour format validation
        if (numValue < 0) newHours = 0;
        if (numValue > 23) newHours = 23;
      }
      
      timeValue.hours = newHours;
      
      // Set this field as active for the dial
      activeSelector = 'hour';
      
      // Update active states for visualization
      hoursInput.setAttribute('data-active', 'true');
      minutesInput.setAttribute('data-active', 'false');
      if (secondsInput) secondsInput.setAttribute('data-active', 'false');
      
      // Always update the dial regardless of visibility
      renderClockDial(canvas, timeValue, {
        type: TIME_PICKER_TYPE.DIAL,
        format: config.format,
        showSeconds: config.showSeconds,
        prefix: config.prefix,
        activeSelector
      });
      
      if (onTimeChange) {
        onTimeChange('hours', newHours);
      }
    } else if (type === 'minute') {
      let newMinutes = numValue;
      
      // Handle minute constraints
      if (numValue < 0) newMinutes = 0;
      if (numValue > 59) newMinutes = 59;
      
      timeValue.minutes = newMinutes;
      
      // Set this field as active for the dial
      activeSelector = 'minute';
      
      // Update active states for visualization
      hoursInput.setAttribute('data-active', 'false');
      minutesInput.setAttribute('data-active', 'true');
      if (secondsInput) secondsInput.setAttribute('data-active', 'false');
      
      // Always update the dial regardless of visibility
      renderClockDial(canvas, timeValue, {
        type: TIME_PICKER_TYPE.DIAL,
        format: config.format,
        showSeconds: config.showSeconds,
        prefix: config.prefix,
        activeSelector
      });
      
      if (onTimeChange) {
        onTimeChange('minutes', newMinutes);
      }
    } else if (type === 'second') {
      let newSeconds = numValue;
      
      // Handle second constraints
      if (numValue < 0) newSeconds = 0;
      if (numValue > 59) newSeconds = 59;
      
      timeValue.seconds = newSeconds;
      
      // Set this field as active for the dial
      activeSelector = 'second';
      
      // Update active states for visualization
      hoursInput.setAttribute('data-active', 'false');
      minutesInput.setAttribute('data-active', 'false');
      if (secondsInput) secondsInput.setAttribute('data-active', 'true');
      
      // Always update the dial regardless of visibility
      renderClockDial(canvas, timeValue, {
        type: TIME_PICKER_TYPE.DIAL,
        format: config.format,
        showSeconds: config.showSeconds,
        prefix: config.prefix,
        activeSelector
      });
      
      if (onTimeChange) {
        onTimeChange('seconds', newSeconds);
      }
    }
  };
  
  // Event handlers for input fields
  hoursInput.addEventListener('input', handleInputChange);
  minutesInput.addEventListener('input', handleInputChange);
  if (secondsInput) {
    secondsInput.addEventListener('input', handleInputChange);
  }
  
  // Set up keyboard navigation
  hoursInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      minutesInput.focus();
      minutesInput.select();
    }
  });
  
  minutesInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      if (config.showSeconds && secondsInput) {
        secondsInput.focus();
        secondsInput.select();
      } else {
        confirmButton.focus();
      }
    }
  });
  
  if (secondsInput) {
    secondsInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        confirmButton.focus();
      }
    });
  }
  
  // Handle period selection (AM/PM)
  const handlePeriodChange = (period: TIME_PERIOD) => {
    if (timeValue.period !== period) {
      const oldPeriod = timeValue.period;
      timeValue.period = period;
      
      // Adjust hours when switching between AM/PM
      if (oldPeriod === TIME_PERIOD.AM && period === TIME_PERIOD.PM) {
        if (timeValue.hours < 12) {
          timeValue.hours += 12;
        }
      } else if (oldPeriod === TIME_PERIOD.PM && period === TIME_PERIOD.AM) {
        if (timeValue.hours >= 12) {
          timeValue.hours -= 12;
        }
      }
      
      // Update display for 12-hour format
      if (config.format === TIME_FORMAT.AMPM) {
        const displayHours = timeValue.hours === 0 ? 12 : (timeValue.hours > 12 ? timeValue.hours - 12 : timeValue.hours);
        hoursInput.value = padZero(displayHours);
      }
      
      // Update period selectors
      document.querySelectorAll(`.${config.prefix}-time-picker-period-am, .${config.prefix}-time-picker-period-pm`)
        .forEach(el => {
          el.classList.remove(`${config.prefix}-time-picker-period--selected`);
          el.setAttribute('aria-pressed', 'false');
        });
      
      const selectedPeriod = document.querySelector(`.${config.prefix}-time-picker-period-${period.toLowerCase()}`);
      if (selectedPeriod) {
        selectedPeriod.classList.add(`${config.prefix}-time-picker-period--selected`);
        selectedPeriod.setAttribute('aria-pressed', 'true');
      }
      
      // Update dial if visible
      if (dialContainer.style.display === 'block') {
        renderClockDial(canvas, timeValue, {
          type: TIME_PICKER_TYPE.DIAL,
          format: config.format,
          showSeconds: config.showSeconds,
          prefix: config.prefix,
          activeSelector
        });
      }
      
      if (onTimeChange) {
        onTimeChange('hours', timeValue.hours);
      }
    }
  };
  
  // Add event listeners for period selectors
  if (config.format === TIME_FORMAT.AMPM) {
    const amPeriodElement = document.querySelector(`.${config.prefix}-time-picker-period-am`);
    const pmPeriodElement = document.querySelector(`.${config.prefix}-time-picker-period-pm`);
    
    if (amPeriodElement) {
      amPeriodElement.addEventListener('click', () => {
        handlePeriodChange(TIME_PERIOD.AM);
      });
    }
    
    if (pmPeriodElement) {
      pmPeriodElement.addEventListener('click', () => {
        handlePeriodChange(TIME_PERIOD.PM);
      });
    }
  }
  
  // Set up the clock dial interaction
  if (config.type === TIME_PICKER_TYPE.DIAL || dialContainer.style.display === 'block') {
    // Handle clock dial
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const selectedValue = getTimeValueFromClick(canvas, x, y, {
        type: TIME_PICKER_TYPE.DIAL,
        format: config.format,
        showSeconds: config.showSeconds,
        prefix: config.prefix,
        activeSelector
      });
      
      if (selectedValue !== null) {
        if (activeSelector === 'hour') {
          let newHours = selectedValue;
          
          // Adjust for 12-hour format
          if (config.format === TIME_FORMAT.AMPM) {
            if (timeValue.period === TIME_PERIOD.PM && selectedValue !== 12) {
              newHours += 12;
            } else if (timeValue.period === TIME_PERIOD.AM && selectedValue === 12) {
              newHours = 0;
            }
          }
          
          timeValue.hours = newHours;
          
          // Update input display
          if (config.format === TIME_FORMAT.AMPM) {
            const displayHours = newHours === 0 ? 12 : (newHours > 12 ? newHours - 12 : newHours);
            hoursInput.value = padZero(displayHours);
          } else {
            hoursInput.value = padZero(newHours);
          }
          
          if (onTimeChange) {
            onTimeChange('hours', newHours);
          }
        } else if (activeSelector === 'minute') {
          timeValue.minutes = selectedValue;
          minutesInput.value = padZero(selectedValue);
          
          if (onTimeChange) {
            onTimeChange('minutes', selectedValue);
          }
        } else if (activeSelector === 'second' && secondsInput) {
          timeValue.seconds = selectedValue;
          secondsInput.value = padZero(selectedValue);
          
          if (onTimeChange) {
            onTimeChange('seconds', selectedValue);
          }
        }
        
        // Update dial
        renderClockDial(canvas, timeValue, {
          type: TIME_PICKER_TYPE.DIAL,
          format: config.format,
          showSeconds: config.showSeconds,
          prefix: config.prefix,
          activeSelector
        });
      }
    });
    
    // Setup clicking on input fields to change active selector in dial mode
    hoursInput.addEventListener('click', () => {
      if (dialContainer.style.display === 'block') {
        activeSelector = 'hour';
        
        // Update active states
        hoursInput.setAttribute('data-active', 'true');
        minutesInput.setAttribute('data-active', 'false');
        if (secondsInput) secondsInput.setAttribute('data-active', 'false');
        
        // Update dial
        renderClockDial(canvas, timeValue, {
          type: TIME_PICKER_TYPE.DIAL,
          format: config.format,
          showSeconds: config.showSeconds,
          prefix: config.prefix,
          activeSelector
        });
      }
    });
    
    minutesInput.addEventListener('click', () => {
      if (dialContainer.style.display === 'block') {
        activeSelector = 'minute';
        
        // Update active states
        hoursInput.setAttribute('data-active', 'false');
        minutesInput.setAttribute('data-active', 'true');
        if (secondsInput) secondsInput.setAttribute('data-active', 'false');
        
        // Update dial
        renderClockDial(canvas, timeValue, {
          type: TIME_PICKER_TYPE.DIAL,
          format: config.format,
          showSeconds: config.showSeconds,
          prefix: config.prefix,
          activeSelector
        });
      }
    });
    
    if (secondsInput) {
      secondsInput.addEventListener('click', () => {
        if (dialContainer.style.display === 'block') {
          activeSelector = 'second';
          
          // Update active states
          hoursInput.setAttribute('data-active', 'false');
          minutesInput.setAttribute('data-active', 'false');
          secondsInput.setAttribute('data-active', 'true');
          
          // Update dial
          renderClockDial(canvas, timeValue, {
            type: TIME_PICKER_TYPE.DIAL,
            format: config.format,
            showSeconds: config.showSeconds,
            prefix: config.prefix,
            activeSelector
          });
        }
      });
    }
  }
};