// src/components/switch/switch.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withTextLabel,
  withDisabled,
  withLifecycle,
  withInput,
  withTrack,
  withCheckable
} from '../../core/compose/features';
import { withAPI } from './api';
import { withSupportingText } from './features';
import { SwitchConfig, SwitchComponent, BaseComponent } from './types';
import { 
  createBaseConfig, 
  getElementConfig, 
  getApiConfig
} from './config';

/**
 * Creates a new Switch component
 * 
 * A Switch component is a toggle control that follows Material Design 3 guidelines.
 * It provides a visual toggle between two states, typically on/off or enabled/disabled.
 * 
 * @param {SwitchConfig} config - Switch configuration options
 * @returns {SwitchComponent} Switch component instance with methods for state management
 * 
 * @example
 * ```typescript
 * // Create a basic switch
 * const basicSwitch = fSwitch({
 *   label: 'Dark Mode',
 *   checked: false
 * });
 * 
 * // Create a disabled switch with supporting text
 * const disabledSwitch = fSwitch({
 *   label: 'Offline Mode',
 *   supportingText: 'Enable when no internet connection is available',
 *   disabled: true
 * });
 * 
 * // Add an event listener
 * basicSwitch.on('change', (event) => {
 *   console.log('Switch toggled:', event.target.checked);
 *   document.body.classList.toggle('dark-mode', event.target.checked);
 * });
 * 
 * // Get/set state programmatically
 * console.log('Is checked:', basicSwitch.isChecked());
 * basicSwitch.check(); // Turn on
 * basicSwitch.uncheck(); // Turn off
 * basicSwitch.toggle(); // Toggle between states
 * ```
 * 
 * @category Components
 */
const fSwitch = (config: SwitchConfig = {}): SwitchComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    const switchComponent = pipe(
      createBase,
      withEvents(), // Move events first to ensure system is available
      withElement(getElementConfig(baseConfig)),
      withTextLabel(baseConfig),
      withInput(baseConfig),
      withTrack(baseConfig),
      withSupportingText(baseConfig),
      withCheckable(baseConfig),
      withDisabled(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    return switchComponent as SwitchComponent;
  } catch (error) {
    console.error('Switch creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create switch: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default fSwitch;