// src/components/switch/switch.ts
import { pipe } from "../../core/compose";
import { createBase, withElement } from "../../core/compose/component";
import {
  withEvents,
  withTextLabel,
  withDisabled,
  withLifecycle,
  withInput,
  withCheckable,
} from "../../core/compose/features";
import { withAPI } from "./api";
import { withSupportingText, withTrack } from "./features";
import { SwitchConfig, SwitchComponent } from "./types";
import { createBaseConfig, getElementConfig, getApiConfig } from "./config";

/**
 * Creates a new Switch component
 * @param {SwitchConfig} config - Switch configuration
 * @returns {SwitchComponent} Switch component instance
 */
const createSwitch = (config: SwitchConfig = {}): SwitchComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    const switchComponent = pipe(
      createBase,
      withEvents(), // Move events first to ensure system is available
      withElement(getElementConfig(baseConfig)),
      withTextLabel(baseConfig),
      withInput(baseConfig),
      withTrack(baseConfig),
      withSupportingText(baseConfig),
      withCheckable(baseConfig),
      withDisabled(baseConfig),
      withLifecycle(),
      (comp) => withAPI(getApiConfig(comp))(comp)
    )(baseConfig);

    return switchComponent as SwitchComponent;
  } catch (error) {
    console.error(
      "Switch creation error:",
      error instanceof Error ? error.message : String(error)
    );
    throw new Error(
      `Failed to create switch: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export default createSwitch;
