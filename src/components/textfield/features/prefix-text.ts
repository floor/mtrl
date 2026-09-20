// src/components/textfield/features/prefix-text.ts

import { BaseComponent, ElementComponent } from '../../../core/compose/component';

/**
 * Extended element component with lifecycle
 */
interface LifecycleElementComponent extends ElementComponent {
  lifecycle?: {
    destroy: () => void;
  };
}

/**
 * Configuration for prefix text feature
 */
export interface PrefixTextConfig {
  /**
   * Prefix text content to display before the input
   */
  prefixText?: string;
  
  /**
   * CSS class prefix
   */
  prefix?: string;
  
  /**
   * Component name
   */
  componentName?: string;
}

/**
 * Component with prefix text capabilities
 */
export interface PrefixTextComponent extends BaseComponent {
  /**
   * Prefix text element
   */
  prefixTextElement: HTMLElement | null;
  
  /**
   * Sets prefix text content
   * @param text - Text content to display before the input
   * @returns Component instance for chaining
   */
  setPrefixText: (text: string) => PrefixTextComponent;
  
  /**
   * Removes prefix text
   * @returns Component instance for chaining
   */
  removePrefixText: () => PrefixTextComponent;
}

/**
 * Adds prefix text to a textfield component
 * @param config - Configuration with prefix text settings
 * @returns Function that enhances a component with prefix text
 */
// `& object` lets a component config that shares no key with PrefixTextConfig through.
export const withPrefixText = <T extends PrefixTextConfig & object>(config: T) =>
  <C extends LifecycleElementComponent>(component: C): C & Partial<PrefixTextComponent> => {
    // The label offsets this feature used to write on a timer are gone:
    // `placement.ts` owns label positioning and accounts for an icon and a
    // prefix together, which the hardcoded 44px did not. `api.ts` already
    // schedules a placement update after every one of these calls.
    const PREFIX = config.prefix || 'mtrl';
    const NAME = config.componentName || 'textfield';

    // The slot is created when it is first needed, not only when the option was
    // set at creation. The setters used to exist only on a component configured
    // with this slot, so `setPrefixText()` on a plain field did nothing at all
    // and said nothing about it.
    let slot: HTMLElement | null = null;

    const ensureSlot = (): HTMLElement => {
      if (slot && slot.parentNode) return slot;
      const element = document.createElement('span');
      element.className = `${PREFIX}-${NAME}-prefix`;
      component.element.appendChild(element);
      component.element.classList.add(`${PREFIX}-${NAME}--with-prefix`);
      slot = element;
      return element;
    };

    const detachSlot = (): void => {
      slot?.remove();
      // Clearing the closure reference is the point: it used to keep pointing
      // at the detached node, so a later `setPrefixText()` wrote into an element
      // that was no longer in the document and nothing appeared.
      slot = null;
      component.element.classList.remove(`${PREFIX}-${NAME}--with-prefix`);
    };

    const write = (element: HTMLElement, value: string): void => {
      element.textContent = value;
    };

    if (config.prefixText) {
      write(ensureSlot(), config.prefixText);
    }

    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy as () => void;
      component.lifecycle.destroy = () => {
        slot?.remove();
        slot = null;
        originalDestroy.call(component.lifecycle);
      };
    }

    return {
      ...component,
      // A plain property, not an accessor. These features are composed by
      // piping `{...component}` through each one, and a spread invokes a
      // getter and copies its value — so an accessor defined here is gone
      // by the time the next feature has spread it. The setters keep this
      // in step through `this`, which at call time is the finished object.
      // Whatever the creation option produced, if it produced anything.
      prefixTextElement: slot,

      setPrefixText(text: string) {
        this.prefixTextElement = ensureSlot();
        write(this.prefixTextElement, text);
        return this;
      },

      removePrefixText() {
        if (slot) {
          detachSlot();
          this.prefixTextElement = null;
        }
        return this;
      }
    };
  };
