// src/components/snackbar/api.ts
import {
  BaseComponent,
  SnackbarComponent,
  SnackbarEvent,
  SnackbarEventType,
  SnackbarCloseReason,
  SnackbarDuration,
  ApiOptions,
  QueuedSnackbar,
  SnackbarPosition,
} from './types';
import { SNACKBAR_CLASSES, SNACKBAR_DEFAULTS } from './constants';
import { durationToMs } from './config';

/**
 * Enhances snackbar component with API methods
 * @param {ApiOptions} options - API configuration
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withAPI =
  ({ lifecycle, queue, config }: ApiOptions) =>
  (component: BaseComponent): SnackbarComponent => {
    if (!queue) {
      throw new Error('Snackbar queue is required');
    }

    const element = component.element;
    const prefix = config.prefix || 'mtrl';
    const cls = (name: string): string => `${prefix}-${name}`;

    let isVisible = false;
    let previouslyFocused: Element | null = null;
    let removal: ReturnType<typeof setTimeout> | null = null;
    let onTransitionEnd: ((event: TransitionEvent) => void) | null = null;

    const emit = (type: SnackbarEventType, extra: Partial<SnackbarEvent> = {}): void => {
      component.emit?.(type, { snackbar: api, originalEvent: null, ...extra });
    };

    /**
     * An action wider than 128dp goes below the text on its own line, as the
     * Android snackbar does (`maxActionInlineWidth`) and Compose's
     * `actionOnNewLine` lets a caller do.
     */
    const layout = (): void => {
      const action = component.actionButton;
      if (!action) return;
      const below = action.offsetWidth > SNACKBAR_DEFAULTS.ACTION_INLINE_MAX_WIDTH;
      element.classList.toggle(cls(SNACKBAR_CLASSES.ACTION_BELOW), below);
    };

    const cancelRemoval = (): void => {
      if (removal !== null) {
        clearTimeout(removal);
        removal = null;
      }
      if (onTransitionEnd) {
        element.removeEventListener('transitionend', onTransitionEnd);
        onTransitionEnd = null;
      }
    };

    /**
     * Takes the element off the page once it has faded. `transitionend` is
     * the signal, but it does not always come: no transition runs under
     * prefers-reduced-motion for the scale, and a page that is not rendering
     * runs none at all. The exit duration is the fallback.
     */
    const scheduleRemoval = (): void => {
      cancelRemoval();
      const remove = (): void => {
        cancelRemoval();
        element.remove();
      };
      onTransitionEnd = (event: TransitionEvent): void => {
        if (event.target === element && event.propertyName === 'opacity') remove();
      };
      element.addEventListener('transitionend', onTransitionEnd);
      removal = setTimeout(remove, SNACKBAR_DEFAULTS.ANIMATION_DURATION);
    };

    const close = (reason: SnackbarCloseReason, originalEvent: Event | null = null): void => {
      if (!isVisible) return;
      isVisible = false;
      api.state = 'hidden';
      component.timer?.stop();

      // Focus goes back where it came from if it was inside the snackbar;
      // otherwise it is not touched (M3 snackbar accessibility: focus).
      const active = element.ownerDocument.activeElement;
      if (active && element.contains(active) && previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }

      element.classList.remove(cls(SNACKBAR_CLASSES.VISIBLE));
      scheduleRemoval();

      emit('close', { reason, originalEvent });
      emit('dismiss', { reason, originalEvent });
    };

    const open = (): void => {
      cancelRemoval();
      previouslyFocused = element.ownerDocument.activeElement;
      element.ownerDocument.body.appendChild(element);
      layout();
      // Force reflow so the enter transition runs from the hidden state
      void element.offsetHeight;
      element.classList.add(cls(SNACKBAR_CLASSES.VISIBLE));
      component.timer?.start();
      emit('open');
    };

    const api: SnackbarComponent = {
      element,
      actionButton: component.actionButton,
      closeButton: component.closeButton,
      timer: component.timer,
      state: 'hidden',

      /**
       * Shows the snackbar, through the queue
       * @returns {SnackbarComponent} Component instance for chaining
       */
      show(): SnackbarComponent {
        if (isVisible) return this;
        isVisible = true;
        this.state = 'visible';

        queue.add(
          {
            element,
            on: (event: string, handler: () => void) => component.on?.(event, handler),
            off: (event: string, handler: () => void) => component.off?.(event, handler),
            _show: open,
            // Lets the queue evict this snackbar (replace, clear)
            _hide: (): void => close('queue'),
          } as QueuedSnackbar,
          { behavior: config.queueBehavior }
        );

        return this;
      },

      /**
       * Hides the snackbar
       * @returns {SnackbarComponent} Component instance for chaining
       */
      hide(): SnackbarComponent {
        close('api');
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
       * Sets the action button text
       * @param {string} text - New action text
       * @returns {SnackbarComponent} Component instance for chaining
       */
      setAction(text: string): SnackbarComponent {
        component.action?.setText(text);
        if (isVisible) layout();
        return this;
      },

      /**
       * Gets the action button text
       * @returns {string} Current action text
       */
      getAction(): string {
        return component.action?.getText() || '';
      },

      /**
       * Sets the display duration and restarts the countdown if on screen
       * @param {SnackbarDuration} duration - A preset or milliseconds (0 for indefinite)
       * @returns {SnackbarComponent} Component instance for chaining
       */
      setDuration(duration: SnackbarDuration): SnackbarComponent {
        component.timer?.setDuration(durationToMs(duration, Boolean(component.action)));
        if (isVisible) component.timer?.start();
        return this;
      },

      /**
       * Gets the display duration
       * @returns {number} Current duration in milliseconds (0 for indefinite)
       */
      getDuration(): number {
        return component.timer?.getDuration() ?? 0;
      },

      /**
       * Sets the snackbar position
       * @param {SnackbarPosition} position - New position
       * @returns {SnackbarComponent} Component instance for chaining
       */
      setPosition(position: SnackbarPosition): SnackbarComponent {
        component.position?.setPosition(position);
        return this;
      },

      /**
       * Gets the snackbar position
       * @returns {SnackbarPosition} Current position
       */
      getPosition(): SnackbarPosition {
        return component.position?.getPosition() || 'center';
      },

      /**
       * Adds event listener
       * @param {string} event - Event name
       * @param {Function} handler - Event handler
       * @returns {SnackbarComponent} Component instance for chaining
       */
      on(event: SnackbarEventType, handler: (event: SnackbarEvent) => void): SnackbarComponent {
        component.on?.(event, handler);
        return this;
      },

      /**
       * Removes event listener
       * @param {string} event - Event name
       * @param {Function} handler - Event handler
       * @returns {SnackbarComponent} Component instance for chaining
       */
      off(event: SnackbarEventType, handler: (event: SnackbarEvent) => void): SnackbarComponent {
        component.off?.(event, handler);
        return this;
      },

      /**
       * Destroys the snackbar component and cleans up resources
       */
      destroy(): void {
        isVisible = false;
        cancelRemoval();
        element.remove();
        component.timer?.stop();
        component.action?.destroy();
        component.close?.destroy();
        lifecycle.destroy();
      },
    };

    // The countdown ran out
    component.on?.('timeout', () => close('timeout'));

    // The action dismisses the snackbar (Android: "Snackbars are
    // automatically dismissed when the action is clicked")
    component.actionButton?.addEventListener('click', (event: Event) => {
      emit('action', { originalEvent: event });
      close('action', event);
    });

    component.closeButton?.addEventListener('click', (event: Event) => {
      close('close-button', event);
    });

    // Escape dismisses the snackbar when focus is inside it
    element.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !isVisible) return;
      event.stopPropagation();
      close('escape', event);
    });

    // Configured callbacks
    if (config.onOpen) api.on('open', config.onOpen);
    if (config.onClose) api.on('close', config.onClose);
    if (config.onAction) api.on('action', config.onAction);
    if (config.on) {
      for (const [type, handler] of Object.entries(config.on)) {
        if (handler) api.on(type as SnackbarEventType, handler);
      }
    }

    return api;
  };
