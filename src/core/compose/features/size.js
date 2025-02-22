// src/core/compose/features/variant.js
export const withSize = config => component => {
  if (config.size && component.element) {
    // Use config.componentName since we know it's there
    const className = `${config.prefix}-${config.componentName}--${config.size}`
    component.element.classList.add(className)
  }
  return component
}
