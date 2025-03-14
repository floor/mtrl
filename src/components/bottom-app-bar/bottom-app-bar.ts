// src/components/bottom-app-bar/bottom-app-bar.ts
/**
 * @module components/bottom-app-bar
 * @description Bottom app bar implementation
 */

import { 
  createBase, 
  withElement, 
  withEvents, 
  withLifecycle,
  ElementComponent, 
  BaseComponent 
} from '../../core/compose';

import { createConfig, BottomAppBarConfig } from './config';

/**
 * Bottom app bar component interface
 */
export interface BottomAppBar extends ElementComponent {
  /**
   * Adds an action button to the bottom bar
   * @param {HTMLElement} button - Button element to add
   * @returns {BottomAppBar} BottomAppBar instance for chaining
   */
  addAction: (button: HTMLElement) => BottomAppBar;
  
  /**
   * Adds a floating action button to the bottom bar
   * @param {HTMLElement} fab - FAB element to add
   * @returns {BottomAppBar} BottomAppBar instance for chaining
   */
  addFab: (fab: HTMLElement) => BottomAppBar;
  
  /**
   * Shows the bottom bar
   * @returns {BottomAppBar} BottomAppBar instance for chaining
   */
  show: () => BottomAppBar;
  
  /**
   * Hides the bottom bar
   * @returns {BottomAppBar} BottomAppBar instance for chaining
   */
  hide: () => BottomAppBar;
  
  /**
   * Checks if the bottom bar is visible
   * @returns {boolean} Whether the bottom bar is visible
   */
  isVisible: () => boolean;

  /**
   * Get the actions container element
   * @returns {HTMLElement} Actions container element
   */
  getActionsContainer: () => HTMLElement;
}

/**
 * Creates a bottom app bar component
 * 
 * @param {BottomAppBarConfig} config - Configuration options
 * @returns {BottomAppBar} Bottom app bar component instance
 */
export const createBottomAppBar = (config: BottomAppBarConfig = {}): BottomAppBar => {
  // Process configuration with defaults
  const componentConfig = createConfig(config);
  
  // Create base component
  const component = createBase(componentConfig);
  
  // Create actions container 
  const actionsContainer = document.createElement('div');
  actionsContainer.className = `${component.getClass('bottom-app-bar')}-actions`;
  
  // FAB container for proper positioning
  const fabContainer = document.createElement('div');
  fabContainer.className = `${component.getClass('bottom-app-bar')}-fab-container`;
  
  // Apply Element enhancer
  const enhancedComponent = withElement({
    tag: componentConfig.tag,
    componentName: 'bottom-app-bar',
    className: [
      componentConfig.hasFab ? `${component.getClass('bottom-app-bar')}--with-fab` : '',
      componentConfig.fabPosition === 'center' ? `${component.getClass('bottom-app-bar')}--fab-center` : '',
      componentConfig.class
    ],
    attrs: {
      role: 'toolbar',
      'aria-label': 'Bottom app bar'
    },
    interactive: true
  })(component);
  
  // Apply events enhancer for component events
  const withEventsComponent = withEvents()(enhancedComponent);
  
  // Apply lifecycle enhancer for cleanup
  const withLifecycleComponent = withLifecycle()(withEventsComponent);
  
  // Append actions and FAB containers to the main element
  withLifecycleComponent.element.appendChild(actionsContainer);
  withLifecycleComponent.element.appendChild(fabContainer);
  
  // Flag to track visibility
  let isVisible = true;
  
  // Previous scroll position for determining scroll direction
  let prevScrollY = window.scrollY;
  
  // Handle scrolling behavior if autoHide is enabled
  if (componentConfig.autoHide) {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine scroll direction
      if (currentScrollY > prevScrollY + 10) {
        // Scrolling down - hide the bottom bar
        if (isVisible) {
          bottomBar.hide();
          componentConfig.onVisibilityChange?.(false);
        }
      } else if (currentScrollY < prevScrollY - 10) {
        // Scrolling up - show the bottom bar
        if (!isVisible) {
          bottomBar.show();
          componentConfig.onVisibilityChange?.(true);
        }
      }
      
      prevScrollY = currentScrollY;
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Clean up event listener on destroy
    const originalDestroy = withLifecycleComponent.lifecycle.destroy;
    withLifecycleComponent.lifecycle.destroy = () => {
      window.removeEventListener('scroll', handleScroll);
      originalDestroy();
    };
  }
  
  const bottomBar: BottomAppBar = {
    ...withLifecycleComponent,
    
    addAction(button: HTMLElement) {
      actionsContainer.appendChild(button);
      return this;
    },
    
    addFab(fab: HTMLElement) {
      // Clear existing FAB if any
      fabContainer.innerHTML = '';
      
      // Add the new FAB
      fabContainer.appendChild(fab);
      
      // Update component class to indicate it has a FAB
      this.element.classList.add(`${component.getClass('bottom-app-bar')}--with-fab`);
      
      return this;
    },
    
    show() {
      this.element.classList.remove(`${component.getClass('bottom-app-bar')}--hidden`);
      isVisible = true;
      return this;
    },
    
    hide() {
      this.element.classList.add(`${component.getClass('bottom-app-bar')}--hidden`);
      isVisible = false;
      return this;
    },
    
    isVisible() {
      return isVisible;
    },

    getActionsContainer() {
      return actionsContainer;
    }
  };
  
  // Set the appropriate styles for transitions if needed
  if (componentConfig.autoHide && componentConfig.transitionDuration) {
    bottomBar.element.style.transition = `transform ${componentConfig.transitionDuration}ms ease-in-out`;
  }
  
  return bottomBar;
};