// src/components/tabs/tab-api.ts
import { TabComponent } from './types';
import { TAB_STATES, TAB_LAYOUT } from './constants';
import { BadgeComponent } from '../badge/types';
import createBadge from '../badge';

/**
 * API options for a Tab component
 */
interface ApiOptions {
  /** The button component's disabled API */
  disabled: {
    enable: () => void;
    disable: () => void;
    isDisabled?: () => boolean;
  };
  /** The component's lifecycle API */
  lifecycle: {
    destroy: () => void;
  };
  /** The button component (optional) */
  button?: any;
}

/**
 * Component with required elements and methods
 */
interface ComponentWithElements {
  /** The DOM element */
  element: HTMLElement;
  /** The button component (optional) */
  button?: any;
  /** The badge component (optional) */
  badge?: BadgeComponent;
  /** Class name helper */
  getClass: (name: string) => string;
  /** Component configuration */
  config: Record<string, any>;
  /** Event emitter (optional) */
  emit?: (event: string, data: any) => any;
}

/**
 * Enhances a tab component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 */
export const withTabAPI = ({ disabled, lifecycle, button }: ApiOptions) => 
  (component: ComponentWithElements): TabComponent => {
    // Use the button component as a delegate for some methods
    const buttonComponent = button || component.button;
    
    return {
      ...component as any,
      element: component.element,
      
      /**
       * Gets the tab's value
       */
      getValue: () => {
        if (buttonComponent && typeof buttonComponent.getValue === 'function') {
          return buttonComponent.getValue();
        }
        const value = component.element.getAttribute('data-value');
        return value !== null ? value : '';
      },
      
      /**
       * Sets the tab's value
       */
      setValue(value: string) {
        const safeValue = value || '';
        if (buttonComponent && typeof buttonComponent.setValue === 'function') {
          buttonComponent.setValue(safeValue);
        } else {
          component.element.setAttribute('data-value', safeValue);
        }
        return this;
      },
      
      /**
       * Activates the tab
       */
      activate() {
        component.element.classList.add(`${component.getClass('tab')}--${TAB_STATES.ACTIVE}`);
        component.element.setAttribute('aria-selected', 'true');
        return this;
      },
      
      /**
       * Deactivates the tab
       */
      deactivate() {
        component.element.classList.remove(`${component.getClass('tab')}--${TAB_STATES.ACTIVE}`);
        component.element.setAttribute('aria-selected', 'false');
        return this;
      },
      
      /**
       * Checks if the tab is active
       */
      isActive() {
        return component.element.classList.contains(`${component.getClass('tab')}--${TAB_STATES.ACTIVE}`);
      },
      
      /**
       * Enables the tab
       */
      enable() {
        if (disabled && typeof disabled.enable === 'function') {
          disabled.enable();
        }
        return this;
      },
      
      /**
       * Disables the tab
       */
      disable() {
        if (disabled && typeof disabled.disable === 'function') {
          disabled.disable();
        }
        return this;
      },
      
      /**
       * Sets the tab's text content
       */
      setText(content: string) {
        if (buttonComponent && typeof buttonComponent.setText === 'function') {
          buttonComponent.setText(content);
          this.updateLayoutStyle();
        }
        return this;
      },
      
      /**
       * Gets the tab's text content
       */
      getText() {
        return buttonComponent && typeof buttonComponent.getText === 'function' 
          ? buttonComponent.getText() 
          : '';
      },
      
      /**
       * Sets the tab's icon
       */
      setIcon(icon: string) {
        if (buttonComponent && typeof buttonComponent.setIcon === 'function') {
          buttonComponent.setIcon(icon);
          this.updateLayoutStyle();
        }
        return this;
      },
      
      /**
       * Gets the tab's icon
       */
      getIcon() {
        return buttonComponent && typeof buttonComponent.getIcon === 'function'
          ? buttonComponent.getIcon()
          : '';
      },
      
      /**
       * Sets the tab's badge
       */
      setBadge(content: string | number) {
        if (!component.badge) {
          // Create badge on demand if it doesn't exist
          const badgeConfig = {
            content,
            standalone: false,
            target: component.element,
            prefix: component.config.prefix
          };
          component.badge = createBadge(badgeConfig);
        } else {
          component.badge.setContent(content);
          component.badge.show();
        }
        return this;
      },
      
      /**
       * Gets the tab's badge content
       */
      getBadge() {
        return component.badge ? component.badge.getContent() : '';
      },
      
      /**
       * Shows the tab's badge
       */
      showBadge() {
        if (component.badge) {
          component.badge.show();
        }
        return this;
      },
      
      /**
       * Hides the tab's badge
       */
      hideBadge() {
        if (component.badge) {
          component.badge.hide();
        }
        return this;
      },
      
      /**
       * Gets the badge component
       */
      getBadgeComponent() {
        return component.badge;
      },
      
      /**
       * Destroys the tab
       */
      destroy() {
        if (component.badge) {
          component.badge.destroy();
        }
        
        if (lifecycle && typeof lifecycle.destroy === 'function') {
          lifecycle.destroy();
        }
      },
      
      /**
       * Updates tab layout classes based on content
       */
      updateLayoutStyle() {
        const hasText = !!this.getText();
        const hasIcon = !!this.getIcon();
        let layoutClass = '';
        
        if (hasText && hasIcon) {
          layoutClass = TAB_LAYOUT.ICON_AND_TEXT;
        } else if (hasIcon) {
          layoutClass = TAB_LAYOUT.ICON_ONLY;
        } else {
          layoutClass = TAB_LAYOUT.TEXT_ONLY;
        }
        
        // Remove all existing layout classes
        Object.values(TAB_LAYOUT).forEach(layout => {
          component.element.classList.remove(`${component.getClass('tab')}--${layout}`);
        });
        
        // Add the appropriate layout class
        component.element.classList.add(`${component.getClass('tab')}--${layoutClass}`);
      }
    };
  };