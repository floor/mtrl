// src/components/card/header.js
import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'
import { withText } from '../../core/compose/features'
import { createElement } from '../../core/dom/create'

/**
 * Creates a card header component
 * @param {Object} config - Header configuration
 * @param {string} [config.title] - Title text
 * @param {string} [config.subtitle] - Subtitle text
 * @param {HTMLElement|string} [config.avatar] - Avatar element or HTML string
 * @param {HTMLElement|string} [config.action] - Action element or HTML string
 * @returns {HTMLElement} Card header element
 */
export const createCardHeader = (config = {}) => {
  const baseConfig = {
    ...config,
    componentName: 'card-header',
    prefix: PREFIX
  }

  try {
    const header = pipe(
      createBase,
      withElement({
        tag: 'div',
        componentName: 'card-header',
        className: config.class
      })
    )(baseConfig)

    // Create text container
    const textContainer = createElement({
      tag: 'div',
      className: `${PREFIX}-card-header-text`,
      container: header.element
    })

    // Add title if provided
    if (config.title) {
      createElement({
        tag: 'h3',
        className: `${PREFIX}-card-header-title`,
        text: config.title,
        container: textContainer
      })
    }

    // Add subtitle if provided
    if (config.subtitle) {
      createElement({
        tag: 'h4',
        className: `${PREFIX}-card-header-subtitle`,
        text: config.subtitle,
        container: textContainer
      })
    }

    // Add avatar if provided
    if (config.avatar) {
      const avatarElement = typeof config.avatar === 'string'
        ? createElement({
          tag: 'div',
          className: `${PREFIX}-card-header-avatar`,
          html: config.avatar
        })
        : config.avatar

      header.element.insertBefore(avatarElement, header.element.firstChild)
    }

    // Add action if provided
    if (config.action) {
      const actionElement = typeof config.action === 'string'
        ? createElement({
          tag: 'div',
          className: `${PREFIX}-card-header-action`,
          html: config.action
        })
        : config.action

      header.element.appendChild(actionElement)
    }

    return header.element
  } catch (error) {
    console.error('Card header creation error:', error)
    throw new Error(`Failed to create card header: ${error.message}`)
  }
}
