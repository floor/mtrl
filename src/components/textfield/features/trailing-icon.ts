// src/components/textfield/features/trailing-icon.ts

import { BaseComponent, ElementComponent } from '../../../core/compose/component';

import { setHTML } from "../../../core/dom/html";
import { fieldOf } from './field';
/**
 * Extended element component with input field
 */
interface InputElementComponent extends ElementComponent {
  input?: HTMLInputElement | HTMLTextAreaElement;
  emit?: (event: string, data?: unknown) => void;
  lifecycle?: {
    destroy: () => void;
  };
}

/** What an interactive trailing icon's `trailing` event carries (FLO-301) */
export interface TextFieldTrailingPayload {
  /** The field's value when the icon was activated */
  value: string;
  /** The click (Enter and Space reach a button as one) */
  event: MouseEvent;
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
   * Makes the trailing icon a button with this accessible name: clear, show
   * password, open a menu (FLO-301). M3 draws an interactive trailing icon as an
   * icon button, as Compose's trailing slot holds an `IconButton`: a 40dp state
   * layer and a 48dp target. Activating it emits `trailing`. Without a label the
   * icon is decorative.
   */
  trailingIconLabel?: string;

  /** `trailing` listener. Registered on the text field at creation, not called from here. */
  onTrailingClick?: (event: TextFieldTrailingPayload) => void;

  /** Whether the field starts disabled; the trailing button is disabled with it */
  disabled?: boolean;

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
/**
 * What this feature installs.
 *
 * Declared apart from TrailingIconComponent because the enhancer returns
 * `C & TrailingIconFeature`: C already carries the base half, and naming the whole
 * interface made the return `C & Partial<TrailingIconComponent>`, which widened
 * `trailingIcon` to include undefined and put the setters' `this` at odds with
 * the property they assign.
 */
export interface TrailingIconFeature {
  /**
   * Trailing icon element
   */
  trailingIcon: HTMLElement | null;
  
  /**
   * Sets trailing icon content
   * @param html - HTML content for the icon
   * @param label - The button's accessible name, making the icon a button; an empty
   *   string makes it decorative again; left out, the icon keeps what it is
   * @returns Component instance for chaining
   */
  setTrailingIcon: (html: string, label?: string) => TrailingIconComponent;
  
  /**
   * Removes trailing icon
   * @returns Component instance for chaining
   */
  removeTrailingIcon: () => TrailingIconComponent;
}

/**
 * Component with trailingicon capabilities
 */
export interface TrailingIconComponent extends BaseComponent, TrailingIconFeature {}

/**
 * Adds trailing icon to a textfield component
 * @param config - Configuration with trailing icon settings
 * @returns Function that enhances a component with trailing icon
 */
// `& object` lets a component config that shares no key with TrailingIconConfig through.
export const withTrailingIcon = <T extends TrailingIconConfig & object>(config: T) =>
  <C extends InputElementComponent>(component: C): C & TrailingIconFeature => {
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
    // The button's accessible name; empty, the icon is decorative (FLO-301)
    let label = config.trailingIconLabel ?? '';

    const activate = (event: MouseEvent): void => {
      if (component.input?.disabled) return;
      const detail: TextFieldTrailingPayload = { value: component.input?.value ?? '', event };
      component.emit?.('trailing', detail);
    };

    const create = (): HTMLElement => {
      const className = `${PREFIX}-${NAME}__trailing-icon`;
      if (!label) {
        const element = document.createElement('span');
        element.className = className;
        // Decorative without a label: hidden from screen readers, as the leading
        // icon is. An icon that acts takes trailingIconLabel and is a button (FLO-301)
        element.setAttribute('aria-hidden', 'true');
        return element;
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `${className} ${className}--button`;
      button.setAttribute('aria-label', label);
      button.disabled = Boolean(component.input?.disabled ?? config.disabled);
      button.addEventListener('click', activate);
      return button;
    };

    const ensureSlot = (): HTMLElement => {
      const wanted = label ? 'BUTTON' : 'SPAN';
      if (slot && slot.parentNode && slot.tagName === wanted) {
        if (label) slot.setAttribute('aria-label', label);
        return slot;
      }
      const element = create();
      // A change of kind keeps the icon and the slot's place
      if (slot?.parentNode) {
        element.append(...Array.from(slot.childNodes));
        slot.replaceWith(element);
      } else {
        fieldOf(component).appendChild(element);
      }
      component.element.classList.add(`${PREFIX}-${NAME}--with-trailing-icon`);
      if (component.input) {
        component.input.classList.add(`${PREFIX}-${NAME}__input--with-trailing-icon`);
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
        component.input.classList.remove(`${PREFIX}-${NAME}__input--with-trailing-icon`);
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

      setTrailingIcon(html: string, nextLabel?: string) {
        if (nextLabel !== undefined) label = nextLabel;
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
