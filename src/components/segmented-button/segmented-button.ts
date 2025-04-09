// src/components/segmented-button/segmented-button.ts
import { pipe } from '../../core/compose/pipe';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { createEmitter } from '../../core/state/emitter';
import { SegmentedButtonConfig, SegmentedButtonComponent, SelectionMode, Density, Segment } from './types';
import { createBaseConfig, getContainerConfig, getDensityStyles } from './config';
import { createSegment } from './segment';

/**
 * Creates a new Segmented Button component
 * 
 * The Segmented Button component provides a group of related buttons that can
 * be used for selection and filtering. It supports single or multiple selection modes,
 * configurable density, disabled states, and event handling.
 * 
 * @param {SegmentedButtonConfig} config - Segmented Button configuration
 * @returns {SegmentedButtonComponent} Segmented Button component instance
 * 
 * @example
 * // Create a segmented button with three segments in single selection mode
 * const viewToggle = createSegmentedButton({
 *   segments: [
 *     { text: 'Day', value: 'day', selected: true },
 *     { text: 'Week', value: 'week' },
 *     { text: 'Month', value: 'month' }
 *   ],
 *   mode: SelectionMode.SINGLE
 * });
 * 
 * // Listen for selection changes
 * viewToggle.on('change', (event) => {
 *   console.log('Selected view:', event.value[0]);
 *   updateCalendarView(event.value[0]);
 * });
 * 
 * @example
 * // Create a compact multi-select segmented button with icons
 * const filterOptions = createSegmentedButton({
 *   segments: [
 *     { 
 *       icon: '<svg>...</svg>', 
 *       text: 'Filter 1', 
 *       value: 'filter1' 
 *     },
 *     { 
 *       icon: '<svg>...</svg>', 
 *       text: 'Filter 2', 
 *       value: 'filter2' 
 *     }
 *   ],
 *   mode: SelectionMode.MULTI,
 *   density: Density.COMPACT
 * });
 */
const createSegmentedButton = (config: SegmentedButtonConfig = {}): SegmentedButtonComponent => {
  // Process configuration
  const baseConfig = createBaseConfig(config);
  const mode = baseConfig.mode || SelectionMode.SINGLE;
  const density = baseConfig.density || Density.DEFAULT;
  const emitter = createEmitter();
  
  try {
    // Create the base component
    const component = pipe(
      createBase,
      withEvents(),
      withElement(getContainerConfig(baseConfig)),
      withLifecycle()
    )(baseConfig);
    
    // Apply density styles
    const densityStyles = getDensityStyles(density as string);
    Object.entries(densityStyles).forEach(([prop, value]) => {
      component.element.style.setProperty(prop, value);
    });
    
    // Create segments
    const segments: Segment[] = [];
    if (baseConfig.segments && baseConfig.segments.length) {
      baseConfig.segments.forEach(segmentConfig => {
        const segment = createSegment(
          segmentConfig,
          component.element,
          baseConfig.prefix,
          baseConfig.disabled,
          {
            ripple: baseConfig.ripple,
            rippleConfig: baseConfig.rippleConfig
          }
        );
        
        segments.push(segment);
      });
    }
    
    // Ensure at least one item is selected in single-select mode
    if (mode === SelectionMode.SINGLE && !segments.some(s => s.isSelected())) {
      // Select the first non-disabled segment by default
      const firstSelectable = segments.find(s => !s.isDisabled());
      if (firstSelectable) {
        firstSelectable.setSelected(true);
      }
    }
    
    /**
     * Handles click events on segments
     * @param {Event} event - DOM click event
     * @private
     */
    const handleSegmentClick = (event: Event) => {
      const segmentElement = event.currentTarget as HTMLElement;
      const clickedSegment = segments.find(s => s.element === segmentElement);
      
      if (!clickedSegment || clickedSegment.isDisabled()) {
        return;
      }
      
      const oldValue = getSelectedValues();
      
      // Handle selection based on mode
      if (mode === SelectionMode.SINGLE) {
        // In single-select, deselect all other segments
        segments.forEach(segment => {
          segment.setSelected(segment === clickedSegment);
        });
      } else {
        // In multi-select, toggle the clicked segment
        clickedSegment.setSelected(!clickedSegment.isSelected());
      }
      
      // Emit change event
      const newValue = getSelectedValues();
      
      // Only emit if values actually changed
      if (
        oldValue.length !== newValue.length || 
        oldValue.some(v => !newValue.includes(v)) ||
        newValue.some(v => !oldValue.includes(v))
      ) {
        emitter.emit('change', {
          selected: getSelected(),
          value: newValue,
          oldValue
        });
      }
    };
    
    // Attach click handlers to segments
    segments.forEach(segment => {
      segment.element.addEventListener('click', handleSegmentClick);
    });
    
    /**
     * Gets an array of selected segments
     * @returns {Segment[]} Array of selected segments
     * @private
     */
    const getSelected = () => segments.filter(segment => segment.isSelected());
    
    /**
     * Gets an array of selected segment values
     * @returns {string[]} Array of selected segment values
     * @private
     */
    const getSelectedValues = () => getSelected().map(segment => segment.value);
    
    /**
     * Finds a segment by its value
     * @param {string} value - Segment value to find
     * @returns {Segment|undefined} The found segment or undefined
     * @private
     */
    const findSegmentByValue = (value: string) => segments.find(segment => segment.value === value);
    
    /**
     * Updates the density of the segmented button
     * @param {string} newDensity - New density value
     * @private
     */
    const updateDensity = (newDensity: string) => {
      // Remove existing density classes
      [Density.DEFAULT, Density.COMFORTABLE, Density.COMPACT].forEach(d => {
        if (d !== Density.DEFAULT) {
          component.element.classList.remove(`${baseConfig.prefix}-segmented-button--${d}`);
        }
      });
      
      // Add new density class if not default
      if (newDensity !== Density.DEFAULT) {
        component.element.classList.add(`${baseConfig.prefix}-segmented-button--${newDensity}`);
      }
      
      // Update data attribute
      component.element.setAttribute('data-density', newDensity);
      
      // Apply density styles
      const densityStyles = getDensityStyles(newDensity);
      Object.entries(densityStyles).forEach(([prop, value]) => {
        component.element.style.setProperty(prop, value);
      });
    };
    
    // Create the component API
    const segmentedButton: SegmentedButtonComponent = {
      element: component.element,
      segments,
      
      getSelected,
      
      getValue() {
        return getSelectedValues();
      },
      
      select(value) {
        const segment = findSegmentByValue(value);
        if (segment && !segment.isDisabled()) {
          const oldValue = getSelectedValues();
          
          if (mode === SelectionMode.SINGLE) {
            // Deselect all other segments
            segments.forEach(s => s.setSelected(s === segment));
          } else {
            // Just select this segment
            segment.setSelected(true);
          }
          
          // Emit change event
          const newValue = getSelectedValues();
          if (oldValue.join(',') !== newValue.join(',')) {
            emitter.emit('change', {
              selected: getSelected(),
              value: newValue,
              oldValue
            });
          }
        }
        return this;
      },
      
      deselect(value) {
        const segment = findSegmentByValue(value);
        if (segment && !segment.isDisabled()) {
          // In single select mode, only deselect if there's another selected segment
          if (mode === SelectionMode.SINGLE) {
            const selectedSegments = getSelected();
            // Only allow deselection if there's more than one selected or we're selecting a different segment
            if (selectedSegments.length > 1 || !segment.isSelected()) {
              const oldValue = getSelectedValues();
              segment.setSelected(false);
              
              // Emit change event
              const newValue = getSelectedValues();
              if (oldValue.join(',') !== newValue.join(',')) {
                emitter.emit('change', {
                  selected: getSelected(),
                  value: newValue,
                  oldValue
                });
              }
            }
          } else {
            // In multi-select, always allow deselection
            const oldValue = getSelectedValues();
            segment.setSelected(false);
            
            // Emit change event
            const newValue = getSelectedValues();
            if (oldValue.join(',') !== newValue.join(',')) {
              emitter.emit('change', {
                selected: getSelected(),
                value: newValue,
                oldValue
              });
            }
          }
        }
        return this;
      },
      
      enable() {
        // Enable the entire component
        component.element.classList.remove(`${baseConfig.prefix}-segmented-button--disabled`);
        // Enable all segments (unless individually disabled)
        segments.forEach(segment => {
          // Only enable if it wasn't individually disabled
          if (!baseConfig.segments?.find(s => s.value === segment.value)?.disabled) {
            segment.setDisabled(false);
          }
        });
        return this;
      },
      
      disable() {
        // Disable the entire component
        component.element.classList.add(`${baseConfig.prefix}-segmented-button--disabled`);
        // Disable all segments
        segments.forEach(segment => {
          segment.setDisabled(true);
        });
        return this;
      },
      
      enableSegment(value) {
        const segment = findSegmentByValue(value);
        if (segment) {
          segment.setDisabled(false);
        }
        return this;
      },
      
      disableSegment(value) {
        const segment = findSegmentByValue(value);
        if (segment) {
          segment.setDisabled(true);
        }
        return this;
      },
      
      setDensity(newDensity) {
        updateDensity(newDensity);
        return this;
      },
      
      getDensity() {
        return component.element.getAttribute('data-density') || Density.DEFAULT;
      },
      
      on(event, handler) {
        emitter.on(event, handler);
        return this;
      },
      
      off(event, handler) {
        emitter.off(event, handler);
        return this;
      },
      
      destroy() {
        // Remove event listeners
        segments.forEach(segment => {
          segment.element.removeEventListener('click', handleSegmentClick);
          segment.destroy();
        });
        
        // Clear emitter
        emitter.clear();
        
        // Destroy base component
        component.lifecycle.destroy();
      }
    };
    
    return segmentedButton;
  } catch (error) {
    console.error('Segmented Button creation error:', error);
    throw new Error(`Failed to create segmented button: ${(error as Error).message}`);
  }
};

export default createSegmentedButton;