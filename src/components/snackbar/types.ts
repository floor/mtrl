// src/components/snackbar/types.ts
import type { EventCallback } from '../../core/state/emitter';
import type { ButtonComponent } from '../button/types';
import type { IconButtonComponent } from '../icon-button/types';

/**
 * Where the snackbar sits along the bottom edge
 */
export type SnackbarPosition = 'center' | 'start' | 'end';

/**
 * Duration presets: 4 s, 10 s, or until dismissed
 */
export type SnackbarDurationPreset = 'short' | 'long' | 'indefinite';

/**
 * A preset or a number of milliseconds (0 for indefinite)
 */
export type SnackbarDuration = SnackbarDurationPreset | number;

/**
 * Available snackbar queue behaviors
 */
export type SnackbarQueueBehavior = 'queue' | 'replace';

/**
 * Snackbar visibility states
 */
export type SnackbarState = 'visible' | 'hidden';

/**
 * Why a snackbar closed
 */
export type SnackbarCloseReason = 'timeout' | 'action' | 'close-button' | 'escape' | 'api' | 'queue';

/**
 * Available snackbar event types
 */
export type SnackbarEventType = 'open' | 'close' | 'action' | 'dismiss';

/**
 * Snackbar event data
 * @interface SnackbarEvent
 */
export interface SnackbarEvent {
  /** The snackbar component that triggered the event */
  snackbar: SnackbarComponent;

  /** Why the snackbar closed (`close` and `dismiss` events) */
  reason?: SnackbarCloseReason;

  /** Original DOM event if there was one */
  originalEvent: Event | null;
}

/**
 * What each snackbar event hands its handler.
 *
 * FLO-114. `on`/`off` are generic over these keys rather than taking a
 * `SnackbarEventType` and one payload type for all four, so a handler is
 * checked against the event it is registered for. The four payloads are the
 * same shape today; the map is what makes them able to differ -- `reason` is
 * only ever set on `close` and `dismiss`, and narrowing those two is now a
 * local change rather than a new signature.
 *
 * @interface SnackbarEvents
 */
export interface SnackbarEvents {
  /** The snackbar is on screen */
  open: (event: SnackbarEvent) => void;
  /** The snackbar is leaving; the event carries the reason */
  close: (event: SnackbarEvent) => void;
  /** The action button was clicked */
  action: (event: SnackbarEvent) => void;
  /** Fired with `close`; the queue listens to it */
  dismiss: (event: SnackbarEvent) => void;
}

/**
 * Configuration options for the snackbar component
 * @interface SnackbarConfig
 */
export interface SnackbarConfig {
  /** Text message to display; up to two lines */
  message: string;

  /** Label of the single text-button action, if any */
  action?: string;

  /** Adds a close icon button */
  dismissible?: boolean;

  /** Accessible name of the close icon (default "Dismiss") */
  closeLabel?: string;

  /**
   * How long the snackbar stays: `'short'` (4 s), `'long'` (10 s),
   * `'indefinite'`, or milliseconds (0 for indefinite). Defaults to
   * `'short'` without an action and `'indefinite'` with one: an actionable
   * snackbar should not go away on its own.
   */
  duration?: SnackbarDuration;

  /** Position of the snackbar along the bottom edge */
  position?: SnackbarPosition;

  /**
   * How this snackbar interacts with the queue when shown.
   * - `'queue'` (default): wait in line and show one at a time, in order.
   * - `'replace'`: immediately dismiss the current snackbar, drop any pending
   *   ones, and show this snackbar right away. Useful for rapid, repeated
   *   actions where only the latest message matters.
   */
  queueBehavior?: SnackbarQueueBehavior;

  /** Action button callback function */
  onAction?: (event: SnackbarEvent) => void;

  /** Callback function when the snackbar opens */
  onOpen?: (event: SnackbarEvent) => void;

  /** Callback function when the snackbar closes */
  onClose?: (event: SnackbarEvent) => void;

  /** Additional CSS classes */
  class?: string;

  /** Component prefix for CSS classes */
  prefix?: string;

  /** Component name for CSS classes */
  componentName?: string;

  /** Event handlers for snackbar events */
  on?: {
    [key in SnackbarEventType]?: (event: SnackbarEvent) => void;
  };
}

/**
 * Snackbar component public API interface
 * @interface SnackbarComponent
 */
export interface SnackbarComponent {
  /** The root element of the snackbar */
  element: HTMLElement;

  /** Current state of the snackbar */
  state: SnackbarState;

  /** The action button element (if present) */
  actionButton?: HTMLElement;

  /** The close icon button element (if present) */
  closeButton?: HTMLElement;

  /** Timer for auto-dismissal */
  timer?: SnackbarTimer;

  /** Displays the snackbar */
  show: () => SnackbarComponent;

  /** Hides the snackbar */
  hide: () => SnackbarComponent;

  /** Sets the message text */
  setMessage: (message: string) => SnackbarComponent;

  /** Gets the message text */
  getMessage: () => string;

  /** Sets the action button text */
  setAction: (text: string) => SnackbarComponent;

  /** Gets the action button text */
  getAction: () => string;

  /** Sets the display duration: a preset or milliseconds (0 for indefinite) */
  setDuration: (duration: SnackbarDuration) => SnackbarComponent;

  /** Gets the display duration in milliseconds (0 for indefinite) */
  getDuration: () => number;

  /** Sets the snackbar position */
  setPosition: (position: SnackbarPosition) => SnackbarComponent;

  /** Gets the snackbar position */
  getPosition: () => SnackbarPosition;

  /** Adds event listener */
  on: <K extends keyof SnackbarEvents>(
    event: K,
    handler: SnackbarEvents[K]
  ) => SnackbarComponent;

  /** Removes event listener */
  off: <K extends keyof SnackbarEvents>(
    event: K,
    handler: SnackbarEvents[K]
  ) => SnackbarComponent;

  /** Destroys the snackbar component and cleans up resources */
  destroy: () => void;
}

/**
 * The component as it passes through the enhancers
 */
export interface BaseComponent {
  element: HTMLElement;
  emit?: (event: string, data?: unknown) => void;
  // `EventCallback`, not `Function`. This host is handed the component the
  // pipe has built so far, whose `on` takes an EventCallback -- and `Function`
  // is a supertype of that, so under strictFunctionTypes a host promising to
  // call a handler with anything cannot accept one that takes a typed payload.
  // That is what stopped the pipe in snackbar.ts:37 resolving. FLO-114.
  on?: (event: string, handler: EventCallback) => unknown;
  off?: (event: string, handler: EventCallback) => unknown;
  getClass?: (name: string) => string;
  lifecycle?: {
    destroy?: () => void;
  };
  text?: {
    setText: (text: string) => unknown;
    getText: () => string;
  };
  position?: {
    getPosition: () => SnackbarPosition;
    setPosition: (position: SnackbarPosition) => unknown;
  };
  action?: ButtonComponent;
  actionButton?: HTMLElement;
  close?: IconButtonComponent;
  closeButton?: HTMLElement;
  timer?: SnackbarTimer;
}

/**
 * Timer interface for snackbar auto-dismissal
 */
export interface SnackbarTimer {
  /** Starts the countdown from the full duration */
  start: () => void;
  /** Cancels the countdown */
  stop: () => void;
  /** Sets the auto-dismiss duration in milliseconds (0 for none) */
  setDuration: (duration: number) => void;
  /** Gets the current auto-dismiss duration in milliseconds */
  getDuration: () => number;
}

/**
 * Interface for snackbars managed by the queue
 */
export interface QueuedSnackbar {
  _show: () => void;
  /** Visually dismisses the snackbar without advancing the queue */
  _hide?: () => void;
  /** The snackbar's own element, so the queue can tell whether it is still on screen */
  element?: HTMLElement;
  on: (event: string, handler: () => void) => void;
  off: (event: string, handler: () => void) => void;
}

/**
 * Options controlling how a snackbar is added to the queue
 */
export interface SnackbarQueueAddOptions {
  /** Behavior to apply when adding this snackbar (defaults to `'queue'`) */
  behavior?: SnackbarQueueBehavior;
}

/**
 * Interface for the snackbar queue manager
 */
export interface SnackbarQueue {
  add: (snackbar: QueuedSnackbar, options?: SnackbarQueueAddOptions) => void;
  clear: () => void;
  getLength: () => number;
}

/**
 * API options for enhancing a snackbar with API methods
 */
export interface ApiOptions {
  lifecycle: {
    destroy: () => void;
  };
  queue: SnackbarQueue;
  /** The resolved configuration */
  config: SnackbarConfig;
}
