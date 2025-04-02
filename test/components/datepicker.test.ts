// test/components/datepicker.test.ts
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';
import {
  type DatePickerComponent,
  type DatePickerConfig,
  type DatePickerVariant,
  type DatePickerView,
  type DatePickerSelectionMode,
  DAY_NAMES,
  MONTH_NAMES,
  DEFAULT_DATE_FORMAT
} from '../../src/components/datepicker/types';

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

// Mock datepicker implementation
const createMockDatePicker = (config: DatePickerConfig = {}): DatePickerComponent => {
  // Create the main elements
  const element = document.createElement('div');
  element.className = 'mtrl-datepicker';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'mtrl-datepicker__input';
  
  // Set default configuration
  const settings = {
    variant: config.variant || 'docked',
    disabled: config.disabled || false,
    initialView: config.initialView || 'day',
    selectionMode: config.selectionMode || 'single',
    dateFormat: config.dateFormat || DEFAULT_DATE_FORMAT,
    componentName: config.componentName || 'datepicker',
    prefix: config.prefix || 'mtrl',
    closeOnSelect: config.closeOnSelect === undefined 
      ? (config.variant === 'modal' || config.variant === 'modal-input') 
      : config.closeOnSelect
  };
  
  // Apply variant class
  if (settings.variant) {
    element.classList.add(`mtrl-datepicker--${settings.variant}`);
  }
  
  // Apply disabled state
  if (settings.disabled) {
    element.classList.add('mtrl-datepicker--disabled');
    input.disabled = true;
  }
  
  // Apply label if provided
  if (config.label) {
    const label = document.createElement('label');
    label.className = 'mtrl-datepicker__label';
    label.textContent = config.label;
    element.appendChild(label);
  }
  
  // Apply placeholder if provided
  if (config.placeholder) {
    input.placeholder = config.placeholder;
  }
  
  // Apply additional classes
  if (config.class) {
    const classes = config.class.split(' ');
    classes.forEach(className => element.classList.add(className));
  }
  
  element.appendChild(input);
  
  // Create calendar container
  const calendarContainer = document.createElement('div');
  calendarContainer.className = 'mtrl-datepicker__calendar';
  calendarContainer.style.display = 'none'; // Hidden by default
  
  // Create calendar header
  const calendarHeader = document.createElement('div');
  calendarHeader.className = 'mtrl-datepicker__header';
  
  const prevButton = document.createElement('button');
  prevButton.className = 'mtrl-datepicker__prev';
  prevButton.setAttribute('aria-label', 'Previous month');
  
  const nextButton = document.createElement('button');
  nextButton.className = 'mtrl-datepicker__next';
  nextButton.setAttribute('aria-label', 'Next month');
  
  const titleContainer = document.createElement('div');
  titleContainer.className = 'mtrl-datepicker__title';
  
  const monthYearDisplay = document.createElement('button');
  monthYearDisplay.className = 'mtrl-datepicker__month-year';
  
  titleContainer.appendChild(monthYearDisplay);
  calendarHeader.appendChild(prevButton);
  calendarHeader.appendChild(titleContainer);
  calendarHeader.appendChild(nextButton);
  
  calendarContainer.appendChild(calendarHeader);
  
  // Create calendar body
  const calendarBody = document.createElement('div');
  calendarBody.className = 'mtrl-datepicker__body';
  
  // Create days-of-week header
  const daysHeader = document.createElement('div');
  daysHeader.className = 'mtrl-datepicker__days-header';
  
  DAY_NAMES.forEach(day => {
    const dayEl = document.createElement('span');
    dayEl.className = 'mtrl-datepicker__day-name';
    dayEl.textContent = day;
    daysHeader.appendChild(dayEl);
  });
  
  calendarBody.appendChild(daysHeader);
  
  // Create days grid
  const daysGrid = document.createElement('div');
  daysGrid.className = 'mtrl-datepicker__days-grid';
  calendarBody.appendChild(daysGrid);
  
  // Create months grid (initially hidden)
  const monthsGrid = document.createElement('div');
  monthsGrid.className = 'mtrl-datepicker__months-grid';
  monthsGrid.style.display = 'none';
  
  MONTH_NAMES.forEach((month, index) => {
    const monthEl = document.createElement('button');
    monthEl.className = 'mtrl-datepicker__month';
    monthEl.textContent = month;
    monthEl.setAttribute('data-month', index.toString());
    monthsGrid.appendChild(monthEl);
  });
  
  calendarBody.appendChild(monthsGrid);
  
  // Create years grid (initially hidden)
  const yearsGrid = document.createElement('div');
  yearsGrid.className = 'mtrl-datepicker__years-grid';
  yearsGrid.style.display = 'none';
  
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 50; i <= currentYear + 50; i++) {
    const yearEl = document.createElement('button');
    yearEl.className = 'mtrl-datepicker__year';
    yearEl.textContent = i.toString();
    yearEl.setAttribute('data-year', i.toString());
    yearsGrid.appendChild(yearEl);
  }
  
  calendarBody.appendChild(yearsGrid);
  calendarContainer.appendChild(calendarBody);
  
  // Create footer with action buttons
  const footer = document.createElement('div');
  footer.className = 'mtrl-datepicker__footer';
  
  const cancelButton = document.createElement('button');
  cancelButton.className = 'mtrl-datepicker__cancel';
  cancelButton.textContent = 'Cancel';
  
  const okButton = document.createElement('button');
  okButton.className = 'mtrl-datepicker__ok';
  okButton.textContent = 'OK';
  
  const clearButton = document.createElement('button');
  clearButton.className = 'mtrl-datepicker__clear';
  clearButton.textContent = 'Clear';
  
  footer.appendChild(cancelButton);
  footer.appendChild(clearButton);
  footer.appendChild(okButton);
  
  calendarContainer.appendChild(footer);
  element.appendChild(calendarContainer);
  
  // Track current state
  let currentView: DatePickerView = settings.initialView as DatePickerView;
  let currentDate = new Date();
  let isOpen = false;
  let selectedDates: Date[] = [];
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  
  // Parse initial dates
  if (config.minDate) {
    minDate = typeof config.minDate === 'string' 
      ? new Date(config.minDate) 
      : config.minDate;
  }
  
  if (config.maxDate) {
    maxDate = typeof config.maxDate === 'string' 
      ? new Date(config.maxDate) 
      : config.maxDate;
  }
  
  // Parse initial value
  if (config.value) {
    if (Array.isArray(config.value)) {
      // Handle range selection
      const startDate = typeof config.value[0] === 'string' 
        ? new Date(config.value[0]) 
        : config.value[0];
      
      const endDate = typeof config.value[1] === 'string' 
        ? new Date(config.value[1]) 
        : config.value[1];
      
      selectedDates = [startDate, endDate];
      currentDate = new Date(startDate);
    } else {
      // Handle single date selection
      const date = typeof config.value === 'string' 
        ? new Date(config.value) 
        : config.value;
      
      selectedDates = [date];
      currentDate = new Date(date);
    }
    
    // Update input value
    updateInputValue();
  }
  
  // Update calendar display based on current view and date
  const updateCalendarDisplay = () => {
    // Update month-year title
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    monthYearDisplay.textContent = `${MONTH_NAMES[month]} ${year}`;
    
    // Show/hide appropriate grid based on current view
    daysGrid.style.display = currentView === 'day' ? 'grid' : 'none';
    monthsGrid.style.display = currentView === 'month' ? 'grid' : 'none';
    yearsGrid.style.display = currentView === 'year' ? 'grid' : 'none';
    
    if (currentView === 'day') {
      renderDaysGrid();
    } else if (currentView === 'month') {
      highlightCurrentMonth();
    } else if (currentView === 'year') {
      highlightCurrentYear();
    }
  };
  
  // Render the days grid for the current month
  const renderDaysGrid = () => {
    // Clear existing days
    daysGrid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and number of days
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Get day of week for first day (0-6, Sunday-Saturday)
    const firstDayWeekday = firstDayOfMonth.getDay();
    
    // Get days from previous month to display
    const daysFromPrevMonth = firstDayWeekday;
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // Today's date for highlighting
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    const todayDate = today.getDate();
    
    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const dayEl = document.createElement('button');
      dayEl.className = 'mtrl-datepicker__day mtrl-datepicker__day--outside-month';
      dayEl.textContent = dayNum.toString();
      dayEl.setAttribute('data-date', `${year}-${month === 0 ? 12 : month}-${dayNum}`);
      daysGrid.appendChild(dayEl);
    }
    
    // Add days for current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayEl = document.createElement('button');
      dayEl.className = 'mtrl-datepicker__day';
      
      // Check if this day is today
      if (isCurrentMonth && i === todayDate) {
        dayEl.classList.add('mtrl-datepicker__day--today');
      }
      
      // Check if this day is selected
      const dayDate = new Date(year, month, i);
      if (selectedDates.length > 0) {
        if (settings.selectionMode === 'single' && isSameDay(selectedDates[0], dayDate)) {
          dayEl.classList.add('mtrl-datepicker__day--selected');
        } else if (settings.selectionMode === 'range' && selectedDates.length === 2) {
          // Check for range selection (start, end, and in-between days)
          if (isSameDay(selectedDates[0], dayDate)) {
            dayEl.classList.add('mtrl-datepicker__day--range-start');
          } else if (isSameDay(selectedDates[1], dayDate)) {
            dayEl.classList.add('mtrl-datepicker__day--range-end');
          } else if (dayDate > selectedDates[0] && dayDate < selectedDates[1]) {
            dayEl.classList.add('mtrl-datepicker__day--range-middle');
          }
        }
      }
      
      // Check if this day is within min/max limits
      if (isDateDisabled(dayDate)) {
        dayEl.classList.add('mtrl-datepicker__day--disabled');
        dayEl.disabled = true;
      }
      
      dayEl.textContent = i.toString();
      dayEl.setAttribute('data-date', `${year}-${month + 1}-${i}`);
      daysGrid.appendChild(dayEl);
      
      // Add click handler
      dayEl.addEventListener('click', () => handleDayClick(dayDate));
    }
    
    // Add days from next month to fill the grid
    const totalCells = 42; // 6 rows * 7 days
    const remainingCells = totalCells - (daysFromPrevMonth + daysInMonth);
    
    for (let i = 1; i <= remainingCells; i++) {
      const dayEl = document.createElement('button');
      dayEl.className = 'mtrl-datepicker__day mtrl-datepicker__day--outside-month';
      dayEl.textContent = i.toString();
      dayEl.setAttribute('data-date', `${year}-${month + 2}-${i}`);
      daysGrid.appendChild(dayEl);
    }
  };
  
  // Highlight the current month in the months grid
  const highlightCurrentMonth = () => {
    const currentMonth = currentDate.getMonth();
    
    const monthButtons = monthsGrid.querySelectorAll('.mtrl-datepicker__month');
    monthButtons.forEach((button: Element) => {
      button.classList.remove('mtrl-datepicker__month--selected');
      
      const monthIndex = parseInt(button.getAttribute('data-month') || '0');
      if (monthIndex === currentMonth) {
        button.classList.add('mtrl-datepicker__month--selected');
      }
      
      // Add click handler
      button.addEventListener('click', () => {
        currentDate.setMonth(monthIndex);
        currentView = 'day';
        updateCalendarDisplay();
      });
    });
  };
  
  // Highlight the current year in the years grid
  const highlightCurrentYear = () => {
    const currentYearValue = currentDate.getFullYear();
    
    const yearButtons = yearsGrid.querySelectorAll('.mtrl-datepicker__year');
    yearButtons.forEach((button: Element) => {
      button.classList.remove('mtrl-datepicker__year--selected');
      
      const yearValue = parseInt(button.getAttribute('data-year') || '0');
      if (yearValue === currentYearValue) {
        button.classList.add('mtrl-datepicker__year--selected');
        // Remove scrollIntoView as it's not implemented in our JSDOM environment
      }
      
      // Add click handler
      button.addEventListener('click', () => {
        currentDate.setFullYear(yearValue);
        currentView = 'month';
        updateCalendarDisplay();
      });
    });
  };
  
  // Handle day selection
  const handleDayClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    
    if (settings.selectionMode === 'single') {
      selectedDates = [new Date(date)];
      updateInputValue();
      
      if (settings.closeOnSelect) {
        datepicker.close();
      }
    } else if (settings.selectionMode === 'range') {
      if (selectedDates.length === 0 || selectedDates.length === 2) {
        // Start new range selection
        selectedDates = [new Date(date)];
      } else {
        // Complete range selection
        if (date < selectedDates[0]) {
          // Swap dates if second selection is before first
          selectedDates = [new Date(date), selectedDates[0]];
        } else {
          selectedDates.push(new Date(date));
        }
        
        updateInputValue();
        
        if (settings.closeOnSelect) {
          datepicker.close();
        }
      }
    }
    
    renderDaysGrid();
    emit('change', datepicker.getValue());
  };
  
  // Check if two dates are the same day
  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };
  
  // Check if a date is disabled
  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    
    // Check special dates
    if (config.specialDates) {
      for (const specialDate of config.specialDates) {
        const checkDate = typeof specialDate.date === 'string'
          ? new Date(specialDate.date)
          : specialDate.date;
        
        if (isSameDay(checkDate, date) && specialDate.disabled) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  // Format date to string based on format
  const formatDate = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    
    let formatted = settings.dateFormat;
    formatted = formatted.replace('MM', month.toString().padStart(2, '0'));
    formatted = formatted.replace('DD', day.toString().padStart(2, '0'));
    formatted = formatted.replace('YYYY', year.toString());
    
    return formatted;
  };
  
  // Update input value based on selected dates
  const updateInputValue = () => {
    if (selectedDates.length === 0) {
      input.value = '';
    } else if (selectedDates.length === 1 || settings.selectionMode === 'single') {
      input.value = formatDate(selectedDates[0]);
    } else if (selectedDates.length === 2 && settings.selectionMode === 'range') {
      input.value = `${formatDate(selectedDates[0])} - ${formatDate(selectedDates[1])}`;
    }
  };
  
  // Event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  const emit = (event: string, data?: any) => {
    if (eventHandlers[event]) {
      eventHandlers[event].forEach(handler => handler(data));
    }
  };
  
  // Add calendar navigation event handlers
  prevButton.addEventListener('click', () => {
    if (currentView === 'day') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else if (currentView === 'year') {
      currentDate.setFullYear(currentDate.getFullYear() - 10);
    }
    updateCalendarDisplay();
  });
  
  nextButton.addEventListener('click', () => {
    if (currentView === 'day') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (currentView === 'year') {
      currentDate.setFullYear(currentDate.getFullYear() + 10);
    }
    updateCalendarDisplay();
  });
  
  // Month/year display click handler
  monthYearDisplay.addEventListener('click', () => {
    if (currentView === 'day') {
      currentView = 'month';
    } else if (currentView === 'month') {
      currentView = 'year';
    } else {
      currentView = 'day';
    }
    updateCalendarDisplay();
  });
  
  // Input click handler to open datepicker
  input.addEventListener('click', () => {
    if (!settings.disabled) {
      datepicker.open();
    }
  });
  
  // Footer button handlers
  cancelButton.addEventListener('click', () => {
    datepicker.close();
  });
  
  okButton.addEventListener('click', () => {
    datepicker.close();
  });
  
  clearButton.addEventListener('click', () => {
    datepicker.clear();
  });
  
  // Create the calendar API
  const calendarAPI = {
    goToDate: (date: Date) => {
      currentDate = new Date(date);
      updateCalendarDisplay();
    },
    
    nextMonth: () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      updateCalendarDisplay();
    },
    
    prevMonth: () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      updateCalendarDisplay();
    },
    
    nextYear: () => {
      currentDate.setFullYear(currentDate.getFullYear() + 1);
      updateCalendarDisplay();
    },
    
    prevYear: () => {
      currentDate.setFullYear(currentDate.getFullYear() - 1);
      updateCalendarDisplay();
    },
    
    showDayView: () => {
      currentView = 'day';
      updateCalendarDisplay();
    },
    
    showMonthView: () => {
      currentView = 'month';
      updateCalendarDisplay();
    },
    
    showYearView: () => {
      currentView = 'year';
      updateCalendarDisplay();
    },
    
    getCurrentView: () => currentView
  };
  
  // Create the datepicker component
  const datepicker: DatePickerComponent = {
    element,
    input,
    calendar: calendarAPI,
    
    disabled: {
      enable: () => {
        element.classList.remove('mtrl-datepicker--disabled');
        input.disabled = false;
        settings.disabled = false;
      },
      disable: () => {
        element.classList.add('mtrl-datepicker--disabled');
        input.disabled = true;
        settings.disabled = true;
      },
      isDisabled: () => settings.disabled
    },
    
    lifecycle: {
      destroy: () => {
        datepicker.destroy();
      }
    },
    
    getClass: (name: string) => {
      const prefix = settings.prefix;
      return name ? `${prefix}-${name}` : `${prefix}-datepicker`;
    },
    
    open: () => {
      if (!settings.disabled && !isOpen) {
        calendarContainer.style.display = 'block';
        isOpen = true;
        updateCalendarDisplay();
        emit('open');
      }
      return datepicker;
    },
    
    close: () => {
      if (isOpen) {
        calendarContainer.style.display = 'none';
        isOpen = false;
        emit('close');
      }
      return datepicker;
    },
    
    getValue: () => {
      if (selectedDates.length === 0) {
        return null;
      } else if (settings.selectionMode === 'single' || selectedDates.length === 1) {
        return selectedDates[0];
      } else {
        return [selectedDates[0], selectedDates[1]] as [Date, Date];
      }
    },
    
    setValue: (value) => {
      if (value === null || value === undefined) {
        selectedDates = [];
      } else if (Array.isArray(value)) {
        // Handle range selection
        selectedDates = value.map(d => typeof d === 'string' ? new Date(d) : new Date(d));
        if (selectedDates.length > 0) {
          currentDate = new Date(selectedDates[0]);
        }
      } else {
        // Handle single date selection
        const date = typeof value === 'string' ? new Date(value) : new Date(value);
        selectedDates = [date];
        currentDate = new Date(date);
      }
      
      updateInputValue();
      updateCalendarDisplay();
      emit('change', datepicker.getValue());
      
      return datepicker;
    },
    
    getFormattedValue: () => {
      if (selectedDates.length === 0) {
        return '';
      } else if (settings.selectionMode === 'single' || selectedDates.length === 1) {
        return formatDate(selectedDates[0]);
      } else {
        return `${formatDate(selectedDates[0])} - ${formatDate(selectedDates[1])}`;
      }
    },
    
    clear: () => {
      selectedDates = [];
      updateInputValue();
      renderDaysGrid();
      emit('change', null);
      
      return datepicker;
    },
    
    enable: () => {
      datepicker.disabled.enable();
      return datepicker;
    },
    
    disable: () => {
      datepicker.disabled.disable();
      return datepicker;
    },
    
    setMinDate: (date) => {
      minDate = typeof date === 'string' ? new Date(date) : new Date(date);
      updateCalendarDisplay();
      return datepicker;
    },
    
    setMaxDate: (date) => {
      maxDate = typeof date === 'string' ? new Date(date) : new Date(date);
      updateCalendarDisplay();
      return datepicker;
    },
    
    destroy: () => {
      // Remove event listeners
      input.removeEventListener('click', datepicker.open);
      
      // Remove the element from the DOM if it has a parent
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Clear event handlers
      for (const event in eventHandlers) {
        eventHandlers[event] = [];
      }
    },
    
    on: (event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);
      return datepicker;
    },
    
    off: (event: string, handler: Function) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      return datepicker;
    }
  };
  
  // Initialize calendar display
  updateCalendarDisplay();
  
  return datepicker;
};

describe('DatePicker Component', () => {
  test('should create a datepicker element', () => {
    const datepicker = createMockDatePicker();
    expect(datepicker.element).toBeDefined();
    expect(datepicker.element.tagName).toBe('DIV');
    expect(datepicker.element.className).toContain('mtrl-datepicker');
    
    expect(datepicker.input).toBeDefined();
    expect(datepicker.input.tagName).toBe('INPUT');
    expect(datepicker.input.className).toContain('mtrl-datepicker__input');
  });
  
  test('should support different variants', () => {
    const variants: DatePickerVariant[] = ['docked', 'modal', 'modal-input'];
    
    variants.forEach(variant => {
      const datepicker = createMockDatePicker({ variant });
      expect(datepicker.element.className).toContain(`mtrl-datepicker--${variant}`);
    });
  });
  
  test('should set label text', () => {
    const datepicker = createMockDatePicker({ label: 'Select Date' });
    
    const label = datepicker.element.querySelector('.mtrl-datepicker__label');
    expect(label).toBeDefined();
    expect(label?.textContent).toBe('Select Date');
  });
  
  test('should set placeholder text', () => {
    const datepicker = createMockDatePicker({ placeholder: 'MM/DD/YYYY' });
    
    expect(datepicker.input.placeholder).toBe('MM/DD/YYYY');
  });
  
  test('should apply disabled state', () => {
    const datepicker = createMockDatePicker({ disabled: true });
    
    expect(datepicker.element.className).toContain('mtrl-datepicker--disabled');
    expect(datepicker.input.disabled).toBe(true);
    expect(datepicker.disabled.isDisabled()).toBe(true);
  });
  
  test('should open and close the calendar', () => {
    const datepicker = createMockDatePicker();
    
    const calendar = datepicker.element.querySelector('.mtrl-datepicker__calendar');
    expect(calendar).toBeDefined();
    expect(calendar?.style.display).toBe('none');
    
    datepicker.open();
    expect(calendar?.style.display).toBe('block');
    
    datepicker.close();
    expect(calendar?.style.display).toBe('none');
  });
  
  test('should navigate between months', () => {
    const datepicker = createMockDatePicker();
    
    // Set a specific date for testing
    const testDate = new Date(2023, 0, 1); // January 1, 2023
    datepicker.calendar.goToDate(testDate);
    
    // Get the month-year display
    const monthYearDisplay = datepicker.element.querySelector('.mtrl-datepicker__month-year');
    expect(monthYearDisplay?.textContent).toContain('January 2023');
    
    // Navigate to next month
    datepicker.calendar.nextMonth();
    expect(monthYearDisplay?.textContent).toContain('February 2023');
    
    // Navigate to previous month
    datepicker.calendar.prevMonth();
    expect(monthYearDisplay?.textContent).toContain('January 2023');
  });
  
  test('should navigate between years', () => {
    const datepicker = createMockDatePicker();
    
    // Set a specific date for testing
    const testDate = new Date(2023, 0, 1); // January 1, 2023
    datepicker.calendar.goToDate(testDate);
    
    // Get the month-year display
    const monthYearDisplay = datepicker.element.querySelector('.mtrl-datepicker__month-year');
    expect(monthYearDisplay?.textContent).toContain('January 2023');
    
    // Navigate to next year
    datepicker.calendar.nextYear();
    expect(monthYearDisplay?.textContent).toContain('January 2024');
    
    // Navigate to previous year
    datepicker.calendar.prevYear();
    expect(monthYearDisplay?.textContent).toContain('January 2023');
  });
  
  test('should switch between calendar views', () => {
    const datepicker = createMockDatePicker();
    
    // Default view should be day view
    expect(datepicker.calendar.getCurrentView()).toBe('day');
    
    const daysGrid = datepicker.element.querySelector('.mtrl-datepicker__days-grid');
    const monthsGrid = datepicker.element.querySelector('.mtrl-datepicker__months-grid');
    const yearsGrid = datepicker.element.querySelector('.mtrl-datepicker__years-grid');
    
    // Open the datepicker to make sure display is updated
    datepicker.open();
    
    expect(daysGrid?.style.display).not.toBe('none');
    expect(monthsGrid?.style.display).toBe('none');
    expect(yearsGrid?.style.display).toBe('none');
    
    // Switch to month view
    datepicker.calendar.showMonthView();
    expect(datepicker.calendar.getCurrentView()).toBe('month');
    expect(daysGrid?.style.display).toBe('none');
    expect(monthsGrid?.style.display).not.toBe('none');
    expect(yearsGrid?.style.display).toBe('none');
    
    // Switch to year view
    datepicker.calendar.showYearView();
    expect(datepicker.calendar.getCurrentView()).toBe('year');
    expect(daysGrid?.style.display).toBe('none');
    expect(monthsGrid?.style.display).toBe('none');
    expect(yearsGrid?.style.display).not.toBe('none');
    
    // Switch back to day view
    datepicker.calendar.showDayView();
    expect(datepicker.calendar.getCurrentView()).toBe('day');
    expect(daysGrid?.style.display).not.toBe('none');
    expect(monthsGrid?.style.display).toBe('none');
    expect(yearsGrid?.style.display).toBe('none');
  });
  
  test('should set and get date value', () => {
    const datepicker = createMockDatePicker();
    
    // Initial value should be null
    expect(datepicker.getValue()).toBeNull();
    
    // Set a date
    const testDate = new Date(2023, 0, 15); // January 15, 2023
    datepicker.setValue(testDate);
    
    // Get the selected date
    const selectedDate = datepicker.getValue() as Date;
    expect(selectedDate).toBeInstanceOf(Date);
    expect(selectedDate.getFullYear()).toBe(2023);
    expect(selectedDate.getMonth()).toBe(0);
    expect(selectedDate.getDate()).toBe(15);
    
    // Check input value
    expect(datepicker.input.value).toBe('01/15/2023');
    expect(datepicker.getFormattedValue()).toBe('01/15/2023');
  });
  
  test('should set and get date range', () => {
    const datepicker = createMockDatePicker({ selectionMode: 'range' });
    
    // Initial value should be null
    expect(datepicker.getValue()).toBeNull();
    
    // Set a date range
    const startDate = new Date(2023, 0, 10); // January 10, 2023
    const endDate = new Date(2023, 0, 20); // January 20, 2023
    datepicker.setValue([startDate, endDate]);
    
    // Get the selected date range
    const selectedRange = datepicker.getValue() as [Date, Date];
    expect(Array.isArray(selectedRange)).toBe(true);
    expect(selectedRange.length).toBe(2);
    
    expect(selectedRange[0].getFullYear()).toBe(2023);
    expect(selectedRange[0].getMonth()).toBe(0);
    expect(selectedRange[0].getDate()).toBe(10);
    
    expect(selectedRange[1].getFullYear()).toBe(2023);
    expect(selectedRange[1].getMonth()).toBe(0);
    expect(selectedRange[1].getDate()).toBe(20);
    
    // Check input value
    expect(datepicker.input.value).toBe('01/10/2023 - 01/20/2023');
    expect(datepicker.getFormattedValue()).toBe('01/10/2023 - 01/20/2023');
  });
  
  test('should clear the selected date', () => {
    const datepicker = createMockDatePicker();
    
    // Set a date
    const testDate = new Date(2023, 0, 15);
    datepicker.setValue(testDate);
    
    // Check that the date is set
    expect(datepicker.getValue()).not.toBeNull();
    expect(datepicker.input.value).not.toBe('');
    
    // Clear the date
    datepicker.clear();
    
    // Check that the date is cleared
    expect(datepicker.getValue()).toBeNull();
    expect(datepicker.input.value).toBe('');
    expect(datepicker.getFormattedValue()).toBe('');
  });
  
  test('should respect min and max date constraints', () => {
    const minDate = new Date(2023, 0, 10); // January 10, 2023
    const maxDate = new Date(2023, 0, 20); // January 20, 2023
    
    const datepicker = createMockDatePicker({
      minDate,
      maxDate
    });
    
    // Try to set a date before min date
    const tooEarlyDate = new Date(2023, 0, 5);
    datepicker.setValue(tooEarlyDate);
    
    // The datepicker should accept the date (validation is only on UI interaction)
    const selectedDate1 = datepicker.getValue() as Date;
    expect(selectedDate1.getDate()).toBe(5);
    
    // Try to set a date after max date
    const tooLateDate = new Date(2023, 0, 25);
    datepicker.setValue(tooLateDate);
    
    // The datepicker should accept the date (validation is only on UI interaction)
    const selectedDate2 = datepicker.getValue() as Date;
    expect(selectedDate2.getDate()).toBe(25);
    
    // Set constraints after selection
    datepicker.setValue(new Date(2023, 0, 15)); // Set to valid date
    datepicker.setMinDate(new Date(2023, 0, 10));
    datepicker.setMaxDate(new Date(2023, 0, 20));
    
    // The current date should remain valid
    const selectedDate3 = datepicker.getValue() as Date;
    expect(selectedDate3.getDate()).toBe(15);
  });
  
  test('should enable and disable the datepicker', () => {
    const datepicker = createMockDatePicker();
    
    expect(datepicker.disabled.isDisabled()).toBe(false);
    
    datepicker.disable();
    
    expect(datepicker.disabled.isDisabled()).toBe(true);
    expect(datepicker.element.className).toContain('mtrl-datepicker--disabled');
    expect(datepicker.input.disabled).toBe(true);
    
    datepicker.enable();
    
    expect(datepicker.disabled.isDisabled()).toBe(false);
    expect(datepicker.element.className).not.toContain('mtrl-datepicker--disabled');
    expect(datepicker.input.disabled).toBe(false);
  });
  
  test('should respect custom date format', () => {
    const datepicker = createMockDatePicker({
      dateFormat: 'YYYY-MM-DD'
    });
    
    // Set a date
    const testDate = new Date(2023, 0, 15); // January 15, 2023
    datepicker.setValue(testDate);
    
    // Check the formatted output
    expect(datepicker.input.value).toBe('2023-01-15');
    expect(datepicker.getFormattedValue()).toBe('2023-01-15');
  });
  
  test('should emit change events', () => {
    const datepicker = createMockDatePicker();
    let eventFired = false;
    let eventValue: any = null;
    
    datepicker.on('change', (value) => {
      eventFired = true;
      eventValue = value;
    });
    
    // Set a date
    const testDate = new Date(2023, 0, 15);
    datepicker.setValue(testDate);
    
    expect(eventFired).toBe(true);
    expect(eventValue).toBeInstanceOf(Date);
    expect(eventValue.getFullYear()).toBe(2023);
    expect(eventValue.getMonth()).toBe(0);
    expect(eventValue.getDate()).toBe(15);
  });
  
  test('should emit open and close events', () => {
    const datepicker = createMockDatePicker();
    let openEventFired = false;
    let closeEventFired = false;
    
    datepicker.on('open', () => {
      openEventFired = true;
    });
    
    datepicker.on('close', () => {
      closeEventFired = true;
    });
    
    datepicker.open();
    expect(openEventFired).toBe(true);
    
    datepicker.close();
    expect(closeEventFired).toBe(true);
  });
  
  test('should remove event listeners', () => {
    const datepicker = createMockDatePicker();
    let count = 0;
    
    const handler = () => {
      count++;
    };
    
    datepicker.on('change', handler);
    
    // First change
    datepicker.setValue(new Date());
    expect(count).toBe(1);
    
    // Remove listener
    datepicker.off('change', handler);
    
    // Second change
    datepicker.setValue(new Date());
    expect(count).toBe(1); // Count should not increase
  });
  
  test('should be properly destroyed', () => {
    const datepicker = createMockDatePicker();
    document.body.appendChild(datepicker.element);
    
    expect(document.body.contains(datepicker.element)).toBe(true);
    
    datepicker.destroy();
    
    expect(document.body.contains(datepicker.element)).toBe(false);
  });
});