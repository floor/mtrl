// src/components/tabs/tab-api.ts
import { TabComponent } from './types';
import { TAB_STATES, TAB_LAYOUT } from './constants';
import { BadgeComponent } from '../badge/types';
// Import directly from badge component, not via core/features
// to avoid circular dependencies
import createBadge from '../badge';

interface ApiOptions {
  disabled: {
    enable: () => void;
    disable: () => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}

interface ComponentWithElements {
  element: HTMLElement;
  text: {
    setText: (content: string) => any;
    getText: () => string;
    getElement: () => HTMLElement | null;
  };
  icon: {
    setIcon: (html: string) => any;
    getIcon: () => string;
    getElement: () => HTMLElement | null;
  };
  badge?: BadgeComponent;
  getClass: (name: string) => string;
  config: Record<string, any>;
}

/**
 * Enhances a tab component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Tab component
 */
export const withTabAPI = ({ disabled, lifecycle }: ApiOptions) => 
  (component: ComponentWithElements): TabComponent => ({
    ...component as any,
    element: component.element,
    
    getValue: () => component.element.getAttribute('data-value') || '',
    
    setValue(value: string) {
      component.element.setAttribute('data-value', value);
      return this;
    },
    
    activate() {
      component.element.classList.add(`${component.getClass('tab')}--${TAB_STATES.ACTIVE}`);
      component.element.setAttribute('aria-selected', 'true');
      return this;
    },
    
    deactivate() {
      component.element.classList.remove(`${component.getClass('tab')}--${TAB_STATES.ACTIVE}`);
      component.element.setAttribute('aria-selected', 'false');
      return this;
    },
    
    isActive() {
      return component.element.classList.contains(`${component.getClass('tab')}--${TAB_STATES.ACTIVE}`);
    },
    
    enable() {
      disabled.enable();
      return this;
    },
    
    disable() {
      disabled.disable();
      return this;
    },
    
    setText(content: string) {
      component.text.setText(content);
      this.updateLayoutStyle();
      return this;
    },
    
    getText() {
      return component.text.getText();
    },
    
    setIcon(icon: string) {
      component.icon.setIcon(icon);
      this.updateLayoutStyle();
      return this;
    },
    
    getIcon() {
      return component.icon.getIcon();
    },
    
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
    
    getBadge() {
      return component.badge ? component.badge.getContent() : '';
    },
    
    showBadge() {
      if (component.badge) {
        component.badge.show();
      }
      return this;
    },
    
    hideBadge() {
      if (component.badge) {
        component.badge.hide();
      }
      return this;
    },
    
    getBadgeComponent() {
      return component.badge;
    },
    
    destroy() {
      lifecycle.destroy();
    },
    
    updateLayoutStyle() {
      const hasText = !!component.text.getText();
      const hasIcon = !!component.icon.getIcon();
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
  });