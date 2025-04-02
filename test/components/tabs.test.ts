// test/components/tabs.test.ts
import { describe, test, expect } from 'bun:test';
import { 
  type TabComponent,
  type TabConfig,
  type TabsComponent,
  type TabsConfig,
  type TabsVariant,
  type TabStates
} from '../../src/components/tabs/types';

// Constants for tabs variants
const TABS_VARIANTS = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary'
} as const;

// Constants for tab states
const TAB_STATES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISABLED: 'disabled'
} as const;

// Mock tab implementation
const createMockTab = (config: TabConfig = {}): TabComponent => {
  // Create main element
  const element = document.createElement('button');
  element.className = 'mtrl-tab';
  element.type = 'button';
  
  // Default settings
  const settings = {
    state: config.state || TAB_STATES.INACTIVE,
    disabled: config.disabled || false,
    text: config.text || '',
    icon: config.icon || '',
    badge: config.badge || '',
    value: config.value || '',
    prefix: config.prefix || 'mtrl',
    componentName: config.componentName || 'tab',
    ripple: config.ripple !== undefined ? config.ripple : true,
    variant: config.variant || 'primary'
  };
  
  // Apply state class
  element.classList.add(`mtrl-tab--${settings.state}`);
  
  // Apply variant class
  element.classList.add(`mtrl-tab--${settings.variant}`);
  
  // Apply disabled state
  if (settings.disabled) {
    element.disabled = true;
    element.classList.add('mtrl-tab--disabled');
  }
  
  // Set value attribute
  if (settings.value) {
    element.setAttribute('data-value', settings.value);
  }
  
  // Apply additional classes
  if (config.class) {
    const classes = config.class.split(' ');
    classes.forEach(className => element.classList.add(className));
  }
  
  // Create container for content (used for layout)
  const contentContainer = document.createElement('div');
  contentContainer.className = 'mtrl-tab__content';
  
  // Create icon if provided
  let iconElement: HTMLElement | null = null;
  if (settings.icon) {
    iconElement = document.createElement('span');
    iconElement.className = 'mtrl-tab__icon';
    iconElement.innerHTML = settings.icon;
    
    if (config.iconSize) {
      iconElement.style.width = config.iconSize;
      iconElement.style.height = config.iconSize;
    }
    
    contentContainer.appendChild(iconElement);
  }
  
  // Create text element
  const textElement = document.createElement('span');
  textElement.className = 'mtrl-tab__text';
  if (settings.text) {
    textElement.textContent = settings.text;
  }
  contentContainer.appendChild(textElement);
  
  // Add content container to tab
  element.appendChild(contentContainer);
  
  // Create ripple element if enabled
  if (settings.ripple) {
    const ripple = document.createElement('span');
    ripple.className = 'mtrl-tab__ripple';
    element.appendChild(ripple);
  }
  
  // Badge component and elements
  let badgeComponent: any = undefined;
  let badgeElement: HTMLElement | null = null;
  
  // Create badge if configured
  if (settings.badge) {
    badgeElement = document.createElement('span');
    badgeElement.className = 'mtrl-badge';
    badgeElement.textContent = settings.badge.toString();
    element.appendChild(badgeElement);
    
    // Simple mock badge component
    badgeComponent = {
      element: badgeElement,
      setValue: (value: string | number) => {
        badgeElement!.textContent = value.toString();
        return badgeComponent;
      },
      getValue: () => badgeElement!.textContent || '',
      show: () => {
        badgeElement!.style.display = '';
        return badgeComponent;
      },
      hide: () => {
        badgeElement!.style.display = 'none';
        return badgeComponent;
      }
    };
  }
  
  // Track event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  // Icon API
  const iconAPI = {
    setIcon: (html: string) => {
      settings.icon = html;
      
      if (html) {
        if (!iconElement) {
          iconElement = document.createElement('span');
          iconElement.className = 'mtrl-tab__icon';
          contentContainer.insertBefore(iconElement, contentContainer.firstChild);
        }
        
        iconElement.innerHTML = html;
      } else if (iconElement) {
        iconElement.remove();
        iconElement = null;
      }
      
      return iconAPI;
    },
    
    getIcon: () => settings.icon,
    
    getElement: () => iconElement
  };
  
  // Text API
  const textAPI = {
    setText: (content: string) => {
      settings.text = content;
      textElement.textContent = content;
      return textAPI;
    },
    
    getText: () => settings.text,
    
    getElement: () => textElement
  };
  
  // Create the tab component
  const tab: TabComponent = {
    element,
    badge: badgeComponent,
    
    getClass: (name: string) => {
      const prefix = settings.prefix;
      return name ? `${prefix}-${name}` : `${prefix}-tab`;
    },
    
    getValue: () => settings.value,
    
    setValue: (value: string) => {
      settings.value = value;
      element.setAttribute('data-value', value);
      return tab;
    },
    
    activate: () => {
      // Remove current state class
      element.classList.remove(`mtrl-tab--${settings.state}`);
      
      // Set new state
      settings.state = TAB_STATES.ACTIVE;
      element.classList.add(`mtrl-tab--${settings.state}`);
      
      return tab;
    },
    
    deactivate: () => {
      // Remove current state class
      element.classList.remove(`mtrl-tab--${settings.state}`);
      
      // Set new state
      settings.state = TAB_STATES.INACTIVE;
      element.classList.add(`mtrl-tab--${settings.state}`);
      
      return tab;
    },
    
    isActive: () => settings.state === TAB_STATES.ACTIVE,
    
    enable: () => {
      if (settings.disabled) {
        settings.disabled = false;
        element.disabled = false;
        element.classList.remove('mtrl-tab--disabled');
      }
      
      return tab;
    },
    
    disable: () => {
      if (!settings.disabled) {
        settings.disabled = true;
        element.disabled = true;
        element.classList.add('mtrl-tab--disabled');
      }
      
      return tab;
    },
    
    setText: (content: string) => {
      textAPI.setText(content);
      return tab;
    },
    
    getText: () => textAPI.getText(),
    
    setIcon: (icon: string) => {
      iconAPI.setIcon(icon);
      return tab;
    },
    
    getIcon: () => iconAPI.getIcon(),
    
    setBadge: (content: string | number) => {
      settings.badge = content;
      
      if (!badgeComponent) {
        badgeElement = document.createElement('span');
        badgeElement.className = 'mtrl-badge';
        element.appendChild(badgeElement);
        
        badgeComponent = {
          element: badgeElement,
          setValue: (value: string | number) => {
            badgeElement!.textContent = value.toString();
            return badgeComponent;
          },
          getValue: () => badgeElement!.textContent || '',
          show: () => {
            badgeElement!.style.display = '';
            return badgeComponent;
          },
          hide: () => {
            badgeElement!.style.display = 'none';
            return badgeComponent;
          }
        };
        
        tab.badge = badgeComponent;
      }
      
      badgeComponent.setValue(content);
      
      return tab;
    },
    
    getBadge: () => {
      return badgeComponent ? badgeComponent.getValue() : '';
    },
    
    showBadge: () => {
      if (badgeComponent) {
        badgeComponent.show();
      }
      
      return tab;
    },
    
    hideBadge: () => {
      if (badgeComponent) {
        badgeComponent.hide();
      }
      
      return tab;
    },
    
    getBadgeComponent: () => badgeComponent,
    
    updateLayoutStyle: () => {
      // Adjust layout based on content
      if (settings.icon && settings.text) {
        element.classList.add('mtrl-tab--with-icon-and-text');
      } else if (settings.icon) {
        element.classList.add('mtrl-tab--icon-only');
      } else if (settings.text) {
        element.classList.add('mtrl-tab--text-only');
      }
    },
    
    on: (event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      
      eventHandlers[event].push(handler);
      
      element.addEventListener(event, handler as EventListener);
      return tab;
    },
    
    off: (event: string, handler: Function) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      
      element.removeEventListener(event, handler as EventListener);
      return tab;
    },
    
    destroy: () => {
      // Remove element from DOM if it has a parent
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Remove event listeners
      for (const event in eventHandlers) {
        eventHandlers[event].forEach(handler => {
          element.removeEventListener(event, handler as EventListener);
        });
        
        eventHandlers[event] = [];
      }
    },
    
    disabled: {
      enable: () => {
        if (settings.disabled) {
          settings.disabled = false;
          element.disabled = false;
          element.classList.remove('mtrl-tab--disabled');
        }
      },
      
      disable: () => {
        if (!settings.disabled) {
          settings.disabled = true;
          element.disabled = true;
          element.classList.add('mtrl-tab--disabled');
        }
      },
      
      isDisabled: () => settings.disabled
    },
    
    lifecycle: {
      destroy: () => {
        tab.destroy();
      }
    }
  };
  
  // Update layout style based on content
  tab.updateLayoutStyle();
  
  return tab;
};

// Mock tabs implementation
const createMockTabs = (config: TabsConfig = {}): TabsComponent => {
  // Create main container element
  const element = document.createElement('div');
  element.className = 'mtrl-tabs';
  
  // Default settings
  const settings = {
    variant: config.variant || TABS_VARIANTS.PRIMARY,
    showDivider: config.showDivider !== undefined ? config.showDivider : true,
    scrollable: config.scrollable !== undefined ? config.scrollable : true,
    prefix: config.prefix || 'mtrl',
    tabs: []
  };
  
  // Apply variant class
  element.classList.add(`mtrl-tabs--${settings.variant}`);
  
  // Apply scrollable class if enabled
  if (settings.scrollable) {
    element.classList.add('mtrl-tabs--scrollable');
  }
  
  // Apply additional classes
  if (config.class) {
    const classes = config.class.split(' ');
    classes.forEach(className => element.classList.add(className));
  }
  
  // Create tabs container
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'mtrl-tabs__container';
  
  // Create scroll container if scrollable
  let scrollContainer: HTMLElement | undefined;
  if (settings.scrollable) {
    scrollContainer = document.createElement('div');
    scrollContainer.className = 'mtrl-tabs__scroll-container';
    element.appendChild(scrollContainer);
    scrollContainer.appendChild(tabsContainer);
  } else {
    element.appendChild(tabsContainer);
  }
  
  // Create divider if enabled
  if (settings.showDivider) {
    const divider = document.createElement('div');
    divider.className = 'mtrl-tabs__divider';
    element.appendChild(divider);
  }
  
  // Create indicator element
  const indicator = document.createElement('div');
  indicator.className = 'mtrl-tabs__indicator';
  tabsContainer.appendChild(indicator);
  
  // Simple mock indicator component
  const indicatorComponent = {
    element: indicator,
    updatePosition: (targetTab: TabComponent) => {
      // Set indicator position to match the active tab
      if (targetTab.element.offsetLeft !== undefined) {
        indicator.style.left = `${targetTab.element.offsetLeft}px`;
        indicator.style.width = `${targetTab.element.offsetWidth}px`;
      }
    },
    hide: () => {
      indicator.style.opacity = '0';
    },
    show: () => {
      indicator.style.opacity = '1';
    }
  };
  
  // Track tabs and event handlers
  const tabs: TabComponent[] = [];
  const eventHandlers: Record<string, Function[]> = {};
  
  // Emit an event
  const emit = (event: string, data?: any) => {
    if (eventHandlers[event]) {
      eventHandlers[event].forEach(handler => handler(data));
    }
    
    // Call the on.change callback from config if available
    if (event === 'change' && config.on?.change) {
      config.on.change(data);
    }
  };
  
  // Handle tab click
  const handleTabClick = (event: Event, tab: TabComponent) => {
    if (tab.disabled?.isDisabled()) {
      return;
    }
    
    // Set as active tab
    tabs.forEach(t => t.deactivate());
    tab.activate();
    
    // Update indicator position
    indicatorComponent.updatePosition(tab);
    
    // Emit change event
    emit('change', { tab, value: tab.getValue() });
  };
  
  // Create the tabs component
  const tabsComponent: TabsComponent = {
    element,
    scrollContainer,
    
    addTab: (config: TabConfig) => {
      // Set variant from tabs component
      config.variant = settings.variant;
      
      // Create the tab
      const tab = createMockTab(config);
      
      // Add tab to container
      tabsContainer.appendChild(tab.element);
      
      // Add click event handler
      tab.element.addEventListener('click', (event) => {
        tabsComponent.handleTabClick(event, tab);
      });
      
      // Add to tabs array
      tabs.push(tab);
      
      // If this is the first tab with active state, position the indicator
      if (tab.isActive()) {
        indicatorComponent.updatePosition(tab);
      }
      
      return tab;
    },
    
    add: (tab: TabComponent) => {
      // Add tab to container
      tabsContainer.appendChild(tab.element);
      
      // Add click event handler
      tab.element.addEventListener('click', (event) => {
        tabsComponent.handleTabClick(event, tab);
      });
      
      // Add to tabs array
      tabs.push(tab);
      
      // If this is an active tab, position the indicator
      if (tab.isActive()) {
        indicatorComponent.updatePosition(tab);
      }
      
      return tabsComponent;
    },
    
    getTabs: () => [...tabs],
    
    getActiveTab: () => {
      return tabs.find(tab => tab.isActive()) || null;
    },
    
    getIndicator: () => indicatorComponent,
    
    setActiveTab: (tabOrValue: TabComponent | string) => {
      let targetTab: TabComponent | undefined;
      
      if (typeof tabOrValue === 'string') {
        // Find tab by value
        targetTab = tabs.find(tab => tab.getValue() === tabOrValue);
      } else {
        // Tab component provided directly
        targetTab = tabOrValue;
      }
      
      if (targetTab && !targetTab.disabled?.isDisabled()) {
        // Deactivate all tabs
        tabs.forEach(tab => tab.deactivate());
        
        // Activate the target tab
        targetTab.activate();
        
        // Update indicator position
        indicatorComponent.updatePosition(targetTab);
        
        // Emit change event
        emit('change', { tab: targetTab, value: targetTab.getValue() });
      }
      
      return tabsComponent;
    },
    
    removeTab: (tabOrValue: TabComponent | string) => {
      let targetTabIndex = -1;
      let targetTab: TabComponent | undefined;
      
      if (typeof tabOrValue === 'string') {
        // Find tab by value
        targetTabIndex = tabs.findIndex(tab => tab.getValue() === tabOrValue);
        if (targetTabIndex !== -1) {
          targetTab = tabs[targetTabIndex];
        }
      } else {
        // Tab component provided directly
        targetTabIndex = tabs.indexOf(tabOrValue);
        targetTab = tabOrValue;
      }
      
      if (targetTabIndex !== -1 && targetTab) {
        // Check if this is the active tab
        const wasActive = targetTab.isActive();
        
        // Remove tab from the DOM
        targetTab.destroy();
        
        // Remove from tabs array
        tabs.splice(targetTabIndex, 1);
        
        // If removed tab was active, activate the first remaining tab
        if (wasActive && tabs.length > 0) {
          tabsComponent.setActiveTab(tabs[0]);
        } else if (tabs.length === 0) {
          // No tabs left, hide the indicator
          indicatorComponent.hide();
        }
      }
      
      return tabsComponent;
    },
    
    on: (event: string, handler: Function) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      
      eventHandlers[event].push(handler);
      return tabsComponent;
    },
    
    off: (event: string, handler: Function) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      
      return tabsComponent;
    },
    
    emit: (event: string, data: any) => {
      emit(event, data);
      return tabsComponent;
    },
    
    destroy: () => {
      // Clean up tabs
      tabs.forEach(tab => tab.destroy());
      tabs.length = 0;
      
      // Remove element from DOM if it has a parent
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Clear event handlers
      for (const event in eventHandlers) {
        eventHandlers[event] = [];
      }
    },
    
    handleTabClick
  };
  
  // Initialize tabs from config
  if (config.tabs) {
    config.tabs.forEach(tabConfig => {
      // Set variant from tabs component
      tabConfig.variant = settings.variant;
      
      tabsComponent.addTab(tabConfig);
    });
  }
  
  return tabsComponent;
};

describe('Tab Component', () => {
  test('should create a tab element', () => {
    const tab = createMockTab({
      text: 'Home',
      value: 'home'
    });
    
    expect(tab.element).toBeDefined();
    expect(tab.element.tagName).toBe('BUTTON');
    expect(tab.element.className).toContain('mtrl-tab');
    
    const textElement = tab.element.querySelector('.mtrl-tab__text');
    expect(textElement).toBeDefined();
    expect(textElement?.textContent).toBe('Home');
    
    expect(tab.element.getAttribute('data-value')).toBe('home');
  });
  
  test('should apply inactive state by default', () => {
    const tab = createMockTab();
    expect(tab.element.className).toContain('mtrl-tab--inactive');
    expect(tab.isActive()).toBe(false);
  });
  
  test('should apply active state when configured', () => {
    const tab = createMockTab({
      state: TAB_STATES.ACTIVE
    });
    
    expect(tab.element.className).toContain('mtrl-tab--active');
    expect(tab.isActive()).toBe(true);
  });
  
  test('should apply disabled state when configured', () => {
    const tab = createMockTab({
      disabled: true
    });
    
    expect(tab.element.disabled).toBe(true);
    expect(tab.element.className).toContain('mtrl-tab--disabled');
    expect(tab.disabled?.isDisabled()).toBe(true);
  });
  
  test('should render icon when provided', () => {
    const iconHtml = '<svg>home</svg>';
    const tab = createMockTab({
      icon: iconHtml
    });
    
    const iconElement = tab.element.querySelector('.mtrl-tab__icon');
    expect(iconElement).toBeDefined();
    expect(iconElement?.innerHTML).toBe(iconHtml);
    expect(tab.getIcon()).toBe(iconHtml);
  });
  
  test('should apply custom icon size', () => {
    const tab = createMockTab({
      icon: '<svg>home</svg>',
      iconSize: '32px'
    });
    
    const iconElement = tab.element.querySelector('.mtrl-tab__icon') as HTMLElement;
    expect(iconElement.style.width).toBe('32px');
    expect(iconElement.style.height).toBe('32px');
  });
  
  test('should create badge when configured', () => {
    const tab = createMockTab({
      badge: '5'
    });
    
    expect(tab.badge).toBeDefined();
    
    const badgeElement = tab.element.querySelector('.mtrl-badge');
    expect(badgeElement).toBeDefined();
    expect(badgeElement?.textContent).toBe('5');
    expect(tab.getBadge()).toBe('5');
  });
  
  test('should create ripple by default', () => {
    const tab = createMockTab();
    
    const ripple = tab.element.querySelector('.mtrl-tab__ripple');
    expect(ripple).toBeDefined();
  });
  
  test('should not create ripple when disabled', () => {
    const tab = createMockTab({
      ripple: false
    });
    
    const ripple = tab.element.querySelector('.mtrl-tab__ripple');
    expect(ripple).toBeNull();
  });
  
  test('should activate and deactivate', () => {
    const tab = createMockTab();
    
    expect(tab.isActive()).toBe(false);
    expect(tab.element.className).toContain('mtrl-tab--inactive');
    
    tab.activate();
    
    expect(tab.isActive()).toBe(true);
    expect(tab.element.className).toContain('mtrl-tab--active');
    expect(tab.element.className).not.toContain('mtrl-tab--inactive');
    
    tab.deactivate();
    
    expect(tab.isActive()).toBe(false);
    expect(tab.element.className).toContain('mtrl-tab--inactive');
    expect(tab.element.className).not.toContain('mtrl-tab--active');
  });
  
  test('should enable and disable', () => {
    const tab = createMockTab({
      disabled: true
    });
    
    expect(tab.disabled?.isDisabled()).toBe(true);
    expect(tab.element.disabled).toBe(true);
    
    tab.enable();
    
    expect(tab.disabled?.isDisabled()).toBe(false);
    expect(tab.element.disabled).toBe(false);
    expect(tab.element.className).not.toContain('mtrl-tab--disabled');
    
    tab.disable();
    
    expect(tab.disabled?.isDisabled()).toBe(true);
    expect(tab.element.disabled).toBe(true);
    expect(tab.element.className).toContain('mtrl-tab--disabled');
  });
  
  test('should update text content', () => {
    const tab = createMockTab({
      text: 'Initial'
    });
    
    expect(tab.getText()).toBe('Initial');
    
    tab.setText('Updated');
    
    expect(tab.getText()).toBe('Updated');
    
    const textElement = tab.element.querySelector('.mtrl-tab__text');
    expect(textElement?.textContent).toBe('Updated');
  });
  
  test('should update icon', () => {
    const tab = createMockTab();
    
    expect(tab.getIcon()).toBe('');
    
    const iconHtml = '<svg>home</svg>';
    tab.setIcon(iconHtml);
    
    expect(tab.getIcon()).toBe(iconHtml);
    
    const iconElement = tab.element.querySelector('.mtrl-tab__icon');
    expect(iconElement).toBeDefined();
    expect(iconElement?.innerHTML).toBe(iconHtml);
  });
  
  test('should update badge', () => {
    const tab = createMockTab();
    
    expect(tab.getBadge()).toBe('');
    expect(tab.badge).toBeUndefined();
    
    tab.setBadge('5');
    
    expect(tab.getBadge()).toBe('5');
    expect(tab.badge).toBeDefined();
    
    const badgeElement = tab.element.querySelector('.mtrl-badge');
    expect(badgeElement).toBeDefined();
    expect(badgeElement?.textContent).toBe('5');
    
    // Update existing badge
    tab.setBadge('10');
    
    expect(tab.getBadge()).toBe('10');
    expect(badgeElement?.textContent).toBe('10');
  });
  
  test('should show and hide badge', () => {
    const tab = createMockTab({
      badge: '5'
    });
    
    const badgeElement = tab.element.querySelector('.mtrl-badge') as HTMLElement;
    expect(badgeElement.style.display).not.toBe('none');
    
    tab.hideBadge();
    
    expect(badgeElement.style.display).toBe('none');
    
    tab.showBadge();
    
    expect(badgeElement.style.display).not.toBe('none');
  });
  
  test('should get badge component', () => {
    const tab = createMockTab({
      badge: '5'
    });
    
    const badgeComponent = tab.getBadgeComponent();
    expect(badgeComponent).toBeDefined();
    expect(badgeComponent).toBe(tab.badge);
  });
  
  test('should apply layout styles based on content', () => {
    // Tab with both icon and text
    const tabWithBoth = createMockTab({
      icon: '<svg>home</svg>',
      text: 'Home'
    });
    expect(tabWithBoth.element.className).toContain('mtrl-tab--with-icon-and-text');
    
    // Tab with only icon
    const tabWithIcon = createMockTab({
      icon: '<svg>home</svg>'
    });
    expect(tabWithIcon.element.className).toContain('mtrl-tab--icon-only');
    
    // Tab with only text
    const tabWithText = createMockTab({
      text: 'Home'
    });
    expect(tabWithText.element.className).toContain('mtrl-tab--text-only');
  });
  
  test('should add event listeners', () => {
    const tab = createMockTab();
    let clicked = false;
    
    tab.on('click', () => {
      clicked = true;
    });
    
    // Simulate click
    tab.element.dispatchEvent(new Event('click'));
    
    expect(clicked).toBe(true);
  });
  
  test('should remove event listeners', () => {
    const tab = createMockTab();
    let count = 0;
    
    const handler = () => {
      count++;
    };
    
    tab.on('click', handler);
    
    // First click
    tab.element.dispatchEvent(new Event('click'));
    expect(count).toBe(1);
    
    // Remove listener
    tab.off('click', handler);
    
    // Second click
    tab.element.dispatchEvent(new Event('click'));
    expect(count).toBe(1); // Count should not increase
  });
  
  test('should be properly destroyed', () => {
    const tab = createMockTab();
    document.body.appendChild(tab.element);
    
    expect(document.body.contains(tab.element)).toBe(true);
    
    tab.destroy();
    
    expect(document.body.contains(tab.element)).toBe(false);
  });
});

describe('Tabs Component', () => {
  test('should create a tabs container', () => {
    const tabs = createMockTabs();
    
    expect(tabs.element).toBeDefined();
    expect(tabs.element.tagName).toBe('DIV');
    expect(tabs.element.className).toContain('mtrl-tabs');
    
    const container = tabs.element.querySelector('.mtrl-tabs__container');
    expect(container).toBeDefined();
    
    const indicator = tabs.element.querySelector('.mtrl-tabs__indicator');
    expect(indicator).toBeDefined();
  });
  
  test('should apply primary variant by default', () => {
    const tabs = createMockTabs();
    expect(tabs.element.className).toContain('mtrl-tabs--primary');
  });
  
  test('should apply different variants', () => {
    const variants: TabsVariant[] = [
      TABS_VARIANTS.PRIMARY,
      TABS_VARIANTS.SECONDARY
    ];
    
    variants.forEach(variant => {
      const tabs = createMockTabs({ variant });
      expect(tabs.element.className).toContain(`mtrl-tabs--${variant}`);
    });
  });
  
  test('should create divider by default', () => {
    const tabs = createMockTabs();
    
    const divider = tabs.element.querySelector('.mtrl-tabs__divider');
    expect(divider).toBeDefined();
  });
  
  test('should not create divider when configured', () => {
    const tabs = createMockTabs({
      showDivider: false
    });
    
    const divider = tabs.element.querySelector('.mtrl-tabs__divider');
    expect(divider).toBeNull();
  });
  
  test('should be scrollable by default', () => {
    const tabs = createMockTabs();
    
    expect(tabs.element.className).toContain('mtrl-tabs--scrollable');
    expect(tabs.scrollContainer).toBeDefined();
  });
  
  test('should not be scrollable when configured', () => {
    const tabs = createMockTabs({
      scrollable: false
    });
    
    expect(tabs.element.className).not.toContain('mtrl-tabs--scrollable');
    expect(tabs.scrollContainer).toBeUndefined();
  });
  
  test('should create and add a tab', () => {
    const tabs = createMockTabs();
    
    const tab = tabs.addTab({
      text: 'Home',
      value: 'home'
    });
    
    expect(tab).toBeDefined();
    expect(tab.element.tagName).toBe('BUTTON');
    expect(tab.element.className).toContain('mtrl-tab');
    expect(tab.getText()).toBe('Home');
    
    // Check that tab was added to the container
    const container = tabs.element.querySelector('.mtrl-tabs__container');
    expect(container?.contains(tab.element)).toBe(true);
    
    // Check that tab was added to the internal tabs array
    expect(tabs.getTabs().length).toBe(1);
    expect(tabs.getTabs()[0]).toBe(tab);
  });
  
  test('should add a pre-created tab', () => {
    const tabs = createMockTabs();
    const tab = createMockTab({
      text: 'Home',
      value: 'home'
    });
    
    tabs.add(tab);
    
    // Check that tab was added to the container
    const container = tabs.element.querySelector('.mtrl-tabs__container');
    expect(container?.contains(tab.element)).toBe(true);
    
    // Check that tab was added to the internal tabs array
    expect(tabs.getTabs().length).toBe(1);
    expect(tabs.getTabs()[0]).toBe(tab);
  });
  
  test('should create tabs from config', () => {
    const tabs = createMockTabs({
      tabs: [
        { text: 'Home', value: 'home' },
        { text: 'About', value: 'about' },
        { text: 'Contact', value: 'contact' }
      ]
    });
    
    expect(tabs.getTabs().length).toBe(3);
    
    const tabElements = tabs.element.querySelectorAll('.mtrl-tab');
    expect(tabElements.length).toBe(3);
    
    expect(tabs.getTabs()[0].getText()).toBe('Home');
    expect(tabs.getTabs()[1].getText()).toBe('About');
    expect(tabs.getTabs()[2].getText()).toBe('Contact');
  });
  
  test('should get active tab', () => {
    const tabs = createMockTabs({
      tabs: [
        { text: 'Home', value: 'home', state: TAB_STATES.ACTIVE },
        { text: 'About', value: 'about' },
        { text: 'Contact', value: 'contact' }
      ]
    });
    
    const activeTab = tabs.getActiveTab();
    expect(activeTab).toBeDefined();
    expect(activeTab?.getText()).toBe('Home');
    expect(activeTab?.getValue()).toBe('home');
  });
  
  test('should return null for getActiveTab when no tab is active', () => {
    const tabs = createMockTabs({
      tabs: [
        { text: 'Home', value: 'home' },
        { text: 'About', value: 'about' }
      ]
    });
    
    const activeTab = tabs.getActiveTab();
    expect(activeTab).toBeNull();
  });
  
  test('should get indicator component', () => {
    const tabs = createMockTabs();
    
    const indicator = tabs.getIndicator?.();
    expect(indicator).toBeDefined();
    expect(indicator?.element).toBeDefined();
    expect(indicator?.element.className).toContain('mtrl-tabs__indicator');
  });
  
  test('should set active tab by tab reference', () => {
    const tabs = createMockTabs({
      tabs: [
        { text: 'Home', value: 'home' },
        { text: 'About', value: 'about' },
        { text: 'Contact', value: 'contact' }
      ]
    });
    
    const tab = tabs.getTabs()[1]; // About tab
    tabs.setActiveTab(tab);
    
    // Check active tab
    const activeTab = tabs.getActiveTab();
    expect(activeTab).toBe(tab);
    expect(activeTab?.getText()).toBe('About');
    
    // Check that only one tab is active
    const activeTabs = tabs.getTabs().filter(t => t.isActive());
    expect(activeTabs.length).toBe(1);
  });
  
  test('should set active tab by value', () => {
    const tabs = createMockTabs({
      tabs: [
        { text: 'Home', value: 'home' },
        { text: 'About', value: 'about' },
        { text: 'Contact', value: 'contact' }
      ]
    });
    
    tabs.setActiveTab('contact');
    
    // Check active tab
    const activeTab = tabs.getActiveTab();
    expect(activeTab).toBeDefined();
    expect(activeTab?.getText()).toBe('Contact');
    expect(activeTab?.getValue()).toBe('contact');
  });
  
  test('should not activate disabled tabs', () => {
    const tabs = createMockTabs({
      tabs: [
        { text: 'Home', value: 'home' },
        { text: 'About', value: 'about', disabled: true }
      ]
    });
    
    tabs.setActiveTab('about');
    
    // Check that no tab is active
    const activeTab = tabs.getActiveTab();
    expect(activeTab).toBeNull();
  });
  
  test('should emit change event when setting active tab', () => {
    const tabs = createMockTabs({
      tabs: [
        { text: 'Home', value: 'home' },
        { text: 'About', value: 'about' }
      ]
    });
    
    let eventFired = false;
    let eventData: any = null;
    
    tabs.on('change', (data) => {
      eventFired = true;
      eventData = data;
    });
    
    tabs.setActiveTab('about');
    
    expect(eventFired).toBe(true);
    expect(eventData).toBeDefined();
    expect(eventData.value).toBe('about');
    expect(eventData.tab).toBeDefined();
    expect(eventData.tab.getText()).toBe('About');
  });
  
  test('should call change callback from config', () => {
    let callbackFired = false;
    let callbackData: any = null;
    
    const tabs = createMockTabs({
      tabs: [
        { text: 'Home', value: 'home' },
        { text: 'About', value: 'about' }
      ],
      on: {
        change: (data) => {
          callbackFired = true;
          callbackData = data;
        }
      }
    });
    
    tabs.setActiveTab('about');
    
    expect(callbackFired).toBe(true);
    expect(callbackData).toBeDefined();
    expect(callbackData.value).toBe('about');
  });
  
  test('should remove tab by reference', () => {
    const tabs = createMockTabs({
      tabs: [
        { text: 'Home', value: 'home' },
        { text: 'About', value: 'about' },
        { text: 'Contact', value: 'contact' }
      ]
    });
    
    expect(tabs.getTabs().length).toBe(3);
    
    const tab = tabs.getTabs()[1]; // About tab
    tabs.removeTab(tab);
    
    expect(tabs.getTabs().length).toBe(2);
    expect(tabs.getTabs()[0].getText()).toBe('Home');
    expect(tabs.getTabs()[1].getText()).toBe('Contact');
    
    // The tab element should be removed from the DOM
    const container = tabs.element.querySelector('.mtrl-tabs__container');
    expect(container?.contains(tab.element)).toBe(false);
  });
  
  test('should remove tab by value', () => {
    const tabs = createMockTabs({
      tabs: [
        { text: 'Home', value: 'home' },
        { text: 'About', value: 'about' },
        { text: 'Contact', value: 'contact' }
      ]
    });
    
    expect(tabs.getTabs().length).toBe(3);
    
    tabs.removeTab('about');
    
    expect(tabs.getTabs().length).toBe(2);
    expect(tabs.getTabs()[0].getText()).toBe('Home');
    expect(tabs.getTabs()[1].getText()).toBe('Contact');
  });
  
  test('should activate another tab when removing the active tab', () => {
    const tabs = createMockTabs({
      tabs: [
        { text: 'Home', value: 'home', state: TAB_STATES.ACTIVE },
        { text: 'About', value: 'about' },
        { text: 'Contact', value: 'contact' }
      ]
    });
    
    // Remove the active tab
    tabs.removeTab('home');
    
    // First remaining tab should become active
    const activeTab = tabs.getActiveTab();
    expect(activeTab).toBeDefined();
    expect(activeTab?.getText()).toBe('About');
  });
  
  test('should handle tab click', () => {
    const tabs = createMockTabs({
      tabs: [
        { text: 'Home', value: 'home' },
        { text: 'About', value: 'about' }
      ]
    });
    
    let eventFired = false;
    
    tabs.on('change', () => {
      eventFired = true;
    });
    
    // Simulate click on the first tab
    const firstTab = tabs.getTabs()[0];
    firstTab.element.dispatchEvent(new Event('click'));
    
    expect(eventFired).toBe(true);
    expect(firstTab.isActive()).toBe(true);
  });
  
  test('should not respond to click on disabled tab', () => {
    const tabs = createMockTabs({
      tabs: [
        { text: 'Home', value: 'home' },
        { text: 'About', value: 'about', disabled: true }
      ]
    });
    
    let eventFired = false;
    
    tabs.on('change', () => {
      eventFired = true;
    });
    
    // Set first tab as active
    tabs.setActiveTab('home');
    eventFired = false; // Reset flag
    
    // Simulate click on disabled tab
    const disabledTab = tabs.getTabs()[1];
    disabledTab.element.dispatchEvent(new Event('click'));
    
    expect(eventFired).toBe(false);
    expect(disabledTab.isActive()).toBe(false);
    expect(tabs.getActiveTab()?.getValue()).toBe('home'); // Still active
  });
  
  test('should add and remove event listeners', () => {
    const tabs = createMockTabs();
    let eventCount = 0;
    
    const handler = () => {
      eventCount++;
    };
    
    tabs.on('change', handler);
    
    // Trigger event
    tabs.emit?.('change', {});
    expect(eventCount).toBe(1);
    
    // Remove listener
    tabs.off('change', handler);
    
    // Trigger event again
    tabs.emit?.('change', {});
    expect(eventCount).toBe(1); // Count should not increase
  });
  
  test('should be properly destroyed', () => {
    const tabs = createMockTabs({
      tabs: [
        { text: 'Home', value: 'home' },
        { text: 'About', value: 'about' }
      ]
    });
    
    document.body.appendChild(tabs.element);
    
    expect(document.body.contains(tabs.element)).toBe(true);
    expect(tabs.getTabs().length).toBe(2);
    
    tabs.destroy();
    
    expect(document.body.contains(tabs.element)).toBe(false);
    expect(tabs.getTabs().length).toBe(0);
  });
});