// src/components/snackbar/features.js

/**
 * Adds action button to snackbar
 */
export const withActionButton = (config) => (component) => {
  if (!config.action) return component

  const button = document.createElement('button')
  button.className = `${config.prefix}-snackbar-action`
  button.textContent = config.action

  component.element.appendChild(button)

  return {
    ...component,
    actionButton: button
  }
}

/**
 * Adds auto-dismiss timer functionality
 */
export const withDismissTimer = (config) => (component) => {
  let timeoutId = null

  const startTimer = () => {
    // Clear any existing timer
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    // Only start timer if duration is positive and numeric
    if (typeof config.duration === 'number' && config.duration > 0) {
      timeoutId = setTimeout(() => {
        if (component.element && component.emit) {
          component.emit('dismiss')
        }
      }, config.duration)
    }
  }

  const stopTimer = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  // Clean up on destroy
  const originalDestroy = component.lifecycle?.destroy
  if (component.lifecycle) {
    component.lifecycle.destroy = () => {
      stopTimer()
      if (originalDestroy) {
        originalDestroy.call(component.lifecycle)
      }
    }
  }

  return {
    ...component,
    timer: {
      start: startTimer,
      stop: stopTimer
    }
  }
}
