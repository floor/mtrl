// src/components/switch/switch.js
import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'
import {
  withEvents,
  withTextLabel,
  withDisabled,
  withLifecycle,
  withInput,
  withTrack,
  withCheckable
} from '../../core/compose/features'
import { withAPI } from './api'

/**
 * Adds label position handling to switch
 */
const withLabelPosition = (config) => (component) => {
  if (!config.label) return component

  const position = config.labelPosition || 'end'
  component.element.classList.add(`${PREFIX}-switch--label-${position}`)

  return component
}

/**
 * Creates a new Switch component
 * @param {Object} config - Switch configuration
 * @param {string} [config.name] - Input name
 * @param {boolean} [config.checked] - Initial checked state
 * @param {boolean} [config.required] - Is input required
 * @param {boolean} [config.disabled] - Is switch disabled
 * @param {string} [config.value] - Input value
 * @param {string} [config.label] - Label text
 * @param {string} [config.labelPosition='end'] - Label position (start/end)
 * @param {string} [config.class] - Additional CSS classes
 */
const createSwitch = (config = {}) => {
  const baseConfig = {
    ...config,
    componentName: 'switch',
    prefix: PREFIX
  }

  return pipe(
    createBase,
    withEvents(), // Move events first to ensure system is available
    withElement({
      tag: 'div',
      componentName: 'switch',
      className: config.class,
      interactive: true
    }),
    withInput(baseConfig),
    withTrack(baseConfig),
    withTextLabel(baseConfig),
    withLabelPosition(baseConfig),
    withCheckable(baseConfig),
    withDisabled(),
    withLifecycle(),
    comp => withAPI({
      disabled: comp.disabled,
      lifecycle: comp.lifecycle,
      checkable: comp.checkable
    })(comp)
  )(baseConfig)
}

export default createSwitch
