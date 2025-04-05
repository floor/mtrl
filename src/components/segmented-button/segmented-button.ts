// src/components/segmented-button/segmented-button.ts
import { pipe } from '../../core/compose/pipe';
import { createBase, withElement } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { createEmitter } from '../../core/state/emitter';
import { SegmentedButtonConfig, SegmentedButtonComponent, SelectionMode, Segment } from './types';
import { createBaseConfig, getContainerConfig } from './config';
import { fSegment } from './segment';

/**
 * Creates a new Segmented Button component
 * 
 * A Segmented Button component presents a set of related buttons in a horizontal layout,
 * allowing users to select one or multiple options. It supports single and multiple selection modes,
 * can display icons and text, and provides events for selection changes.
 * 
 * @param {SegmentedButtonConfig} config - Segmented Button configuration
 * @returns {SegmentedButtonComponent} Segmented Button component instance
 * 
 * @example
 * ```typescript
 * // Create a single-select segmented button
 * const viewMode = fSegmentedButton({
 *   mode: 'single',
 *   segments: [
 *     { value: 'list', text: 'List View', icon: '<i class="material-icons">view_list</i>' },
 *     { value: 'grid', text: 'Grid View', icon: '<i class="material-icons">grid_view</i>' },
 *     { value: 'map', text: 'Map View', icon: '<i class="material-icons">map</i>' }
 *   ]
 * });
 * 
 * // Create a multi-select filter button
 * const filters = fSegmentedButton({
 *   mode: 'multiple',
 *   segments: [
 *     { value: 'available', text: 'In Stock' },
 *     { value: 'sale', text: 'On Sale' },
 *     { value: 'new', text: 'New Arrivals' }
 *   ]
 * });
 * 
 * // Listen for selection changes
 * viewMode.on('change', (event) => {
 *   console.log('Selected view:', event.value[0]);
 * });
 * ```
 */
const fSegmentedButton = (config: SegmentedButtonConfig = {}): SegmentedButtonComponent => {
  // Process configuration
  const baseConfig = createBaseConfig(config);
  const mode = baseConfig.mode || SelectionMode.SINGLE;
  const emitter = createEmitter();
  
  try {
    // Create the base component
    const component = pipe(
      createBase,
      withEvents(),
      withElement(getContainerConfig(baseConfig)),
      withLifecycle()
    )(baseConfig);
    
    // Create segments
    const segments: Segment[] = [];
    if (baseConfig.segments && baseConfig.segments.length) {
      baseConfig.segments.forEach(segmentConfig => {
        const segment = fSegment(
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
        return this;
      },
      
      disable() {
        // Disable the entire component
        component.element.classList.add(`${baseConfig.prefix}-segmented-button--disabled`);
        return this;
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

export default fSegmentedButton;