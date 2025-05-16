// src/components/datepicker/datepicker.ts
import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withDisabled,
  withLifecycle
} from '../../core/compose/features';

import { withAPI } from './api';
import { DatePickerConfig, DatePickerComponent } from './types';
import { 
  createBaseConfig, 
  getContainerConfig, 
  getInputConfig, 
  getCalendarConfig, 
  getApiConfig 
} from './config';
import { 
  formatDate, 
  parseDate, 
  isSameDay 
} from './utils';
import { 
  renderCalendar 
} from './render';
import { createElement } from '../../core/dom/create';

/**
 * Creates a new DatePicker component
 * @param {DatePickerConfig} config - DatePicker configuration object
 * @returns {DatePickerComponent} DatePicker component instance
 */
const createDatePicker = (config: DatePickerConfig = {}): DatePickerComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    // Initialize state
    const state: any = {
      isOpen: false,
      selectedDate: null,
      rangeEndDate: null,
      currentView: baseConfig.initialView,
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      minDate: baseConfig.minDate ? parseDate(baseConfig.minDate) : null,
      maxDate: baseConfig.maxDate ? parseDate(baseConfig.maxDate) : null,
      dateFormat: baseConfig.dateFormat,
      variant: baseConfig.variant,
      selectionMode: baseConfig.selectionMode,
      closeOnSelect: baseConfig.closeOnSelect,
      prefix: baseConfig.prefix || PREFIX,
      calendarElement: null,
      input: null,
      
      updateInputValue(): void {
        if (!this.input) return;
        
        if (!this.selectedDate) {
          this.input.value = '';
          return;
        }
        
        // Format for range selection
        if (this.selectionMode === 'range' && this.rangeEndDate) {
          const startStr = formatDate(this.selectedDate, this.dateFormat);
          const endStr = formatDate(this.rangeEndDate, this.dateFormat);
          this.input.value = `${startStr} - ${endStr}`;
          return;
        }
        
        // Format for single selection
        this.input.value = formatDate(this.selectedDate, this.dateFormat);
      },
      
      updateCalendar(): void {
        if (!this.isOpen || !this.calendarElement) return;
        
        // Clear existing content
        this.calendarElement.innerHTML = '';
        
        // Render calendar content
        const calendar = renderCalendar(this, (event, data) => {
          switch (event) {
            case 'dateSelected':
              this.handleDateSelection(data.date);
              break;
              
            case 'monthSelected':
              this.currentMonth = data.month;
              this.currentView = 'day';
              this.updateCalendar();
              break;
              
            case 'yearSelected':
              this.currentYear = data.year;
              this.currentView = 'month';
              this.updateCalendar();
              break;
              
            case 'viewChange':
              this.currentView = data.view;
              this.updateCalendar();
              break;
              
            case 'prevMonth':
              this.prevMonth();
              break;
              
            case 'nextMonth':
              this.nextMonth();
              break;
              
            case 'prevYear':
              this.prevYear();
              break;
              
            case 'nextYear':
              this.nextYear();
              break;
              
            case 'prevYearRange':
              this.currentYear -= 20;
              this.updateCalendar();
              break;
              
            case 'nextYearRange':
              this.currentYear += 20;
              this.updateCalendar();
              break;
              
            case 'cancel':
              this.isOpen = false;
              this.render();
              break;
              
            case 'confirm':
              this.isOpen = false;
              this.render();
              break;
          }
        });
        
        this.calendarElement.appendChild(calendar);
      },
      
      handleDateSelection(date: Date): void {
        // Range selection
        if (this.selectionMode === 'range') {
          // If no date is selected yet or both dates are already selected, start a new range
          if (!this.selectedDate || (this.selectedDate && this.rangeEndDate)) {
            this.selectedDate = date;
            this.rangeEndDate = null;
          } 
          // If start date is selected but not end date
          else {
            // If selected date is before the start date, swap them
            if (date < this.selectedDate) {
              this.rangeEndDate = this.selectedDate;
              this.selectedDate = date;
            } else {
              this.rangeEndDate = date;
            }
            
            // Close if needed
            if (this.closeOnSelect) {
              this.isOpen = false;
            }
          }
        } 
        // Single date selection
        else {
          this.selectedDate = date;
          
          // Close if needed
          if (this.closeOnSelect) {
            this.isOpen = false;
          }
        }
        
        // Update the input value
        this.updateInputValue();
        
        // Update the calendar view
        this.updateCalendar();
        
        // Emit change event
        component.emit('change', { 
          value: this.selectedDate, 
          rangeEndDate: this.rangeEndDate,
          formattedValue: this.input.value
        });
      },
      
      prevMonth(): void {
        if (this.currentMonth === 0) {
          this.currentMonth = 11;
          this.currentYear--;
        } else {
          this.currentMonth--;
        }
        this.updateCalendar();
      },
      
      nextMonth(): void {
        if (this.currentMonth === 11) {
          this.currentMonth = 0;
          this.currentYear++;
        } else {
          this.currentMonth++;
        }
        this.updateCalendar();
      },
      
      prevYear(): void {
        this.currentYear--;
        this.updateCalendar();
      },
      
      nextYear(): void {
        this.currentYear++;
        this.updateCalendar();
      },
      
      render(): void {
        // Show/hide calendar
        if (this.calendarElement) {
          if (this.isOpen) {
            this.calendarElement.style.display = 'block';
            this.updateCalendar();
            
            // Focus on the calendar
            setTimeout(() => {
              this.calendarElement.focus();
            }, 10);
          } else {
            this.calendarElement.style.display = 'none';
          }
        }
      }
    };
    
    // Initialize with provided value if any
    if (baseConfig.value) {
      if (Array.isArray(baseConfig.value) && baseConfig.selectionMode === 'range') {
        const start = parseDate(baseConfig.value[0]);
        const end = parseDate(baseConfig.value[1]);
        
        if (start && end) {
          state.selectedDate = start;
          state.rangeEndDate = end;
          
          // Set current month/year to selected date
          state.currentMonth = start.getMonth();
          state.currentYear = start.getFullYear();
        }
      } else {
        const date = parseDate(baseConfig.value as Date | string);
        if (date) {
          state.selectedDate = date;
          state.currentMonth = date.getMonth();
          state.currentYear = date.getFullYear();
        }
      }
    }
    
    // Create the component
    const component = pipe(
      createBase,
      withEvents(),
      withElement(getContainerConfig(baseConfig)),
      withDisabled(baseConfig),
      withLifecycle()
    )(baseConfig);
    
    // Create input element
    const inputComponent = pipe(
      createBase,
      withElement(getInputConfig(baseConfig))
    )(baseConfig);
    
    state.input = inputComponent.element;
    component.element.appendChild(state.input);
    
    // Update input value
    state.updateInputValue();
    
    // Create calendar element
    const calendarConfig = getCalendarConfig(baseConfig);
    state.calendarElement = createElement({
      tag: 'div',
      className: calendarConfig.className,
      attributes: calendarConfig.attributes
    });
    
    // Initially hide calendar
    state.calendarElement.style.display = 'none';
    
    // Add calendar to container
    component.element.appendChild(state.calendarElement);
    
    // Add event listeners
    state.input.addEventListener('click', () => {
      if (!component.element.classList.contains('disabled')) {
        state.isOpen = !state.isOpen;
        state.render();
        
        if (state.isOpen) {
          component.emit('open', { value: state.selectedDate });
        } else {
          component.emit('close', { value: state.selectedDate });
        }
      }
    });
    
    // BUGFIX: Prevent calendar close when clicking inside the calendar
    state.calendarElement.addEventListener('click', (event) => {
      // Stop propagation to prevent the document click handler from closing the calendar
      event.stopPropagation();
    });
    
    // Handle outside clicks
    document.addEventListener('click', (event) => {
      if (state.isOpen && 
          !component.element.contains(event.target as Node)) {
        state.isOpen = false;
        state.render();
        component.emit('close', { value: state.selectedDate });
      }
    });
    
    // Enhance with API
    return withAPI(state, getApiConfig(component))(component);
  } catch (error) {
    console.error('DatePicker creation error:', error);
    throw new Error(`Failed to create DatePicker: ${(error as Error).message}`);
  }
};

export default createDatePicker;