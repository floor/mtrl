// src/core/compose/features/disabled.js

export const withDisabled = (config) => (component) => {
  if (!component.element) return component

  return {
    ...component,
    disabled: {
      enable () {
        console.debug('disabled')
        component.element.disabled = false
        const className = `${config.prefix}-${config.componentName}--disable`
        component.element.classList.remove(className)
        return this
      },
      disable () {
        console.debug('disabled')
        component.element.disabled = true
        const className = `${config.prefix}-${config.componentName}--disable`
        component.element.classList.add(className)
        return this
      }
    }
  }
}
