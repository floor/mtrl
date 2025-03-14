// src/components/datepicker/api.ts
import { DatePickerComponent } from './types';
import { 
  formatDate, 
  parseDate,
  isSameDay,
  generateCalendarDates,
  addMonths,
  addYears 
} from './utils';
import { DATEPICKER_VIEWS, DATEPICKER_SELECTION_MODES } from './constants';

interface ApiOptions {
  disabled: {
    enable: () => void;
    disable: () => void;
  };
  lifecycle: {
    destroy: () => void;
  };
  events: {
    on: (event: string, handler: Function) => any;
    off: (event: string, handler: Function) => any;
    emit: (event: string, data: any) => any;
  };
}

/**
 * Enhances a datepicker component with API methods
 * @param {object} state - Current state of the datepicker
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the DatePicker component
 */
export const withAPI = (state: any, { disabled, lifecycle, events }: ApiOptions) => 
  (component: any): DatePickerComponent => {
    // Calendar navigation API
    const calendar = {
      goToDate(date: Date): void {
        const validDate = parseDate(date);
        if (!validDate) return;
        
        state.currentMonth = validDate.getMonth();
        state.currentYear = validDate.getFullYear();
        
        // Update calendar view
        state.updateCalendar();
      },
      
      nextMonth(): void {
        const newDate = addMonths(new Date(state.currentYear, state.currentMonth, 1), 1);
        state.currentMonth = newDate.getMonth();
        state.currentYear = newDate.getFullYear();
        
        // Update calendar view
        state.updateCalendar();
      },
      
      prevMonth(): void {
        const newDate = addMonths(new Date(state.currentYear, state.currentMonth, 1), -1);
        state.currentMonth = newDate.getMonth();
        state.currentYear = newDate.getFullYear();
        
        // Update calendar view
        state.updateCalendar();
      },
      
      nextYear(): void {
        state.currentYear += 1;
        
        // Update calendar view
        state.updateCalendar();
      },
      
      prevYear(): void {
        state.currentYear -= 1;
        
        // Update calendar view
        state.updateCalendar();
      },
      
      showDayView(): void {
        state.currentView = DATEPICKER_VIEWS.DAY;
        state.updateCalendar();
      },
      
      showMonthView(): void {
        state.currentView = DATEPICKER_VIEWS.MONTH;
        state.updateCalendar();
      },
      
      showYearView(): void {
        state.currentView = DATEPICKER_VIEWS.YEAR;
        state.updateCalendar();
      },
      
      getCurrentView(): string {
        return state.currentView;
      }
    };
    
    return {
      ...component as any,
      element: component.element,
      input: state.input,
      calendar,
      
      open(): DatePickerComponent {
        state.isOpen = true;
        state.render();
        events.emit('open', { value: this.getValue() });
        return this;
      },
      
      close(): DatePickerComponent {
        state.isOpen = false;
        state.render();
        events.emit('close', { value: this.getValue() });
        return this;
      },
      
      getValue(): Date | [Date, Date] | null {
        if (!state.selectedDate) return null;
        
        // Range selection
        if (state.selectionMode === DATEPICKER_SELECTION_MODES.RANGE && state.rangeEndDate) {
          return [new Date(state.selectedDate), new Date(state.rangeEndDate)];
        }
        
        // Single selection
        return new Date(state.selectedDate);
      },
      
      setValue(value: Date | string | [Date | string, Date | string]): DatePickerComponent {
        // Handle range selection
        if (Array.isArray(value) && state.selectionMode === DATEPICKER_SELECTION_MODES.RANGE) {
          const start = parseDate(value[0]);
          const end = parseDate(value[1]);
          
          if (start && end) {
            state.selectedDate = start;
            state.rangeEndDate = end;
            
            // Ensure start date is before end date
            if (start > end) {
              state.selectedDate = end;
              state.rangeEndDate = start;
            }
            
            // Update input value
            state.updateInputValue();
            
            // Update calendar if it's open
            if (state.isOpen) {
              // Set current month/year to the start date's month/year
              state.currentMonth = state.selectedDate.getMonth();
              state.currentYear = state.selectedDate.getFullYear();
              state.updateCalendar();
            }
            
            events.emit('change', { 
              value: this.getValue(), 
              formattedValue: this.getFormattedValue() 
            });
          }
          
          return this;
        }
        
        // Handle single date selection
        const parsedDate = parseDate(value as Date | string);
        if (parsedDate) {
          state.selectedDate = parsedDate;
          state.rangeEndDate = null;
          
          // Update input value
          state.updateInputValue();
          
          // Update calendar if it's open
          if (state.isOpen) {
            state.currentMonth = parsedDate.getMonth();
            state.currentYear = parsedDate.getFullYear();
            state.updateCalendar();
          }
          
          events.emit('change', { 
            value: this.getValue(), 
            formattedValue: this.getFormattedValue() 
          });
        }
        
        return this;
      },
      
      getFormattedValue(): string {
        if (!state.selectedDate) return '';
        
        // Range selection
        if (state.selectionMode === DATEPICKER_SELECTION_MODES.RANGE && state.rangeEndDate) {
          const startStr = formatDate(state.selectedDate, state.dateFormat);
          const endStr = formatDate(state.rangeEndDate, state.dateFormat);
          return `${startStr} - ${endStr}`;
        }
        
        // Single selection
        return formatDate(state.selectedDate, state.dateFormat);
      },
      
      clear(): DatePickerComponent {
        state.selectedDate = null;
        state.rangeEndDate = null;
        state.updateInputValue();
        
        if (state.isOpen) {
          state.updateCalendar();
        }
        
        events.emit('change', { value: null, formattedValue: '' });
        return this;
      },
      
      enable(): DatePickerComponent {
        disabled.enable();
        return this;
      },
      
      disable(): DatePickerComponent {
        disabled.disable();
        return this;
      },
      
      setMinDate(date: Date | string): DatePickerComponent {
        const parsedDate = parseDate(date);
        if (parsedDate) {
          state.minDate = parsedDate;
          
          // Update calendar if it's open
          if (state.isOpen) {
            state.updateCalendar();
          }
        }
        return this;
      },
      
      setMaxDate(date: Date | string): DatePickerComponent {
        const parsedDate = parseDate(date);
        if (parsedDate) {
          state.maxDate = parsedDate;
          
          // Update calendar if it's open
          if (state.isOpen) {
            state.updateCalendar();
          }
        }
        return this;
      },
      
      destroy(): void {
        lifecycle.destroy();
      },
      
      on(event: string, handler: Function): DatePickerComponent {
        events.on(event, handler);
        return this;
      },
      
      off(event: string, handler: Function): DatePickerComponent {
        events.off(event, handler);
        return this;
      }
    };
  };