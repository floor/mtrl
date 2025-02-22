// src/core/compose/features/textlabel.js

export const withTextLabel = (config = {}) => (component) => {
  if (!config.label) return component

  const labelElement = document.createElement('label')
  labelElement.className = `${config.prefix}-${config.componentName}-label`
  labelElement.textContent = config.label

  // Insert label after input for proper z-index stacking
  component.element.appendChild(labelElement)

  return {
    ...component,
    label: {
      setText (text) {
        labelElement.textContent = text
        return this
      },
      getText () {
        return labelElement.textContent
      },
      getElement () {
        return labelElement
      }
    }
  }
}
