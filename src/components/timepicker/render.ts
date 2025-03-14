// src/components/timePicker/render.ts

import { TimePickerConfig, TimeValue, TIME_PICKER_TYPE, TIME_PICKER_ORIENTATION, TIME_FORMAT, TIME_PERIOD } from './types';
import { 
  DIAL_CONSTANTS, 
  TIME_CONSTANTS, 
  DEFAULT_CLOCK_ICON,
  DEFAULT_KEYBOARD_ICON 
} from './constants';
import { padZero, convertTo12Hour, getAngle, getCoordinates } from './utils';

/**
 * Renders the time picker dialog
 * @param {HTMLElement} container - Dialog container element
 * @param {TimeValue} timeValue - Current time value
 * @param {TimePickerConfig} config - Time picker configuration
 */
export const renderTimePicker = (
  container: HTMLElement,
  timeValue: TimeValue,
  config: TimePickerConfig
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
  
  // Render appropriate time picker type
  if (config.type === TIME_PICKER_TYPE.DIAL) {
    renderDialTimePicker(content, timeValue, config);
  } else {
    renderInputTimePicker(content, timeValue, config);
  }
  
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
    ? config.keyboardIcon || DEFAULT_KEYBOARD_ICON 
    : config.clockIcon || DEFAULT_CLOCK_ICON;
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
};

/**
 * Renders the dial-based time picker
 * @param {HTMLElement} container - Content container element
 * @param {TimeValue} timeValue - Current time value
 * @param {TimePickerConfig} config - Time picker configuration
 */
export const renderDialTimePicker = (
  container: HTMLElement,
  timeValue: TimeValue,
  config: TimePickerConfig
): void => {
  // Create time selectors container
  const selectors = document.createElement('div');
  selectors.className = `${config.prefix}-time-picker-selectors`;
  container.appendChild(selectors);
  
  // Determine display hours based on format
  const { hours: displayHours } = config.format === TIME_FORMAT.MILITARY 
    ? { hours: timeValue.hours } 
    : convertTo12Hour(timeValue.hours);
  
  // Create hours input
  const hoursContainer = document.createElement('div');
  hoursContainer.className = `${config.prefix}-time-picker-time-selector`;
  hoursContainer.setAttribute('data-selected', 'true');
  
  const hoursInput = document.createElement('div');
  hoursInput.className = `${config.prefix}-time-picker-hours`;
  hoursInput.textContent = padZero(displayHours);
  hoursInput.setAttribute('data-type', 'hour');
  hoursInput.setAttribute('data-active', 'true');
  hoursContainer.appendChild(hoursInput);
  
  // Create separator
  const separator = document.createElement('div');
  separator.className = `${config.prefix}-time-picker-separator`;
  separator.textContent = ':';
  
  // Create minutes input
  const minutesContainer = document.createElement('div');
  minutesContainer.className = `${config.prefix}-time-picker-time-selector`;
  
  const minutesInput = document.createElement('div');
  minutesInput.className = `${config.prefix}-time-picker-minutes`;
  minutesInput.textContent = padZero(timeValue.minutes);
  minutesInput.setAttribute('data-type', 'minute');
  minutesContainer.appendChild(minutesInput);
  
  // Add hours, separator, and minutes to selectors
  selectors.appendChild(hoursContainer);
  selectors.appendChild(separator);
  selectors.appendChild(minutesContainer);
  
  // Add seconds if enabled
  if (config.showSeconds) {
    const secondsSeparator = document.createElement('div');
    secondsSeparator.className = `${config.prefix}-time-picker-separator`;
    secondsSeparator.textContent = ':';
    selectors.appendChild(secondsSeparator);
    
    const secondsContainer = document.createElement('div');
    secondsContainer.className = `${config.prefix}-time-picker-time-selector`;
    
    const secondsInput = document.createElement('div');
    secondsInput.className = `${config.prefix}-time-picker-seconds`;
    secondsInput.textContent = padZero(timeValue.seconds || 0);
    secondsInput.setAttribute('data-type', 'second');
    secondsContainer.appendChild(secondsInput);
    
    selectors.appendChild(secondsContainer);
  }
  
  // Add period selector for 12-hour format
  if (config.format === TIME_FORMAT.AMPM) {
    const periodContainer = document.createElement('div');
    periodContainer.className = `${config.prefix}-time-picker-period`;
    
    const amPeriod = document.createElement('div');
    amPeriod.className = `${config.prefix}-time-picker-period-am ${timeValue.period === TIME_PERIOD.AM ? `${config.prefix}-time-picker-period--selected` : ''}`;
    amPeriod.textContent = TIME_PERIOD.AM;
    
    const pmPeriod = document.createElement('div');
    pmPeriod.className = `${config.prefix}-time-picker-period-pm ${timeValue.period === TIME_PERIOD.PM ? `${config.prefix}-time-picker-period--selected` : ''}`;
    pmPeriod.textContent = TIME_PERIOD.PM;
    
    periodContainer.appendChild(amPeriod);
    periodContainer.appendChild(pmPeriod);
    selectors.appendChild(periodContainer);
  }
  
  // Create clock dial
  const dial = document.createElement('div');
  dial.className = `${config.prefix}-time-picker-dial`;
  container.appendChild(dial);
  
  // Create clock face
  const clockFace = document.createElement('div');
  clockFace.className = `${config.prefix}-time-picker-dial-face`;
  clockFace.style.width = `${DIAL_CONSTANTS.DIAMETER}px`;
  clockFace.style.height = `${DIAL_CONSTANTS.DIAMETER}px`;
  dial.appendChild(clockFace);
  
  // Create dial center
  const center = document.createElement('div');
  center.className = `${config.prefix}-time-picker-dial-center`;
  center.style.width = `${DIAL_CONSTANTS.CENTER_SIZE}px`;
  center.style.height = `${DIAL_CONSTANTS.CENTER_SIZE}px`;
  clockFace.appendChild(center);
  
  // Create dial hand
  const hand = document.createElement('div');
  hand.className = `${config.prefix}-time-picker-dial-hand`;
  
  // Calculate current angle based on active selector
  let angle, value, radius, numbers;
  
  // Determine which time unit is active (hours, minutes, seconds)
  const activeSelector = timeValue;
  
  if (hoursInput.getAttribute('data-active') === 'true') {
    // Set up for hours
    value = config.format === TIME_FORMAT.MILITARY ? timeValue.hours : displayHours;
    const isInnerRing = config.format === TIME_FORMAT.MILITARY && timeValue.hours > 12;
    numbers = config.format === TIME_FORMAT.MILITARY ? TIME_CONSTANTS.HOURS_24 : TIME_CONSTANTS.HOURS_12;
    radius = isInnerRing ? DIAL_CONSTANTS.INNER_RADIUS : DIAL_CONSTANTS.OUTER_RADIUS;
    
    // Calculate hand angle for hours
    if (config.format === TIME_FORMAT.MILITARY) {
      angle = (timeValue.hours % 12) / 12 * 360;
    } else {
      angle = (displayHours % 12) / 12 * 360;
      // Handle 12 o'clock special case
      if (displayHours === 12) {
        angle = 0;
      }
    }
    
    // Adjust hand length for inner/outer rings in 24h mode
    if (config.format === TIME_FORMAT.MILITARY) {
      hand.style.height = isInnerRing 
        ? `${DIAL_CONSTANTS.INNER_RADIUS}px` 
        : `${DIAL_CONSTANTS.OUTER_RADIUS}px`;
    } else {
      hand.style.height = `${DIAL_CONSTANTS.OUTER_RADIUS}px`;
    }
  } else if (minutesInput.getAttribute('data-active') === 'true') {
    // Set up for minutes
    value = timeValue.minutes;
    numbers = TIME_CONSTANTS.MINUTES.filter(m => m % 5 === 0); // Show only multiples of 5
    radius = DIAL_CONSTANTS.OUTER_RADIUS;
    angle = (timeValue.minutes / 60) * 360;
    hand.style.height = `${DIAL_CONSTANTS.OUTER_RADIUS}px`;
  } else if (config.showSeconds && document.querySelector(`.${config.prefix}-time-picker-seconds[data-active="true"]`)) {
    // Set up for seconds
    value = timeValue.seconds || 0;
    numbers = TIME_CONSTANTS.SECONDS.filter(s => s % 5 === 0); // Show only multiples of 5
    radius = DIAL_CONSTANTS.OUTER_RADIUS;
    angle = ((timeValue.seconds || 0) / 60) * 360;
    hand.style.height = `${DIAL_CONSTANTS.OUTER_RADIUS}px`;
  }
  
  // Position hand based on angle
  hand.style.transform = `rotate(${angle}deg)`;
  clockFace.appendChild(hand);
  
  // Create hand knob
  const handKnob = document.createElement('div');
  handKnob.className = `${config.prefix}-time-picker-dial-hand-knob`;
  handKnob.style.width = `${DIAL_CONSTANTS.HAND_SIZE}px`;
  handKnob.style.height = `${DIAL_CONSTANTS.HAND_SIZE}px`;
  
  // Position knob at end of hand
  if (angle !== undefined && radius !== undefined) {
    const coords = getCoordinates(radius, angle);
    handKnob.style.left = `${coords.x + DIAL_CONSTANTS.DIAMETER / 2 - DIAL_CONSTANTS.HAND_SIZE / 2}px`;
    handKnob.style.top = `${coords.y + DIAL_CONSTANTS.DIAMETER / 2 - DIAL_CONSTANTS.HAND_SIZE / 2}px`;
  }
  
  clockFace.appendChild(handKnob);
  
  // Create dial numbers
  if (numbers !== undefined && radius !== undefined) {
    const numbersContainer = document.createElement('div');
    numbersContainer.className = `${config.prefix}-time-picker-dial-numbers`;
    
    // Create 12/24 hour numbers or minute/second markers
    const count = hoursInput.getAttribute('data-active') === 'true'
      ? (config.format === TIME_FORMAT.MILITARY ? 24 : 12)
      : 12; // For minutes/seconds we show 12 markers (every 5 minutes/seconds)
    
    const step = hoursInput.getAttribute('data-active') === 'true'
      ? 1
      : 5; // For minutes/seconds we step by 5
    
    for (let i = 0; i < count; i++) {
      const index = i * step;
      const numberValue = hoursInput.getAttribute('data-active') === 'true'
        ? (config.format === TIME_FORMAT.MILITARY ? i : (i === 0 ? 12 : i))
        : (index === 0 ? 0 : index);
      
      // Skip inner ring numbers for 12-hour mode
      if (config.format === TIME_FORMAT.AMPM && hoursInput.getAttribute('data-active') === 'true' && i > 12) {
        continue;
      }
      
      // Calculate angle for this number
      const numberAngle = (i / count) * 360;
      
      // Determine radius based on hour value for 24-hour clock
      const numberRadius = (config.format === TIME_FORMAT.MILITARY && 
                           hoursInput.getAttribute('data-active') === 'true' && 
                           i >= 12) 
        ? DIAL_CONSTANTS.INNER_RADIUS 
        : DIAL_CONSTANTS.OUTER_RADIUS;
      
      // Calculate position
      const numberCoords = getCoordinates(numberRadius, numberAngle);
      
      // Create number element
      const numberEl = document.createElement('div');
      numberEl.className = `${config.prefix}-time-picker-dial-number`;
      numberEl.textContent = padZero(numberValue);
      numberEl.setAttribute('data-value', numberValue.toString());
      numberEl.setAttribute('data-type', hoursInput.getAttribute('data-active') === 'true' 
        ? 'hour' 
        : (minutesInput.getAttribute('data-active') === 'true' ? 'minute' : 'second'));
      
      // Position number
      numberEl.style.left = `${numberCoords.x + DIAL_CONSTANTS.DIAMETER / 2 - DIAL_CONSTANTS.NUMBER_SIZE / 2}px`;
      numberEl.style.top = `${numberCoords.y + DIAL_CONSTANTS.DIAMETER / 2 - DIAL_CONSTANTS.NUMBER_SIZE / 2}px`;
      numberEl.style.width = `${DIAL_CONSTANTS.NUMBER_SIZE}px`;
      numberEl.style.height = `${DIAL_CONSTANTS.NUMBER_SIZE}px`;
      
      // Highlight selected number
      if (numberValue === value) {
        numberEl.classList.add(`${config.prefix}-time-picker-dial-number--selected`);
      }
      
      numbersContainer.appendChild(numberEl);
    }
    
    clockFace.appendChild(numbersContainer);
  }
  
  // Add event listeners to time selectors
  hoursInput.addEventListener('click', () => {
    // Deactivate all selectors
    document.querySelectorAll(`.${config.prefix}-time-picker-hours, .${config.prefix}-time-picker-minutes, .${config.prefix}-time-picker-seconds`)
      .forEach(el => el.setAttribute('data-active', 'false'));
    
    // Activate hours selector
    hoursInput.setAttribute('data-active', 'true');
    
    // Re-render dial with hours
    renderDialTimePicker(container, timeValue, config);
  });
  
  minutesInput.addEventListener('click', () => {
    // Deactivate all selectors
    document.querySelectorAll(`.${config.prefix}-time-picker-hours, .${config.prefix}-time-picker-minutes, .${config.prefix}-time-picker-seconds`)
      .forEach(el => el.setAttribute('data-active', 'false'));
    
    // Activate minutes selector
    minutesInput.setAttribute('data-active', 'true');
    
    // Re-render dial with minutes
    renderDialTimePicker(container, timeValue, config);
  });
  
  if (config.showSeconds) {
    const secondsInput = document.querySelector(`.${config.prefix}-time-picker-seconds`);
    if (secondsInput) {
      secondsInput.addEventListener('click', () => {
        // Deactivate all selectors
        document.querySelectorAll(`.${config.prefix}-time-picker-hours, .${config.prefix}-time-picker-minutes, .${config.prefix}-time-picker-seconds`)
          .forEach(el => el.setAttribute('data-active', 'false'));
        
        // Activate seconds selector
        secondsInput.setAttribute('data-active', 'true');
        
        // Re-render dial with seconds
        renderDialTimePicker(container, timeValue, config);
      });
    }
  }
};

/**
 * Renders the input-based time picker
 * @param {HTMLElement} container - Content container element
 * @param {TimeValue} timeValue - Current time value
 * @param {TimePickerConfig} config - Time picker configuration
 */
export const renderInputTimePicker = (
  container: HTMLElement,
  timeValue: TimeValue,
  config: TimePickerConfig
): void => {
  // Create time input container
  const inputContainer = document.createElement('div');
  inputContainer.className = `${config.prefix}-time-picker-input-container`;
  container.appendChild(inputContainer);
  
  // Determine display hours based on format
  const { hours: displayHours } = config.format === TIME_FORMAT.MILITARY 
    ? { hours: timeValue.hours } 
    : convertTo12Hour(timeValue.hours);
  
  // Create hours input field
  const hoursInputContainer = document.createElement('div');
  hoursInputContainer.className = `${config.prefix}-time-picker-time-input-field`;
  
  const hoursInputLabel = document.createElement('label');
  hoursInputLabel.className = `${config.prefix}-time-picker-input-label`;
  hoursInputLabel.textContent = 'Hour';
  
  const hoursInput = document.createElement('input');
  hoursInput.className = `${config.prefix}-time-picker-hours`;
  hoursInput.type = 'number';
  hoursInput.min = config.format === TIME_FORMAT.MILITARY ? '0' : '1';
  hoursInput.max = config.format === TIME_FORMAT.MILITARY ? '23' : '12';
  hoursInput.value = padZero(displayHours);
  hoursInput.setAttribute('data-type', 'hour');
  hoursInput.setAttribute('inputmode', 'numeric');
  hoursInput.setAttribute('pattern', '[0-9]*');
  
  hoursInputContainer.appendChild(hoursInput);
  hoursInputContainer.appendChild(hoursInputLabel);
  inputContainer.appendChild(hoursInputContainer);
  
  // Create separator
  const separator = document.createElement('div');
  separator.className = `${config.prefix}-time-picker-separator`;
  separator.textContent = ':';
  inputContainer.appendChild(separator);
  
  // Create minutes input field
  const minutesInputContainer = document.createElement('div');
  minutesInputContainer.className = `${config.prefix}-time-picker-time-input-field`;
  
  const minutesInputLabel = document.createElement('label');
  minutesInputLabel.className = `${config.prefix}-time-picker-input-label`;
  minutesInputLabel.textContent = 'Minute';
  
  const minutesInput = document.createElement('input');
  minutesInput.className = `${config.prefix}-time-picker-minutes`;
  minutesInput.type = 'number';
  minutesInput.min = '0';
  minutesInput.max = '59';
  minutesInput.value = padZero(timeValue.minutes);
  minutesInput.setAttribute('data-type', 'minute');
  minutesInput.setAttribute('inputmode', 'numeric');
  minutesInput.setAttribute('pattern', '[0-9]*');
  
  minutesInputContainer.appendChild(minutesInput);
  minutesInputContainer.appendChild(minutesInputLabel);
  inputContainer.appendChild(minutesInputContainer);
  
  // Add seconds if enabled
  if (config.showSeconds) {
    const secondsSeparator = document.createElement('div');
    secondsSeparator.className = `${config.prefix}-time-picker-separator`;
    secondsSeparator.textContent = ':';
    inputContainer.appendChild(secondsSeparator);
    
    const secondsInputContainer = document.createElement('div');
    secondsInputContainer.className = `${config.prefix}-time-picker-time-input-field`;
    
    const secondsInputLabel = document.createElement('label');
    secondsInputLabel.className = `${config.prefix}-time-picker-input-label`;
    secondsInputLabel.textContent = 'Second';
    
    const secondsInput = document.createElement('input');
    secondsInput.className = `${config.prefix}-time-picker-seconds`;
    secondsInput.type = 'number';
    secondsInput.min = '0';
    secondsInput.max = '59';
    secondsInput.value = padZero(timeValue.seconds || 0);
    secondsInput.setAttribute('data-type', 'second');
    secondsInput.setAttribute('inputmode', 'numeric');
    secondsInput.setAttribute('pattern', '[0-9]*');
    
    secondsInputContainer.appendChild(secondsInput);
    secondsInputContainer.appendChild(secondsInputLabel);
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
};