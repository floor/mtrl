// src/core/compose/base.js
export const createComponent = (config = {}) => ({
  element: null,
  config,
  setup () {
    return this
  }
})
