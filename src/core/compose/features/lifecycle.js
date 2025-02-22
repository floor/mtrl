// src/core/compose/features/withLifecycle.js
import { createEmitter } from '../../state/emitter'

export const withLifecycle = () => (component) => {
  if (!component.element) return component

  let mounted = false
  const emitter = createEmitter()

  return {
    ...component,
    lifecycle: {
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
      destroy () {
        // First trigger unmount
        if (mounted) {
          this.unmount()
        }

        // Clean up all event listeners
        if (component.events) {
          component.events.destroy()
        }

        // Clean up text element
        if (component.text) {
          const textElement = component.text.getElement()
          if (textElement) {
            textElement.remove()
          }
        }

        // Clean up icon element
        if (component.icon) {
          const iconElement = component.icon.getElement()
          if (iconElement) {
            iconElement.remove()
          }
        }

        // Remove the main element
        if (component.element) {
          component.element.remove()
        }
      }
    }
  }
}
