// src/components/tabs/tab.ts
import { pipe } from '../../core/compose';
import { createBase } from '../../core/compose/component';
import { withEvents, withLifecycle } from '../../core/compose/features';
import { TabConfig, TabComponent } from './types';
import { TAB_STATES, TAB_LAYOUT } from './constants';
import { createTabConfig } from './config';
import createButton from '../button';
import createBadge from '../badge';

/**
 * Creates a new Tab component
 * @param {TabConfig} config - Tab configuration object
 * @returns {TabComponent} Tab component instance
 */
export const createTab = (config: TabConfig = {}): TabComponent => {
  const baseConfig = createTabConfig(config);
  
  try {
    // Create base component with events and lifecycle
    const baseComponent = pipe(
      createBase,
      withEvents(),
      withLifecycle()
    )(baseConfig);
    
    // Create a button for the tab
    const button = createButton({
      text: baseConfig.text,
      icon: baseConfig.icon,
      iconSize: baseConfig.iconSize,
      disabled: baseConfig.disabled,
      ripple: baseConfig.ripple,
      rippleConfig: baseConfig.rippleConfig,
      value: baseConfig.value,
      prefix: baseConfig.prefix,
      variant: 'text',
      class: `${baseConfig.prefix}-tab`
    });
    
    // Use the button element as our element
    baseComponent.element = button.element;
    
    // Set up tab accessibility attributes
    baseComponent.element.setAttribute('role', 'tab');
    baseComponent.element.setAttribute('aria-selected', 
      baseConfig.state === TAB_STATES.ACTIVE ? 'true' : 'false');
    
    // Add active state if specified in config
    if (baseConfig.state === TAB_STATES.ACTIVE) {
      baseComponent.element.classList.add(`${baseComponent.getClass('tab')}--${TAB_STATES.ACTIVE}`);
    }
    
    // Forward button events to our component
    button.on('click', (event) => {
      if (baseComponent.emit) {
        baseComponent.emit('click', event);
      }
    });
    
    // Create the tab component with enhanced API
    const tab = {
      ...baseComponent,
      button,
      element: button.element,
      
      // Basic badge support
      badge: null,
      
      // Tab state methods
      getValue() {
        return button.getValue();
      },
      
      setValue(value) {
        button.setValue(value);
        return this;
      },
      
      activate() {
        this.element.classList.add(`${this.getClass('tab')}--${TAB_STATES.ACTIVE}`);
        this.element.setAttribute('aria-selected', 'true');
        return this;
      },
      
      deactivate() {
        this.element.classList.remove(`${this.getClass('tab')}--${TAB_STATES.ACTIVE}`);
        this.element.setAttribute('aria-selected', 'false');
        return this;
      },
      
      isActive() {
        return this.element.classList.contains(`${this.getClass('tab')}--${TAB_STATES.ACTIVE}`);
      },
      
      enable() {
        button.enable();
        return this;
      },
      
      disable() {
        button.disable();
        return this;
      },
      
      setText(content) {
        button.setText(content);
        this.updateLayoutStyle();
        return this;
      },
      
      getText() {
        return button.getText();
      },
      
      setIcon(icon) {
        button.setIcon(icon);
        this.updateLayoutStyle();
        return this;
      },
      
      getIcon() {
        return button.getIcon();
      },
      
      // Badge methods - directly defined here to ensure they exist
      setBadge(content) {
        if (!this.badge) {
          const badgeConfig = {
            content,
            standalone: false,
            target: this.element,
            prefix: baseConfig.prefix
          };
          
          this.badge = createBadge(badgeConfig);
        } else {
          this.badge.setContent(content);
          this.badge.show();
        }
        
        return this;
      },
      
      getBadge() {
        return this.badge ? this.badge.getContent() : '';
      },
      
      showBadge() {
        if (this.badge) {
          this.badge.show();
        }
        return this;
      },
      
      hideBadge() {
        if (this.badge) {
          this.badge.hide();
        }
        return this;
      },
      
      getBadgeComponent() {
        return this.badge;
      },
      
      destroy() {
        if (this.badge) {
          this.badge.destroy();
        }
        
        if (button.destroy) {
          button.destroy();
        }
        
        baseComponent.lifecycle.destroy();
      },
      
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
          this.element.classList.remove(`${this.getClass('tab')}--${layout}`);
        });
        
        // Add the appropriate layout class
        this.element.classList.add(`${this.getClass('tab')}--${layoutClass}`);
      }
    };
    
    // Add badge if specified in config
    if (baseConfig.badge !== undefined) {
      tab.setBadge(baseConfig.badge);
    }
    
    // Initialize layout style based on content
    tab.updateLayoutStyle();
    
    return tab;
  } catch (error) {
    console.error('Tab creation error:', error);
    throw new Error(`Failed to create tab: ${(error as Error).message}`);
  }
};