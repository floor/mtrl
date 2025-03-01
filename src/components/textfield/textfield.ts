// src/components/textfield/textfield.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withDisabled,
  withLifecycle,
  withVariant,
  withSize,
  withTextInput,
  withTextLabel
} from '../../core/compose/features';
import { withAPI } from './api';
import { TextfieldConfig, TextfieldComponent } from './types';
import { 
  createBaseConfig, 
  getElementConfig,
  getApiConfig
} from './config';

/**
 * Creates a new Textfield component
 * @param {TextfieldConfig} config - Textfield configuration
 * @returns {TextfieldComponent} Textfield component instance
 */
const createTextfield = (config: TextfieldConfig = {}): TextfieldComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    const textfield = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withSize(baseConfig),
      withTextInput(baseConfig),
      withTextLabel(baseConfig),
      withDisabled(baseConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    return textfield as TextfieldComponent;
  } catch (error) {
    console.error('Textfield creation error:', error instanceof Error ? error.message : String(error));
    throw new Error(`Failed to create textfield: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export default createTextfield;