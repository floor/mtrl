// src/components/snackbar/api.ts
import { BaseComponent, SnackbarComponent, ApiOptions, QueuedSnackbar } from './types';

/**
 * Enhances snackbar component with API methods
 * @param {ApiOptions} options - API configuration
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI = ({ lifecycle, queue }: ApiOptions) => 
  (component: BaseComponent): SnackbarComponent => {
    if (!queue) {
      throw new Error('Snackbar queue is required');
    }

    let isVisible = false;

    const enhancedComponent: SnackbarComponent = {
      element: component.element,
      actionButton: component.actionButton,
      timer: component.timer,
      position: component.position,

      /**
       * Shows the snackbar with animation
       * @returns {SnackbarComponent} Component instance for chaining
       */
      show(): SnackbarComponent {
        if (isVisible) return this;
        isVisible = true;

        queue.add({
          ...this,
          _show: (): SnackbarComponent => {
            document.body.appendChild(component.element);

            // Force reflow for animation
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _ = component.element.offsetHeight;

            component.element.classList.add(`${component.getClass?.('snackbar')}--visible`);

            if (component.timer) {
              component.timer.start();
            }

            return this;
          }
        } as QueuedSnackbar);

        return this;
      },

      /**
       * Hides the snackbar with animation and cleanup
       * @returns {SnackbarComponent} Component instance for chaining
       */
      hide(): SnackbarComponent {
        if (!isVisible) return this;
        isVisible = false;

        if (component.timer) {
          component.timer.stop();
        }

        const handleTransitionEnd = (event: TransitionEvent): void => {
          if (event.propertyName !== 'opacity') return;

          component.element.removeEventListener('transitionend', handleTransitionEnd);
          if (component.element.parentNode) {
            component.element.remove();
          }
        };

        component.element.addEventListener('transitionend', handleTransitionEnd);
        component.element.classList.remove(`${component.getClass?.('snackbar')}--visible`);

        return this;
      },

      /**
       * Sets the snackbar message
       * @param {string} text - New message text
       * @returns {SnackbarComponent} Component instance for chaining
       */
      setMessage(text: string): SnackbarComponent {
        component.text?.setText(text);
        return this;
      },

      /**
       * Gets the snackbar message
       * @returns {string} Current message text
       */
      getMessage(): string {
        return component.text?.getText() || '';
      },

      /**
       * Adds event listener
       * @param {string} event - Event name
       * @param {Function} handler - Event handler
       * @returns {SnackbarComponent} Component instance for chaining
       */
      on(event: string, handler: Function): SnackbarComponent {
        component.on?.(event, handler);
        return this;
      },

      /**
       * Removes event listener
       * @param {string} event - Event name
       * @param {Function} handler - Event handler
       * @returns {SnackbarComponent} Component instance for chaining
       */
      off(event: string, handler: Function): SnackbarComponent {
        component.off?.(event, handler);
        return this;
      },

      /**
       * Destroys the snackbar component and cleans up resources
       */
      destroy(): void {
        if (isVisible && component.element.parentNode) {
          component.element.remove();
        }
        if (component.timer) {
          component.timer.stop();
        }
        lifecycle.destroy();
      }
    };

    // Set up action button handler
    if (component.actionButton) {
      component.actionButton.addEventListener('click', () => {
        component.emit?.('action');
        component.emit?.('dismiss'); // Emit dismiss to handle queue cleanup
      });
    }

    // Set up dismiss handler
    if (component.on) {
      // Store the handler reference so it can be properly removed
      const dismissHandler = (): void => {
        if (isVisible) {
          enhancedComponent.hide();
        }
      };

      component.on('dismiss', dismissHandler);

      // Add cleanup to lifecycle
      const originalDestroy = lifecycle.destroy;
      lifecycle.destroy = () => {
        component.off?.('dismiss', dismissHandler);
        originalDestroy?.call(lifecycle);
      };
    }

    return enhancedComponent;
  };