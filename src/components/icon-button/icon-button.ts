// src/components/icon-button/icon-button.ts

import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withIcon,
  withVariant,
  withSize,
  withRipple,
  withDisabled,
  withLifecycle
} from '../../core/compose/features';
import { withToggle } from './features/toggle';
import { withAPI } from './api';
import { IconButtonConfig, IconButtonComponent } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new IconButton component with the specified configuration.
 *
 * IconButtons display actions in a compact form using icons. They must use
 * a system icon with a clear meaning. IconButtons support both default
 * (single action) and toggle (binary state) modes.
 *
 * The IconButton component is created using a functional composition pattern,
 * applying various features through the pipe function. This approach allows
 * for flexible and modular component construction.
 *
 * @param config - Configuration options for the icon button
 *   This can include icon content, variant styling, size, shape, width,
 *   toggle behavior, and other properties. See {@link IconButtonConfig}
 *   for available options.
 *
 * @returns A fully configured IconButton component instance with
 *   all requested features applied. The returned component has methods for
 *   manipulation, event handling, and lifecycle management.
 *
 * @throws Error if IconButton creation fails for any reason
 *
 * @example
 * ```ts
 * // Create a standard icon button
 * const menuButton = createIconButton({
 *   icon: '<svg>...</svg>',
 *   ariaLabel: 'Open menu'
 * });
 *
 * // Create a filled icon button
 * const addButton = createIconButton({
 *   icon: '<svg>...</svg>',
 *   variant: 'filled',
 *   ariaLabel: 'Add item'
 * });
 *
 * // Create a toggle icon button (favorite)
 * const favoriteButton = createIconButton({
 *   icon: '<svg>...</svg>', // outlined heart
 *   selectedIcon: '<svg>...</svg>', // filled heart
 *   toggle: true,
 *   variant: 'standard',
 *   ariaLabel: 'Add to favorites'
 * });
 *
 * // Listen for toggle events
 * favoriteButton.on('toggle', (e) => {
 *   console.log('Selected:', e.detail.selected);
 * });
 *
 * // Create different sizes
 * const smallButton = createIconButton({
 *   icon: '<svg>...</svg>',
 *   size: 'xs',
 *   ariaLabel: 'Small action'
 * });
 *
 * const largeButton = createIconButton({
 *   icon: '<svg>...</svg>',
 *   size: 'xl',
 *   variant: 'tonal',
 *   ariaLabel: 'Large action'
 * });
 *
 * // Create square shaped button
 * const squareButton = createIconButton({
 *   icon: '<svg>...</svg>',
 *   shape: 'square',
 *   variant: 'outlined',
 *   ariaLabel: 'Square action'
 * });
 *
 * // Create with different widths
 * const wideButton = createIconButton({
 *   icon: '<svg>...</svg>',
 *   width: 'wide',
 *   ariaLabel: 'Wide action'
 * });
 * ```
 *
 * @category Components
 */
const createIconButton = (config: IconButtonConfig = {}): IconButtonComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    const iconButton = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withSize(baseConfig),
      withIcon(baseConfig),
      withDisabled(baseConfig),
      withToggle(baseConfig),
      withRipple(baseConfig),
      withLifecycle(),
      // Add shape class if specified and not default
      (component) => {
        if (baseConfig.shape && baseConfig.shape !== 'round' && component.element) {
          const className = `${baseConfig.prefix}-${baseConfig.componentName}--${baseConfig.shape}`;
          component.element.classList.add(className);
        }
        return component;
      },
      // Add width class if specified and not default
      (component) => {
        if (baseConfig.width && baseConfig.width !== 'default' && component.element) {
          const className = `${baseConfig.prefix}-${baseConfig.componentName}--${baseConfig.width}`;
          component.element.classList.add(className);
        }
        return component;
      },
      (comp) => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    return iconButton;
  } catch (error) {
    console.error('IconButton creation error:', error);
    throw new Error(`Failed to create icon button: ${(error as Error).message}`);
  }
};

export default createIconButton;
