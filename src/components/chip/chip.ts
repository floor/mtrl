// src/components/chip/chip.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withText,
  withIcon,
  withVariant,
  withSize,
  withRipple,
  withDisabled,
  withLifecycle
} from '../../core/compose/features';
import { withAPI } from './api';
import { ChipConfig, ChipComponent, BaseComponent } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Chip component
 * @param {ChipConfig} config - Chip configuration object
 * @returns {ChipComponent} Chip component instance
 */
const createChip = (config: ChipConfig = {}): ChipComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    const chip = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withSize(baseConfig),
      withText(baseConfig),
      withIcon({
        ...baseConfig,
        position: 'start',
        iconContent: config.leadingIcon || config.icon
      }),
      withDisabled(baseConfig),
      withRipple(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    // Add trailing icon if provided
    if (config.trailingIcon) {
      const trailingIconElement = document.createElement('span');
      trailingIconElement.className = `${baseConfig.prefix}-chip-trailing-icon`;
      trailingIconElement.innerHTML = config.trailingIcon;
      chip.element.appendChild(trailingIconElement);

      // Add event listener for remove/close action if needed
      if (config.onTrailingIconClick) {
        trailingIconElement.addEventListener('click', (e) => {
          e.stopPropagation();
          config.onTrailingIconClick!(chip as ChipComponent);
        });
      }
    }

    // Initialize selected state if needed
    if (config.selected) {
      (chip as ChipComponent).setSelected(true);
    }

    // Handle selection callback
    if (config.onSelect) {
      chip.element.addEventListener('click', () => {
        if (chip.element.getAttribute('aria-disabled') !== 'true') {
          config.onSelect!(chip as ChipComponent);
        }
      });
    }

    return chip as ChipComponent;
  } catch (error) {
    console.error('Chip creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create chip: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default createChip;