// src/components/checkbox/checkbox.js

import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'
import {
  withEvents,
  withTextLabel,
  withDisabled,
  withLifecycle,
  withInput,
  withCheckable
} from '../../core/compose/features'
import { withAPI } from './api'
import { CHECKBOX_VARIANTS } from './constants'

/**
 * Adds check icon to checkbox
 * @param {Object} config - Component configuration
 */
const withCheckIcon = (config) => (component) => {
  const icon = document.createElement('span')
  icon.className = `${config.prefix}-checkbox-icon`
  icon.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path>
    </svg>
  `
  component.element.appendChild(icon)
  return component
}

/**
 * Creates a new Checkbox component
 * @param {Object} config - Checkbox configuration
 * @param {string} [config.name] - Input name attribute
 * @param {boolean} [config.checked] - Initial checked state
 * @param {boolean} [config.indeterminate] - Initial indeterminate state
 * @param {boolean} [config.required] - Whether input is required
 * @param {boolean} [config.disabled] - Whether checkbox is disabled
 * @param {string} [config.value] - Input value attribute
 * @param {string} [config.label] - Label text
 * @param {string} [config.labelPosition='end'] - Label position (start/end)
 * @param {string} [config.variant='filled'] - Visual variant
 * @param {string} [config.class] - Additional CSS classes
 */
const createCheckbox = (config = {}) => {
  const baseConfig = {
    ...config,
    componentName: 'checkbox',
    prefix: PREFIX,
    variant: config.variant || CHECKBOX_VARIANTS.FILLED
  }

  const enhancedWithCheckable = (component) => {
    const enhanced = withCheckable(baseConfig)(component)

    // Add indeterminate state handling
    if (config.indeterminate) {
      enhanced.input.indeterminate = true
    }

    enhanced.setIndeterminate = (state) => {
      enhanced.input.indeterminate = state
      enhanced.element.classList.toggle(`${PREFIX}-checkbox--indeterminate`, state)
      return enhanced
    }

    return enhanced
  }

  return pipe(
    createBase,
    withEvents(),
    withElement({
      tag: 'div',
      componentName: 'checkbox',
      className: config.class,
      interactive: true
    }),
    withInput(baseConfig),
    withCheckIcon(baseConfig),
    withTextLabel(baseConfig),
    enhancedWithCheckable,
    withDisabled(),
    withLifecycle(),
    comp => withAPI({
      disabled: comp.disabled,
      lifecycle: comp.lifecycle,
      checkable: comp.checkable
    })(comp)
  )(baseConfig)
}

export default createCheckbox
