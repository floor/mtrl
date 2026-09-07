// src/components/snackbar/position.ts
import { BaseComponent, SnackbarPosition } from './types';
import { SNACKBAR_POSITIONS } from './constants';

/**
 * Position configuration for the withPosition function
 */
interface PositionConfig {
  prefix?: string;
  position?: SnackbarPosition;
}

const isPosition = (value: unknown): value is SnackbarPosition =>
  (Object.values(SNACKBAR_POSITIONS) as unknown[]).includes(value);

/**
 * Adds position handling to snackbar. The position is a class; the
 * stylesheet does the rest, so nothing here touches inline styles.
 * @param {PositionConfig} config - Position configuration
 * @returns {Function} Higher-order function that adds position features
 */
export const withPosition = (config: PositionConfig) =>
  (component: BaseComponent): BaseComponent => {
    const prefix = config.prefix || 'mtrl';
    let position: SnackbarPosition = isPosition(config.position) ? config.position : SNACKBAR_POSITIONS.CENTER;

    const className = (value: SnackbarPosition): string => `${prefix}-snackbar--${value}`;
    component.element.classList.add(className(position));

    return {
      ...component,
      position: {
        /**
         * Get current position
         * @returns {string} Current position
         */
        getPosition: (): SnackbarPosition => position,

        /**
         * Set new position; an unknown value falls back to the centre
         * @param {string} next - New position to set
         * @returns {BaseComponent} Component instance
         */
        setPosition: (next: SnackbarPosition): BaseComponent => {
          const value = isPosition(next) ? next : SNACKBAR_POSITIONS.CENTER;
          if (!isPosition(next)) {
            console.warn(`Invalid position: ${next}. Using default: ${SNACKBAR_POSITIONS.CENTER}`);
          }
          component.element.classList.remove(className(position));
          position = value;
          component.element.classList.add(className(position));
          return component;
        }
      }
    };
  };
