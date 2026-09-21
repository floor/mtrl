// src/components/textfield/features/leading-icon.ts

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
 * Configuration for leading icon feature
 */
export interface LeadingIconConfig {
  /**
   * Leading icon HTML content
   */
  leadingIcon?: string;
  
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
 * Component with leading icon capabilities
 */
/**
 * What this feature installs.
 *
 * Declared apart from LeadingIconComponent because the enhancer returns
 * `C & LeadingIconFeature`: C already carries the base half, and naming the whole
 * interface made the return `C & Partial<LeadingIconComponent>`, which widened
 * `leadingIcon` to include undefined and put the setters' `this` at odds with
 * the property they assign.
 */
export interface LeadingIconFeature {
  /**
   * Leading icon element
   */
  leadingIcon: HTMLElement | null;
  
  /**
   * Sets leading icon content
   * @param html - HTML content for the icon
   * @returns Component instance for chaining
   */
  setLeadingIcon: (html: string) => LeadingIconComponent;
  
  /**
   * Removes leading icon
   * @returns Component instance for chaining
   */
  removeLeadingIcon: () => LeadingIconComponent;
}

/**
 * Component with leadingicon capabilities
 */
export interface LeadingIconComponent extends BaseComponent, LeadingIconFeature {}

/**
 * Adds leading icon to a textfield component
 * @param config - Configuration with leading icon settings
 * @returns Function that enhances a component with leading icon
 */
// `& object` lets a component config that shares no key with LeadingIconConfig through.
export const withLeadingIcon = <T extends LeadingIconConfig & object>(config: T) =>
  <C extends InputElementComponent>(component: C): C & LeadingIconFeature => {
    // The label offsets this feature used to write on a timer are gone:
    // `placement.ts` owns label positioning and accounts for an icon and a
    // prefix together, which the hardcoded 44px did not. `api.ts` already
    // schedules a placement update after every one of these calls.
    const PREFIX = config.prefix || 'mtrl';
    const NAME = config.componentName || 'textfield';

    // The slot is created when it is first needed, not only when the option was
    // set at creation. The setters used to exist only on a component that had
    // been configured with an icon, so `setLeadingIcon()` on a plain field was
    // a no-op that returned nothing and reported nothing.
    let iconElement: HTMLElement | null = null;

    const ensureIcon = (): HTMLElement => {
      if (iconElement && iconElement.parentNode) return iconElement;
      const element = document.createElement('span');
      element.className = `${PREFIX}-${NAME}__leading-icon`;
      component.element.appendChild(element);
      component.element.classList.add(`${PREFIX}-${NAME}--with-leading-icon`);
      if (component.input) {
        component.input.classList.add(`${PREFIX}-${NAME}-input--with-leading-icon`);
      }
      iconElement = element;
      return element;
    };

    const detachIcon = (): void => {
      iconElement?.remove();
      // Clearing the closure reference is the point: it used to keep pointing
      // at the detached node, so a later `setLeadingIcon()` wrote into an
      // element that was no longer in the document and nothing appeared.
      iconElement = null;
      component.element.classList.remove(`${PREFIX}-${NAME}--with-leading-icon`);
      if (component.input) {
        component.input.classList.remove(`${PREFIX}-${NAME}-input--with-leading-icon`);
      }
    };

    if (config.leadingIcon) {
      setHTML(ensureIcon(), config.leadingIcon);
    }

    if ('lifecycle' in component && component.lifecycle?.destroy) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        iconElement?.remove();
        iconElement = null;
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
      leadingIcon: iconElement,

      setLeadingIcon(html: string) {
        this.leadingIcon = ensureIcon();
        setHTML(this.leadingIcon, html);
        return this;
      },

      removeLeadingIcon() {
        if (iconElement) {
          detachIcon();
          this.leadingIcon = null;
        }
        return this;
      }
    };
  };
