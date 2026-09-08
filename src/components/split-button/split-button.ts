// src/components/split-button/split-button.ts
import { pipe } from "../../core/compose";
import { createBase, withElement } from "../../core/compose/component";
import { withEvents, withVariant, withSize, withLifecycle } from "../../core/compose/features";
import { withButtons } from "./features/buttons";
import { withMenu } from "./features/menu";
import { withAPI } from "./api";
import { SplitButtonConfig, SplitButtonComponent } from "./types";
import { createBaseConfig, getElementConfig } from "./config";

/**
 * Creates a split button: one action beside a button that opens more choices.
 *
 * @param {SplitButtonConfig} config - Split button configuration
 * @returns {SplitButtonComponent} Split button component instance
 *
 * @example
 * ```ts
 * const button = createSplitButton({
 *   text: 'Watch later',
 *   icon: watchIcon,
 *   trailingLabel: 'More watch options',
 *   items: [
 *     { id: 'queue', text: 'Add to queue' },
 *     { id: 'playlist', text: 'Save to playlist' }
 *   ],
 *   onClick: () => watchLater(),
 *   onSelect: ({ item }) => choose(item.id)
 * });
 * ```
 */
const createSplitButton = (config: SplitButtonConfig = {}): SplitButtonComponent => {
  const baseConfig = createBaseConfig(config);

  try {
    return pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withSize(baseConfig),
      withButtons(baseConfig),
      withMenu(baseConfig),
      withLifecycle(),
      (comp) =>
        withAPI({
          config: baseConfig,
          lifecycle: { destroy: comp.lifecycle?.destroy || (() => {}) },
        })(comp)
    )(baseConfig) as SplitButtonComponent;
  } catch (error) {
    console.error(
      "Split button creation error:",
      error instanceof Error ? error.message : String(error)
    );
    throw new Error(
      `Failed to create split button: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

export default createSplitButton;
