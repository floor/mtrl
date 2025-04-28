// src/components/timepicker/timePicker.ts

import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withLifecycle
} from '../../core/compose/features';
import { TimePickerConfig, TimePickerComponent, TimeValue, TIME_PERIOD, TIME_FORMAT } from './types';
import { createBaseConfig, getContainerConfig, getModalConfig, getDialogConfig, getApiConfig } from './config';
import { 
  TIMEPICKER_TYPES as TIME_PICKER_TYPE, 
  TIMEPICKER_ORIENTATIONS as TIME_PICKER_ORIENTATION,
  TIMEPICKER_EVENTS as EVENTS,
  TIMEPICKER_SELECTORS as SELECTORS,
  TIMEPICKER_Z_INDEX as Z_INDEX
} from './constants';
import { createTimePickerAPI } from './api';
import { renderTimePicker } from './render';
import { parseTime, formatTime } from './utils';

/**
 * Creates a new TimePicker component
 * @param {TimePickerConfig} config - TimePicker configuration object
 * @returns {TimePickerComponent} TimePicker component instance
 */
const createTimePicker = (config: TimePickerConfig = {}): TimePickerComponent => {
  const baseConfig = createBaseConfig(config);
  
  try {
    // Create base component with container element
    const baseComponent = pipe(
      createBase,
      withEvents(),
      withElement(getContainerConfig(baseConfig)),
      withLifecycle()
    )(baseConfig);
    
    // Create modal element
    const modalElement = document.createElement('div');
    modalElement.className = `${PREFIX}-time-picker-modal`;
    modalElement.style.display = 'none';
    modalElement.style.position = 'fixed';
    modalElement.style.top = '0';
    modalElement.style.left = '0';
    modalElement.style.width = '100%';
    modalElement.style.height = '100%';
    modalElement.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
    modalElement.style.zIndex = Z_INDEX.MODAL.toString();
    modalElement.setAttribute('role', 'presentation');
    
    // Create dialog element
    const dialogElement = document.createElement('div');
    dialogElement.className = [
      `${PREFIX}-time-picker-dialog`,
      `${PREFIX}-time-picker-dialog--${baseConfig.type}`,
      `${PREFIX}-time-picker-dialog--${baseConfig.orientation}`,
      `${PREFIX}-time-picker-dialog--${baseConfig.format}`
    ].join(' ');
    dialogElement.style.position = 'absolute';
    dialogElement.style.top = '50%';
    dialogElement.style.left = '50%';
    dialogElement.style.transform = 'translate(-50%, -50%)';
    dialogElement.style.zIndex = Z_INDEX.DIALOG.toString();
    
    // Append dialog to modal
    modalElement.appendChild(dialogElement);
    
    // Append modal to container (document.body by default)
    const container = typeof baseConfig.container === 'string' 
      ? document.querySelector(baseConfig.container) || document.body 
      : baseConfig.container || document.body;
    
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
        period: now.getHours() >= 12 ? TIME_PERIOD.PM : TIME_PERIOD.AM
      };
    }
    
    // Render initial time picker content
    renderTimePicker(dialogElement, timeValue, baseConfig);
    
    // Create time picker API
    const timePicker = createTimePickerAPI(
      baseComponent, 
      modalElement, 
      dialogElement, 
      timeValue, 
      baseConfig, 
      getApiConfig(baseComponent)
    );
    
    // Open time picker if initially open
    if (baseConfig.isOpen) {
      setTimeout(() => timePicker.open(), 0);
    }
    
    return timePicker;
  } catch (error) {
    console.error('TimePicker creation error:', error);
    throw new Error(`Failed to create time picker: ${(error as Error).message}`);
  }
};

export default createTimePicker;