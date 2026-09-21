// src/components/textfield/features/suffix-text.ts

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
 * Configuration for suffix text feature
 */
export interface SuffixTextConfig {
  /**
   * Suffix text content to display after the input
   */
  suffixText?: string;
  
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
 * Component with suffix text capabilities
 */
/**
 * What this feature installs.
 *
 * Declared apart from SuffixTextComponent because the enhancer returns
 * `C & SuffixTextFeature`: C already carries the base half, and naming the whole
 * interface made the return `C & Partial<SuffixTextComponent>`, which widened
 * `suffixTextElement` to include undefined and put the setters' `this` at odds with
 * the property they assign.
 */
export interface SuffixTextFeature {
  /**
   * Suffix text element
   */
  suffixTextElement: HTMLElement | null;
  
  /**
   * Sets suffix text content
   * @param text - Text content to display after the input
   * @returns Component instance for chaining
   */
  setSuffixText: (text: string) => SuffixTextComponent;
  
  /**
   * Removes suffix text
   * @returns Component instance for chaining
   */
  removeSuffixText: () => SuffixTextComponent;
}

/**
 * Component with suffixtext capabilities
 */
export interface SuffixTextComponent extends BaseComponent, SuffixTextFeature {}

/**
 * Adds suffix text to a textfield component
 * @param config - Configuration with suffix text settings
 * @returns Function that enhances a component with suffix text
 */
// `& object` lets a component config that shares no key with SuffixTextConfig through.
export const withSuffixText = <T extends SuffixTextConfig & object>(config: T) =>
  <C extends LifecycleElementComponent>(component: C): C & SuffixTextFeature => {
    // The label offsets this feature used to write on a timer are gone:
    // `placement.ts` owns label positioning and accounts for an icon and a
    // prefix together, which the hardcoded 44px did not. `api.ts` already
    // schedules a placement update after every one of these calls.
    const PREFIX = config.prefix || 'mtrl';
    const NAME = config.componentName || 'textfield';

    // The slot is created when it is first needed, not only when the option was
    // set at creation. The setters used to exist only on a component configured
    // with this slot, so `setSuffixText()` on a plain field did nothing at all
    // and said nothing about it.
    let slot: HTMLElement | null = null;

    const ensureSlot = (): HTMLElement => {
      if (slot && slot.parentNode) return slot;
      const element = document.createElement('span');
      element.className = `${PREFIX}-${NAME}-suffix`;
      component.element.appendChild(element);
      component.element.classList.add(`${PREFIX}-${NAME}--with-suffix`);
      slot = element;
      return element;
    };

    const detachSlot = (): void => {
      slot?.remove();
      // Clearing the closure reference is the point: it used to keep pointing
      // at the detached node, so a later `setSuffixText()` wrote into an element
      // that was no longer in the document and nothing appeared.
      slot = null;
      component.element.classList.remove(`${PREFIX}-${NAME}--with-suffix`);
    };

    const write = (element: HTMLElement, value: string): void => {
      element.textContent = value;
    };

    if (config.suffixText) {
      write(ensureSlot(), config.suffixText);
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
      suffixTextElement: slot,

      setSuffixText(text: string) {
        this.suffixTextElement = ensureSlot();
        write(this.suffixTextElement, text);
        return this;
      },

      removeSuffixText() {
        if (slot) {
          detachSlot();
          this.suffixTextElement = null;
        }
        return this;
      }
    };
  };
