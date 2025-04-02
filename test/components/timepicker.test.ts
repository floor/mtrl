// test/components/timepicker.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';

// Setup jsdom environment
let dom: JSDOM;
let window: Window;
let document: Document;
let originalGlobalDocument: any;
let originalGlobalWindow: any;

beforeAll(() => {
  // Create a new JSDOM instance
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true
  });
  
  // Get window and document from jsdom
  window = dom.window;
  document = window.document;
  
  // Store original globals
  originalGlobalDocument = global.document;
  originalGlobalWindow = global.window;
  
  // Set globals to use jsdom
  global.document = document;
  global.window = window;
  global.Element = window.Element;
  global.HTMLElement = window.HTMLElement;
  global.HTMLButtonElement = window.HTMLButtonElement;
  global.Event = window.Event;
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  
  // Clean up jsdom
  window.close();
});

// Import only the types we need from the component
import {
  TimePickerComponent,
  TimePickerConfig,
  TimeValue,
  TIME_PICKER_TYPE,
  TIME_PICKER_ORIENTATION,
  TIME_FORMAT,
  TIME_PERIOD
} from '../../src/components/timepicker/types';

// Create a mock implementation of the timepicker component
const createMockTimePicker = (config: TimePickerConfig = {}): TimePickerComponent => {
  // Create the main container element
  const element = document.createElement('div');
  element.className = `mtrl-time-picker ${config.class || ''}`;
  
  // Create modal element
  const modalElement = document.createElement('div');
  modalElement.className = 'mtrl-time-picker-modal';
  modalElement.style.display = 'none';
  
  // Create dialog element
  const dialogElement = document.createElement('div');
  dialogElement.className = [
    'mtrl-time-picker-dialog',
    `mtrl-time-picker-dialog--${config.type || TIME_PICKER_TYPE.DIAL}`,
    `mtrl-time-picker-dialog--${config.orientation || TIME_PICKER_ORIENTATION.VERTICAL}`,
    `mtrl-time-picker-dialog--${config.format || TIME_FORMAT.AMPM}`
  ].join(' ');
  
  // Append dialog to modal
  modalElement.appendChild(dialogElement);
  
  // Append modal to document body
  document.body.appendChild(modalElement);
  
  // Parse initial time value or use current time
  let timeValue: TimeValue;
  if (config.value) {
    const parts = config.value.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parts[2] ? parseInt(parts[2], 10) : 0;
    
    timeValue = {
      hours,
      minutes,
      seconds,
      period: hours >= 12 ? TIME_PERIOD.PM : TIME_PERIOD.AM
    };
  } else {
    // Default to current time
    const now = new Date();
    timeValue = {
      hours: now.getHours(),
      minutes: now.getMinutes(),
      seconds: config.showSeconds ? now.getSeconds() : 0,
      period: now.getHours() >= 12 ? TIME_PERIOD.PM : TIME_PERIOD.AM
    };
  }
  
  // Track state
  let isOpen = !!config.isOpen;
  let currentType = config.type || TIME_PICKER_TYPE.DIAL;
  let currentFormat = config.format || TIME_FORMAT.AMPM;
  let currentOrientation = config.orientation || TIME_PICKER_ORIENTATION.VERTICAL;
  let currentTitle = config.title || '';
  
  // Event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  // Update modal visibility based on isOpen state
  const updateVisibility = () => {
    modalElement.style.display = isOpen ? 'block' : 'none';
    if (isOpen) {
      modalElement.classList.add('active');
      dialogElement.classList.add('active');
      element.classList.add('mtrl-time-picker--open');
    } else {
      modalElement.classList.remove('active');
      dialogElement.classList.remove('active');
      element.classList.remove('mtrl-time-picker--open');
    }
  };
  
  // Set initial visibility
  updateVisibility();
  
  // Format the time value as a string
  const formatTimeValue = (): string => {
    const { hours, minutes, seconds } = timeValue;
    const use24HourFormat = currentFormat === TIME_FORMAT.MILITARY;
    
    // Helper function to pad numbers with leading zeros
    const padZero = (num: number): string => {
      return num.toString().padStart(2, '0');
    };
    
    if (use24HourFormat) {
      if (config.showSeconds) {
        return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds || 0)}`;
      }
      return `${padZero(hours)}:${padZero(minutes)}`;
    } else {
      // Convert to 12-hour format for display
      let displayHours = hours % 12;
      if (displayHours === 0) {
        displayHours = 12;
      }
      
      if (config.showSeconds) {
        return `${padZero(displayHours)}:${padZero(minutes)}:${padZero(seconds || 0)} ${timeValue.period}`;
      }
      return `${padZero(displayHours)}:${padZero(minutes)} ${timeValue.period}`;
    }
  };
  
  // Emit event helper
  const emitEvent = (eventName: string, data?: any) => {
    if (eventHandlers[eventName]) {
      eventHandlers[eventName].forEach(handler => {
        handler(data);
      });
    }
    
    // Call appropriate callback if provided
    switch (eventName) {
      case 'change':
        if (config.onChange) config.onChange(formatTimeValue());
        break;
      case 'open':
        if (config.onOpen) config.onOpen();
        break;
      case 'close':
        if (config.onClose) config.onClose();
        break;
      case 'confirm':
        if (config.onConfirm) config.onConfirm(formatTimeValue());
        break;
      case 'cancel':
        if (config.onCancel) config.onCancel();
        break;
    }
  };
  
  const timePickerObj = {
    element,
    modalElement,
    dialogElement,
    isOpen,
    
    open() {
      if (isOpen) return this;
      
      isOpen = true;
      this.isOpen = true; // Update the public property too
      updateVisibility();
      emitEvent('open');
      
      return this;
    },
    
    close() {
      if (!isOpen) return this;
      
      isOpen = false;
      this.isOpen = false; // Update the public property too
      updateVisibility();
      emitEvent('close');
      
      return this;
    },
    
    toggle() {
      return isOpen ? this.close() : this.open();
    },
    
    getValue() {
      return formatTimeValue();
    },
    
    getTimeObject() {
      return { ...timeValue };
    },
    
    setValue(time: string) {
      try {
        const parts = time.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parts[2] ? parseInt(parts[2], 10) : 0;
        
        if (
          isNaN(hours) || hours < 0 || hours > 23 ||
          isNaN(minutes) || minutes < 0 || minutes > 59 ||
          isNaN(seconds) || seconds < 0 || seconds > 59
        ) {
          throw new Error('Invalid time format');
        }
        
        timeValue = {
          hours,
          minutes,
          seconds,
          period: hours >= 12 ? TIME_PERIOD.PM : TIME_PERIOD.AM
        };
        
        emitEvent('change', formatTimeValue());
      } catch (error) {
        console.error('Error setting time value:', error);
      }
      
      return this;
    },
    
    setType(type: TIME_PICKER_TYPE) {
      if (currentType === type) return this;
      
      // Update class
      dialogElement.classList.remove(`mtrl-time-picker-dialog--${currentType}`);
      dialogElement.classList.add(`mtrl-time-picker-dialog--${type}`);
      
      currentType = type;
      return this;
    },
    
    getType() {
      return currentType;
    },
    
    setFormat(format: TIME_FORMAT) {
      if (currentFormat === format) return this;
      
      // Update class
      dialogElement.classList.remove(`mtrl-time-picker-dialog--${currentFormat}`);
      dialogElement.classList.add(`mtrl-time-picker-dialog--${format}`);
      
      currentFormat = format;
      emitEvent('change', formatTimeValue());
      
      return this;
    },
    
    getFormat() {
      return currentFormat;
    },
    
    setOrientation(orientation: TIME_PICKER_ORIENTATION) {
      if (currentOrientation === orientation) return this;
      
      // Update class
      dialogElement.classList.remove(`mtrl-time-picker-dialog--${currentOrientation}`);
      dialogElement.classList.add(`mtrl-time-picker-dialog--${orientation}`);
      
      currentOrientation = orientation;
      return this;
    },
    
    getOrientation() {
      return currentOrientation;
    },
    
    setTitle(title: string) {
      currentTitle = title;
      
      // If there's a title element, update it
      const titleElement = dialogElement.querySelector('.mtrl-time-picker-title');
      if (titleElement) {
        titleElement.textContent = title;
      }
      
      return this;
    },
    
    getTitle() {
      return currentTitle;
    },
    
    destroy() {
      // Close if open
      if (isOpen) {
        this.close();
      }
      
      // Remove from DOM
      if (modalElement.parentNode) {
        modalElement.parentNode.removeChild(modalElement);
      }
      
      // Clean up event handlers
      Object.keys(eventHandlers).forEach(event => {
        eventHandlers[event] = [];
      });
    },
    
    on(event: string, handler: Function) {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);
      return this;
    },
    
    off(event: string, handler: Function) {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      return this;
    }
  };
  
  return timePickerObj;
};

describe('TimePicker Component', () => {
  test('should create a time picker component', () => {
    const timePicker = createMockTimePicker();
    
    expect(timePicker.element).toBeDefined();
    expect(timePicker.modalElement).toBeDefined();
    expect(timePicker.dialogElement).toBeDefined();
    expect(timePicker.isOpen).toBe(false);
  });
  
  test('should initialize with custom time value', () => {
    const timePicker = createMockTimePicker({
      value: '14:30'
    });
    
    expect(timePicker.getValue()).toBe('02:30 PM');
    
    const timeObject = timePicker.getTimeObject();
    expect(timeObject.hours).toBe(14);
    expect(timeObject.minutes).toBe(30);
    expect(timeObject.period).toBe(TIME_PERIOD.PM);
  });
  
  test('should initialize in 24-hour format', () => {
    const timePicker = createMockTimePicker({
      value: '14:30',
      format: TIME_FORMAT.MILITARY
    });
    
    expect(timePicker.getValue()).toBe('14:30');
    
    const timeObject = timePicker.getTimeObject();
    expect(timeObject.hours).toBe(14);
    expect(timeObject.minutes).toBe(30);
  });
  
  test('should toggle open/close state', () => {
    const timePicker = createMockTimePicker();
    
    // Initial state is closed
    expect(timePicker.isOpen).toBe(false);
    expect(timePicker.modalElement.style.display).toBe('none');
    
    // Open the time picker
    timePicker.open();
    expect(timePicker.isOpen).toBe(true);
    expect(timePicker.modalElement.style.display).toBe('block');
    expect(timePicker.modalElement.classList.contains('active')).toBe(true);
    
    // Close the time picker
    timePicker.close();
    expect(timePicker.isOpen).toBe(false);
    expect(timePicker.modalElement.classList.contains('active')).toBe(false);
    
    // Toggle should open it again
    timePicker.toggle();
    expect(timePicker.isOpen).toBe(true);
    
    // Toggle again should close it
    timePicker.toggle();
    expect(timePicker.isOpen).toBe(false);
  });
  
  test('should set and get time values', () => {
    const timePicker = createMockTimePicker();
    
    // Set a new time
    timePicker.setValue('09:45');
    expect(timePicker.getValue()).toBe('09:45 AM');
    
    const timeObject = timePicker.getTimeObject();
    expect(timeObject.hours).toBe(9);
    expect(timeObject.minutes).toBe(45);
    expect(timeObject.period).toBe(TIME_PERIOD.AM);
    
    // Set an afternoon time
    timePicker.setValue('16:20');
    expect(timePicker.getValue()).toBe('04:20 PM');
    
    const pmTimeObject = timePicker.getTimeObject();
    expect(pmTimeObject.hours).toBe(16);
    expect(pmTimeObject.minutes).toBe(20);
    expect(pmTimeObject.period).toBe(TIME_PERIOD.PM);
  });
  
  test('should change time picker type', () => {
    const timePicker = createMockTimePicker({
      type: TIME_PICKER_TYPE.DIAL
    });
    
    expect(timePicker.getType()).toBe(TIME_PICKER_TYPE.DIAL);
    expect(timePicker.dialogElement.classList.contains('mtrl-time-picker-dialog--dial')).toBe(true);
    
    // Change to INPUT type
    timePicker.setType(TIME_PICKER_TYPE.INPUT);
    expect(timePicker.getType()).toBe(TIME_PICKER_TYPE.INPUT);
    expect(timePicker.dialogElement.classList.contains('mtrl-time-picker-dialog--input')).toBe(true);
    expect(timePicker.dialogElement.classList.contains('mtrl-time-picker-dialog--dial')).toBe(false);
  });
  
  test('should change time format', () => {
    const timePicker = createMockTimePicker({
      value: '14:30',
      format: TIME_FORMAT.AMPM
    });
    
    expect(timePicker.getFormat()).toBe(TIME_FORMAT.AMPM);
    expect(timePicker.getValue()).toBe('02:30 PM');
    
    // Change to 24-hour format
    timePicker.setFormat(TIME_FORMAT.MILITARY);
    expect(timePicker.getFormat()).toBe(TIME_FORMAT.MILITARY);
    expect(timePicker.getValue()).toBe('14:30');
    expect(timePicker.dialogElement.classList.contains('mtrl-time-picker-dialog--24h')).toBe(true);
  });
  
  test('should change orientation', () => {
    const timePicker = createMockTimePicker({
      orientation: TIME_PICKER_ORIENTATION.VERTICAL
    });
    
    expect(timePicker.getOrientation()).toBe(TIME_PICKER_ORIENTATION.VERTICAL);
    expect(timePicker.dialogElement.classList.contains('mtrl-time-picker-dialog--vertical')).toBe(true);
    
    // Change to horizontal orientation
    timePicker.setOrientation(TIME_PICKER_ORIENTATION.HORIZONTAL);
    expect(timePicker.getOrientation()).toBe(TIME_PICKER_ORIENTATION.HORIZONTAL);
    expect(timePicker.dialogElement.classList.contains('mtrl-time-picker-dialog--horizontal')).toBe(true);
    expect(timePicker.dialogElement.classList.contains('mtrl-time-picker-dialog--vertical')).toBe(false);
  });
  
  test('should set and get title', () => {
    const initialTitle = 'Select Time';
    const timePicker = createMockTimePicker({
      title: initialTitle
    });
    
    expect(timePicker.getTitle()).toBe(initialTitle);
    
    // Update the title
    const newTitle = 'Choose Departure Time';
    timePicker.setTitle(newTitle);
    expect(timePicker.getTitle()).toBe(newTitle);
  });
  
  test('should handle event callbacks', () => {
    const changeHandler = mock(() => {});
    const openHandler = mock(() => {});
    const closeHandler = mock(() => {});
    
    const timePicker = createMockTimePicker();
    
    // Register event handlers
    timePicker.on('change', changeHandler);
    timePicker.on('open', openHandler);
    timePicker.on('close', closeHandler);
    
    // Trigger events
    timePicker.open();
    expect(openHandler).toHaveBeenCalled();
    
    timePicker.setValue('10:15');
    expect(changeHandler).toHaveBeenCalled();
    
    timePicker.close();
    expect(closeHandler).toHaveBeenCalled();
    
    // Remove an event handler
    timePicker.off('change', changeHandler);
    changeHandler.mockClear();
    
    // The handler should no longer be called
    timePicker.setValue('11:30');
    expect(changeHandler).not.toHaveBeenCalled();
  });
  
  test('should trigger config callbacks', () => {
    const onChangeMock = mock(() => {});
    const onOpenMock = mock(() => {});
    const onCloseMock = mock(() => {});
    
    const timePicker = createMockTimePicker({
      onChange: onChangeMock,
      onOpen: onOpenMock,
      onClose: onCloseMock
    });
    
    // Trigger events
    timePicker.open();
    expect(onOpenMock).toHaveBeenCalled();
    
    timePicker.setValue('09:30');
    expect(onChangeMock).toHaveBeenCalledWith('09:30 AM');
    
    timePicker.close();
    expect(onCloseMock).toHaveBeenCalled();
  });
  
  test('should handle time with seconds when showSeconds is true', () => {
    const timePicker = createMockTimePicker({
      value: '14:30:45',
      showSeconds: true
    });
    
    expect(timePicker.getValue()).toBe('02:30:45 PM');
    
    const timeObject = timePicker.getTimeObject();
    expect(timeObject.hours).toBe(14);
    expect(timeObject.minutes).toBe(30);
    expect(timeObject.seconds).toBe(45);
    
    // Update time with seconds
    timePicker.setValue('08:15:30');
    expect(timePicker.getValue()).toBe('08:15:30 AM');
  });
  
  test('should cleanup properly when destroyed', () => {
    const timePicker = createMockTimePicker();
    const modalElement = timePicker.modalElement;
    
    // Add to document
    document.body.appendChild(timePicker.element);
    
    // Verify modal is in the document
    expect(document.body.contains(modalElement)).toBe(true);
    
    // Destroy the component
    timePicker.destroy();
    
    // Verify modal was removed
    expect(document.body.contains(modalElement)).toBe(false);
  });
});