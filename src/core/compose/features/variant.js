// src/core/compose/features/variant.js
export const withVariant = config => component => {
  if (config.variant && component.element) {
    // Use config.componentName since we know it's there
    const className = `${config.prefix}-${config.componentName}--${config.variant}`
    component.element.classList.add(className)
  }
  return component
}
