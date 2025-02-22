// src/components/list/list-item.js

import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'
import { withEvents, withDisabled } from '../../core/compose/features'

/**
 * Supported list item layouts
 */
export const LIST_ITEM_LAYOUTS = {
  HORIZONTAL: 'horizontal', // Default horizontal layout
  VERTICAL: 'vertical' // Stacked layout with vertical alignment
}

/**
 * Creates a DOM element with optional class and content
 * @param {string} tag - HTML tag name
 * @param {string} className - CSS class name
 * @param {string|HTMLElement} [content] - Element content or child element
 * @returns {HTMLElement} Created element
 */
const createElement = (tag, className, content) => {
  const element = document.createElement(tag)
  element.className = className
  if (content) {
    if (typeof content === 'string') {
      element.textContent = content
    } else {
      element.appendChild(content)
    }
  }
  return element
}

/**
 * Creates a list item component
 * @param {Object} config - List item configuration
 * @param {string} [config.layout='horizontal'] - Item layout (horizontal/vertical)
 * @param {string|HTMLElement} [config.leading] - Leading content (icon/avatar)
 * @param {string} [config.headline] - Primary text
 * @param {string} [config.supportingText] - Secondary text
 * @param {string|HTMLElement} [config.trailing] - Trailing content (icon/meta)
 * @param {string} [config.overline] - Text above headline (vertical only)
 * @param {string|HTMLElement} [config.meta] - Meta information (vertical only)
 * @param {boolean} [config.disabled] - Disabled state
 * @param {boolean} [config.selected] - Selected state
 * @param {string} [config.class] - Additional CSS classes
 * @param {string} [config.role='listitem'] - ARIA role
 */
const createListItem = (config = {}) => {
  const baseConfig = {
    ...config,
    componentName: 'list-item',
    prefix: PREFIX
  }

  const createContent = (component) => {
    const { element } = component
    const { prefix } = baseConfig
    const isVertical = config.layout === LIST_ITEM_LAYOUTS.VERTICAL

    // Create content container
    const content = createElement('div', `${prefix}-list-item-content`)

    // Add leading content (icon/avatar)
    if (config.leading) {
      const leading = createElement('div', `${prefix}-list-item-leading`)
      if (typeof config.leading === 'string') {
        leading.innerHTML = config.leading
      } else {
        leading.appendChild(config.leading)
      }
      element.appendChild(leading)
    }

    // Text wrapper for proper alignment
    const textWrapper = createElement('div', `${prefix}-list-item-text`)

    // Add overline text (vertical only)
    if (isVertical && config.overline) {
      const overline = createElement('div', `${prefix}-list-item-overline`, config.overline)
      textWrapper.appendChild(overline)
    }

    // Add headline (primary text)
    if (config.headline) {
      const headline = createElement('div', `${prefix}-list-item-headline`, config.headline)
      textWrapper.appendChild(headline)
    }

    // Add supporting text (secondary text)
    if (config.supportingText) {
      const supporting = createElement('div', `${prefix}-list-item-supporting`, config.supportingText)
      textWrapper.appendChild(supporting)
    }

    content.appendChild(textWrapper)

    // Add meta information (vertical only)
    if (isVertical && config.meta) {
      const meta = createElement('div', `${prefix}-list-item-meta`)
      if (typeof config.meta === 'string') {
        meta.textContent = config.meta
      } else {
        meta.appendChild(config.meta)
      }
      content.appendChild(meta)
    }

    element.appendChild(content)

    // Add trailing content (icon/meta)
    if (config.trailing) {
      const trailing = createElement('div', `${prefix}-list-item-trailing`)
      if (typeof config.trailing === 'string') {
        trailing.innerHTML = config.trailing
      } else {
        trailing.appendChild(config.trailing)
      }
      element.appendChild(trailing)
    }

    // Handle selected state
    if (config.selected) {
      element.setAttribute('aria-selected', 'true')
      element.classList.add(`${prefix}-list-item--selected`)
    }

    return component
  }

  return pipe(
    createBase,
    withEvents(),
    withElement({
      tag: 'div',
      role: config.role || 'listitem',
      componentName: 'list-item',
      className: `${config.layout === LIST_ITEM_LAYOUTS.VERTICAL ? 'vertical' : ''} ${config.class || ''}`
    }),
    withDisabled(),
    createContent
  )(baseConfig)
}

export default createListItem
