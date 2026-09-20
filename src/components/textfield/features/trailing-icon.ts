// src/components/textfield/features/trailing-icon.ts

import { BaseComponent, ElementComponent } from '../../../core/compose/component';

import { setHTML } from "../../../core/dom/html";
/**
 * Extended element component with input field
 */
interface InputElementComponent extends ElementComponent {
  input?: HTMLInputElement | HTMLTextAreaElement;
  lifecycle?: {
    destroy: () => void;
  };
}

/**
 * Configuration for trailing icon feature
 */
export interface TrailingIconConfig {
  /**
   * Trailing icon HTML content
   */
  trailingIcon?: string;
  
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
 * Component with trailing icon capabilities
 */
export interface TrailingIconComponent extends BaseComponent {
  /**
   * Trailing icon element
   */
  trailingIcon: HTMLElement | null;
  
  /**
   * Sets trailing icon content
   * @param html - HTML content for the icon
   * @returns Component instance for chaining
   */
  setTrailingIcon: (html: string) => TrailingIconComponent;
  
  /**
   * Removes trailing icon
   * @returns Component instance for chaining
   */
  removeTrailingIcon: () => TrailingIconComponent;
}

/**
 * Adds trailing icon to a textfield component
 * @param config - Configuration with trailing icon settings
 * @returns Function that enhances a component with trailing icon
 */
// `& object` lets a component config that shares no key with TrailingIconConfig through.
export const withTrailingIcon = <T extends TrailingIconConfig & object>(config: T) =>
  <C extends InputElementComponent>(component: C): C & Partial<TrailingIconComponent> => {
    // The label offsets this feature used to write on a timer are gone:
    // `placement.ts` owns label positioning and accounts for an icon and a
    // prefix together, which the hardcoded 44px did not. `api.ts` already
    // schedules a placement update after every one of these calls.
    const PREFIX = config.prefix || 'mtrl';
    const NAME = config.componentName || 'textfield';

    // The slot is created when it is first needed, not only when the option was
    // set at creation. The setters used to exist only on a component configured
    // with this slot, so `setTrailingIcon()` on a plain field did nothing at all
    // and said nothing about it.
    let slot: HTMLElement | null = null;

    const ensureSlot = (): HTMLElement => {
      if (slot && slot.parentNode) return slot;
      const element = document.createElement('span');
      element.className = `${PREFIX}-${NAME}-trailing-icon`;
      component.element.appendChild(element);
      component.element.classList.add(`${PREFIX}-${NAME}--with-trailing-icon`);
      if (component.input) {
        component.input.classList.add(`${PREFIX}-${NAME}-input--with-trailing-icon`);
      }
      slot = element;
      return element;
    };

    const detachSlot = (): void => {
      slot?.remove();
      // Clearing the closure reference is the point: it used to keep pointing
      // at the detached node, so a later `setTrailingIcon()` wrote into an element
      // that was no longer in the document and nothing appeared.
      slot = null;
      component.element.classList.remove(`${PREFIX}-${NAME}--with-trailing-icon`);
      if (component.input) {
        component.input.classList.remove(`${PREFIX}-${NAME}-input--with-trailing-icon`);
      }
    };

    const write = (element: HTMLElement, value: string): void => {
      setHTML(element, value);
    };

    if (config.trailingIcon) {
      write(ensureSlot(), config.trailingIcon);
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
      trailingIcon: slot,

      setTrailingIcon(html: string) {
        this.trailingIcon = ensureSlot();
        write(this.trailingIcon, html);
        return this;
      },

      removeTrailingIcon() {
        if (slot) {
          detachSlot();
          this.trailingIcon = null;
        }
        return this;
      }
    };
  };
