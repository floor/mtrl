// src/core/state/lifecycle.js
import { createEmitter } from './emitter'

export const createLifecycle = (element, managers = {}) => {
  let mounted = false
  const emitter = createEmitter()

  return {
    // Mount/Unmount state management
    onMount: (handler) => emitter.on('mount', handler),
    onUnmount: (handler) => emitter.on('unmount', handler),
    
    mount: () => {
      if (!mounted) {
        mounted = true
        emitter.emit('mount')
      }
    },

    unmount: () => {
      if (mounted) {
        mounted = false
        emitter.emit('unmount')
        emitter.clear()
      }
    },

    isMounted: () => mounted,

    // Cleanup and destruction
    destroy() {
      // First trigger unmount
      if (mounted) {
        this.unmount()
      }

      // Clean up all event listeners
      if (managers.events) {
        managers.events.destroy()
      }
      
      // Clean up text element
      if (managers.text) {
        const textElement = managers.text.getElement()
        if (textElement) {
          textElement.remove()
        }
      }
      
      // Clean up icon element
      if (managers.icon) {
        const iconElement = managers.icon.getElement()
        if (iconElement) {
          iconElement.remove()
        }
      }
      
      // Remove the main element
      if (element) {
        element.remove()
      }
    }
  }
}