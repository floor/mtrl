import { createText } from '../../../core/build/text'

export const withText = (config = {}) => (component) => {
  const text = createText(component.element, {
    prefix: config.prefix,
    type: 'button'
  })

  if (config.text) {
    text.setText(config.text)
  }

  return {
    ...component,
    text
  }
}
