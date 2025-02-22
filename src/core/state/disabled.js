// src/core/state/disabled.js
export const createDisabled = (element) => {
  return {
    enable() {
      element.disabled = false
      return this
    },
    
    disable() {
      element.disabled = true
      return this
    }
  }
}