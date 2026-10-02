// src/components/snackbar/api.ts
import {
  BaseComponent,
  SnackbarComponent,
  SnackbarEvent,
  SnackbarEvents,
  SnackbarEventType,
  SnackbarCloseReason,
  SnackbarDuration,
  ApiOptions,
  QueuedSnackbar,
  SnackbarPosition,
} from './types';
import { SNACKBAR_CLASSES, SNACKBAR_DEFAULTS } from './constants';
import { durationToMs } from './config';
import { activeElementOf, deepActiveElement } from '../../core/dom/focus';
import { hideFromTopLayer, showInTopLayer } from '../../core/dom/layer';
import { placeInLayer } from './layer';

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

    // What the queue holds while this snackbar waits or shows
    let entry: QueuedSnackbar | null = null;
    let previouslyFocused: Element | null = null;
    let removal: ReturnType<typeof setTimeout> | null = null;
    let onTransitionEnd: ((event: TransitionEvent) => void) | null = null;
    // A top-layer snackbar is a popover="manual" element, hidden (display:
    // none) while closed; `restore` puts it back where it was once hidden
    const topLayer = config.layer === 'top';
    let restore: (() => void) | null = null;
    if (topLayer) element.setAttribute('popover', 'manual');

    const showOnTop = (): void => void showInTopLayer(element, { kind: 'popover-manual' });

    /** Takes the element off the page, or out of the top layer back to its place */
    const takeOff = (): void => {
      if (!topLayer) {
        element.remove();
        return;
      }
      hideFromTopLayer(element);
      restore?.();
      restore = null;
    };

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
        takeOff();
      };
      onTransitionEnd = (event: TransitionEvent): void => {
        if (event.target === element && event.propertyName === 'opacity') remove();
      };
      element.addEventListener('transitionend', onTransitionEnd);
      removal = setTimeout(remove, SNACKBAR_DEFAULTS.ANIMATION_DURATION);
    };

    const close = (reason: SnackbarCloseReason, originalEvent: Event | null = null): void => {
      // Queued, it was never open: it gives up its turn, and there is nothing
      // to close (FLO-548).
      if (api.state === 'queued') {
        api.state = 'hidden';
        if (entry) queue.remove(entry);
        return;
      }
      if (api.state !== 'visible') return;
      api.state = 'hidden';
      component.timer?.stop();

      // Focus goes back where it came from if it was inside the snackbar;
      // otherwise it is not touched (M3 snackbar accessibility: focus).
      const active = activeElementOf(element);
      if (active && element.contains(active) && previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }

      element.classList.remove(cls(SNACKBAR_CLASSES.VISIBLE));
      scheduleRemoval();

      emit('close', { reason, originalEvent });
      emit('dismiss', { reason, originalEvent });
    };

    const open = (): void => {
      // Its turn: the state and the event together (FLO-548)
      api.state = 'visible';
      cancelRemoval();
      previouslyFocused = deepActiveElement();
      if (topLayer) {
        // Shown again before it was taken off: it is still in place
        restore ??= placeInLayer(element, showOnTop);
        showOnTop();
      } else {
        element.ownerDocument.body.appendChild(element);
      }
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
        if (api.state !== 'hidden') return this;
        // Queued until the queue shows it, which is now when nothing is on screen
        api.state = 'queued';
        entry = {
          element,
          on: (event: string, handler: () => void) => component.on?.(event, handler),
          off: (event: string, handler: () => void) => component.off?.(event, handler),
          _show: open,
          // Lets the queue evict this snackbar (replace, clear)
          _hide: (): void => close('queue'),
        } as QueuedSnackbar;
        queue.add(entry, { behavior: config.queueBehavior });

        return this;
      },

      isOpen: (): boolean => api.state === 'visible',

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
        if (api.isOpen()) layout();
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
        if (api.isOpen()) component.timer?.start();
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
      on<K extends keyof SnackbarEvents>(event: K, handler: SnackbarEvents[K]): SnackbarComponent {
        component.on?.(event, handler);
        return this;
      },

      /**
       * Removes event listener
       * @param {string} event - Event name
       * @param {Function} handler - Event handler
       * @returns {SnackbarComponent} Component instance for chaining
       */
      off<K extends keyof SnackbarEvents>(event: K, handler: SnackbarEvents[K]): SnackbarComponent {
        component.off?.(event, handler);
        return this;
      },

      /**
       * Destroys the snackbar component and cleans up resources
       */
      destroy(): void {
        // Without events; a queued one must not be shown after this
        if (entry) queue.remove(entry);
        api.state = 'hidden';
        cancelRemoval();
        takeOff();
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
      if (event.key !== 'Escape' || !api.isOpen()) return;
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
