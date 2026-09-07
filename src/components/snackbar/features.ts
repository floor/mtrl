// src/components/snackbar/features.ts
import createButton from '../button';
import createIconButton from '../icon-button';
import { BaseComponent, SnackbarConfig, SnackbarTimer } from './types';
import { SNACKBAR_CLASSES, SNACKBAR_CLOSE_ICON } from './constants';
import { durationToMs } from './config';

/**
 * Adds the action: a text button, the one M3 allows, coloured inverse-primary
 * by the stylesheet. Reusing the button gives it the state layers, the focus
 * ring and the touch target.
 * @param {SnackbarConfig} config - Component configuration
 * @returns {Function} Higher-order function that adds the action button
 */
export const withActionButton = (config: SnackbarConfig) =>
  (component: BaseComponent): BaseComponent => {
    if (!config.action) return component;

    const prefix = config.prefix || 'mtrl';
    const button = createButton({
      text: config.action,
      variant: 'text',
      prefix,
      class: `${prefix}-${SNACKBAR_CLASSES.ACTION}`,
    });

    component.element.classList.add(`${prefix}-${SNACKBAR_CLASSES.WITH_ACTION}`);
    component.element.appendChild(button.element);

    return {
      ...component,
      action: button,
      actionButton: button.element,
    };
  };

/**
 * Adds the optional close affordance: a standard icon button (40dp, 24dp
 * icon; `SnackbarTokens.IconSize`), coloured inverse-on-surface by the
 * stylesheet.
 * @param {SnackbarConfig} config - Component configuration
 * @returns {Function} Higher-order function that adds the close button
 */
export const withCloseButton = (config: SnackbarConfig) =>
  (component: BaseComponent): BaseComponent => {
    if (!config.dismissible) return component;

    const prefix = config.prefix || 'mtrl';
    const button = createIconButton({
      icon: SNACKBAR_CLOSE_ICON,
      variant: 'standard',
      size: 's',
      ariaLabel: config.closeLabel || 'Dismiss',
      prefix,
      class: `${prefix}-${SNACKBAR_CLASSES.CLOSE}`,
    });

    component.element.classList.add(`${prefix}-${SNACKBAR_CLASSES.DISMISSIBLE}`);
    component.element.appendChild(button.element);

    return {
      ...component,
      close: button,
      closeButton: button.element,
    };
  };

/**
 * Adds the auto-dismiss timer. It emits `timeout` when the duration runs out
 * and holds while the pointer is over the snackbar or focus is inside it:
 * Compose extends the timeout through the accessibility manager, and pausing
 * is the web's equivalent for someone who needs more time (WCAG 2.2.1).
 * @param {SnackbarConfig} config - Component configuration
 * @returns {Function} Higher-order function that adds timer features
 */
export const withDismissTimer = (config: SnackbarConfig) =>
  (component: BaseComponent): BaseComponent => {
    const element = component.element;
    let duration = durationToMs(config.duration, Boolean(config.action));
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let remaining = 0;
    let startedAt = 0;
    let running = false;
    let hovered = false;
    let focused = false;

    const fire = (): void => {
      timeoutId = null;
      running = false;
      component.emit?.('timeout');
    };

    const run = (): void => {
      if (timeoutId !== null || remaining <= 0) return;
      startedAt = Date.now();
      timeoutId = setTimeout(fire, remaining);
    };

    const halt = (): void => {
      if (timeoutId === null) return;
      clearTimeout(timeoutId);
      timeoutId = null;
      remaining -= Date.now() - startedAt;
    };

    const held = (): boolean => hovered || focused;

    const startTimer = (): void => {
      halt();
      remaining = duration;
      running = duration > 0;
      if (running && !held()) run();
    };

    const stopTimer = (): void => {
      halt();
      running = false;
      remaining = 0;
    };

    const resume = (): void => {
      if (running && !held()) run();
    };

    element.addEventListener('pointerenter', () => {
      hovered = true;
      halt();
    });
    element.addEventListener('pointerleave', () => {
      hovered = false;
      resume();
    });
    element.addEventListener('focusin', () => {
      focused = true;
      halt();
    });
    element.addEventListener('focusout', (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && element.contains(next)) return;
      focused = false;
      resume();
    });

    const originalDestroy = component.lifecycle?.destroy;
    if (component.lifecycle) {
      component.lifecycle.destroy = () => {
        stopTimer();
        originalDestroy?.call(component.lifecycle);
      };
    }

    const timer: SnackbarTimer = {
      start: startTimer,
      stop: stopTimer,
      setDuration: (value: number): void => {
        duration = Number.isFinite(value) && value > 0 ? value : 0;
      },
      getDuration: (): number => duration,
    };

    return {
      ...component,
      timer,
    };
  };
