// src/components/snackbar/features.ts
import { BaseComponent, SnackbarConfig, SnackbarTimer } from './types';

/**
 * Adds action button to snackbar
 * @param {SnackbarConfig} config - Component configuration
 * @returns {Function} Higher-order function that adds action button
 */
export const withActionButton = (config: SnackbarConfig) => 
  (component: BaseComponent): BaseComponent => {
    if (!config.action) return component;

    const button = document.createElement('button');
    button.className = `${config.prefix}-snackbar-action`;
    button.textContent = config.action;

    component.element.appendChild(button);

    return {
      ...component,
      actionButton: button
    };
  };

/**
 * Adds auto-dismiss timer functionality
 * @param {SnackbarConfig} config - Component configuration
 * @returns {Function} Higher-order function that adds timer features
 */
export const withDismissTimer = (config: SnackbarConfig) => 
  (component: BaseComponent): BaseComponent => {
    let timeoutId: number | null = null;

    const startTimer = (): void => {
      // Clear any existing timer
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Only start timer if duration is positive and numeric
      if (typeof config.duration === 'number' && config.duration > 0) {
        timeoutId = window.setTimeout(() => {
          if (component.element && component.emit) {
            component.emit('dismiss');
          }
        }, config.duration);
      }
    };

    const stopTimer = (): void => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    // Clean up on destroy
    const originalDestroy = component.lifecycle?.destroy;
    if (component.lifecycle) {
      component.lifecycle.destroy = () => {
        stopTimer();
        if (originalDestroy) {
          originalDestroy.call(component.lifecycle);
        }
      };
    }

    return {
      ...component,
      timer: {
        start: startTimer,
        stop: stopTimer
      } as SnackbarTimer
    };
  };