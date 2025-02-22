// src/core/compose/features/icon.js
import { createIcon } from '../../../core/build/icon'

const updateCircularStyle = (component, config) => {
  const hasText = config.text
  const hasIcon = config.icon

  const circularClass = `${component.getClass('button')}--circular`
  if (!hasText && hasIcon) {
    component.element.classList.add(circularClass)
  } else {
    component.element.classList.remove(circularClass)
  }
}

export const withIcon = (config = {}) => (component) => {
  const icon = createIcon(component.element, {
    prefix: config.prefix,
    type: 'button',
    position: config.iconPosition
  })

  if (config.icon) {
    icon.setIcon(config.icon)
  }

  updateCircularStyle(component, config)

  return {
    ...component,
    icon
  }
}
