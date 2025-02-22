// src/core/compose/features/style.js
export const withStyle = (config = {}) => (layout) => {
  if (config.variant) {
    layout.element.classList.add(`${layout.getClass('button')}--${config.variant}`)
  }

  if (config.size) {
    layout.element.classList.add(`${layout.getClass('button')}--${config.size}`)
  }

  return layout
}
