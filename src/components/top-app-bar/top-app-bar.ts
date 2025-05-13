// src/components/top-app-bar/top-app-bar.ts
/**
 * @module components/top-app-bar
 * @description Top app bar implementation
 */

import { 
  createBase, 
  withElement, 
  withEvents, 
  withLifecycle,
  ElementComponent, 
  BaseComponent 
} from '../../core/compose';

import { createConfig } from './config';
import { TopAppBarConfig, TopAppBarType } from './types';

/**
 * Top app bar component interface
 */
export interface TopAppBar extends ElementComponent {
  /**
   * Sets the title of the top app bar
   * @param {string} title - Title text
   * @returns {TopAppBar} TopAppBar instance for chaining
   */
  setTitle: (title: string) => TopAppBar;
  
  /**
   * Gets the current title
   * @returns {string} Current title text
   */
  getTitle: () => string;
  
  /**
   * Adds a leading navigation icon or element
   * @param {HTMLElement} element - Element to add to the leading section
   * @returns {TopAppBar} TopAppBar instance for chaining
   */
  addLeadingElement: (element: HTMLElement) => TopAppBar;
  
  /**
   * Adds a trailing action icon or element
   * @param {HTMLElement} element - Element to add to the trailing section
   * @returns {TopAppBar} TopAppBar instance for chaining
   */
  addTrailingElement: (element: HTMLElement) => TopAppBar;
  
  /**
   * Changes the top app bar type
   * @param {TopAppBarType} type - New app bar type
   * @returns {TopAppBar} TopAppBar instance for chaining
   */
  setType: (type: TopAppBarType) => TopAppBar;
  
  /**
   * Manually sets the scrolled state
   * @param {boolean} scrolled - Whether to show the scrolled state
   * @returns {TopAppBar} TopAppBar instance for chaining
   */
  setScrollState: (scrolled: boolean) => TopAppBar;
  
  /**
   * Gets the headline element
   * @returns {HTMLElement} Headline element
   */
  getHeadlineElement: () => HTMLElement;
  
  /**
   * Gets the leading container element
   * @returns {HTMLElement} Leading container element
   */
  getLeadingContainer: () => HTMLElement;
  
  /**
   * Gets the trailing container element
   * @returns {HTMLElement} Trailing container element
   */
  getTrailingContainer: () => HTMLElement;
}

/**
 * Creates a top app bar component
 * 
 * @param {TopAppBarConfig} config - Configuration options
 * @returns {TopAppBar} Top app bar component instance
 */
export const createTopAppBar = (config: TopAppBarConfig = {}): TopAppBar => {
  // Process configuration with defaults
  const componentConfig = createConfig(config);
  
  // Create base component
  const component = createBase(componentConfig);
  
  // Create containers for the top app bar structure
  const createContainers = () => {
    // Leading section container
    const leadingContainer = document.createElement('div');
    leadingContainer.className = `${component.getClass('top-app-bar')}-leading`;

    // Headline element
    const headlineElement = document.createElement('h1');
    headlineElement.className = `${component.getClass('top-app-bar')}-headline`;
    if (componentConfig.title) {
      headlineElement.textContent = componentConfig.title;
    }

    // Trailing section container
    const trailingContainer = document.createElement('div');
    trailingContainer.className = `${component.getClass('top-app-bar')}-trailing`;
    
    return { leadingContainer, headlineElement, trailingContainer };
  };
  
  // Create the main containers
  const { leadingContainer, headlineElement, trailingContainer } = createContainers();
  
  // Determine initial classes based on type
  const getInitialClasses = () => {
    const classes = [componentConfig.class];
    
    // Add type class if not the default 'small' type
    if (componentConfig.type !== 'small') {
      classes.push(`${component.getClass('top-app-bar')}--${componentConfig.type}`);
    }
    
    // Add compressible class if enabled and type is medium or large
    if (componentConfig.compressible && 
        (componentConfig.type === 'medium' || componentConfig.type === 'large')) {
      classes.push(`${component.getClass('top-app-bar')}--compressible`);
    }
    
    return classes.filter(Boolean);
  };
  
  // Apply Element enhancer
  const enhancedComponent = withElement({
    tag: componentConfig.tag,
    componentName: 'top-app-bar',
    className: getInitialClasses(),
    attrs: {
      role: 'banner',
      'aria-label': 'Top app bar'
    },
    interactive: true
  })(component);
  
  // Apply events enhancer for component events
  const withEventsComponent = withEvents()(enhancedComponent);
  
  // Apply lifecycle enhancer for cleanup
  const withLifecycleComponent = withLifecycle()(withEventsComponent);
  
  // Create the DOM structure based on the type
  const setupDomStructure = () => {
    if (componentConfig.type === 'medium' || componentConfig.type === 'large') {
      // For medium and large, create rows
      const topRow = document.createElement('div');
      topRow.className = `${component.getClass('top-app-bar')}-row`;
      topRow.appendChild(leadingContainer);
      topRow.appendChild(trailingContainer);
      
      const bottomRow = document.createElement('div');
      bottomRow.className = `${component.getClass('top-app-bar')}-row`;
      bottomRow.appendChild(headlineElement);
      
      withLifecycleComponent.element.appendChild(topRow);
      withLifecycleComponent.element.appendChild(bottomRow);
    } else {
      // For small and center-aligned
      withLifecycleComponent.element.appendChild(leadingContainer);
      withLifecycleComponent.element.appendChild(headlineElement);
      withLifecycleComponent.element.appendChild(trailingContainer);
    }
  };
  
  // Set up the initial DOM structure
  setupDomStructure();
  
  // Track scrolled state
  let isScrolled = false;
  
  // Handle scrolling behavior if enabled
  if (componentConfig.scrollable) {
    const handleScroll = () => {
      const shouldBeScrolled = window.scrollY > componentConfig.scrollThreshold;
      
      if (isScrolled !== shouldBeScrolled) {
        isScrolled = shouldBeScrolled;
        
        // Toggle scrolled class
        if (isScrolled) {
          withLifecycleComponent.element.classList.add(`${component.getClass('top-app-bar')}--scrolled`);
        } else {
          withLifecycleComponent.element.classList.remove(`${component.getClass('top-app-bar')}--scrolled`);
        }
        
        // Call the onScroll callback if provided
        componentConfig.onScroll?.(isScrolled);
      }
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();
    
    // Clean up event listener on destroy
    const originalDestroy = withLifecycleComponent.lifecycle.destroy;
    withLifecycleComponent.lifecycle.destroy = () => {
      window.removeEventListener('scroll', handleScroll);
      originalDestroy();
    };
  }
  
  // Reorganize the DOM for the given type
  const reorganizeDom = (type: TopAppBarType) => {
    // Clear existing content
    while (withLifecycleComponent.element.firstChild) {
      withLifecycleComponent.element.removeChild(withLifecycleComponent.element.firstChild);
    }
    
    // Update component type class
    ['small', 'medium', 'large', 'center'].forEach(t => {
      withLifecycleComponent.element.classList.remove(`${component.getClass('top-app-bar')}--${t}`);
    });
    
    if (type !== 'small') {
      withLifecycleComponent.element.classList.add(`${component.getClass('top-app-bar')}--${type}`);
    }
    
    // Update compressible class
    withLifecycleComponent.element.classList.toggle(
      `${component.getClass('top-app-bar')}--compressible`,
      componentConfig.compressible && (type === 'medium' || type === 'large')
    );
    
    // Rebuild the DOM structure
    if (type === 'medium' || type === 'large') {
      // For medium and large, create rows
      const topRow = document.createElement('div');
      topRow.className = `${component.getClass('top-app-bar')}-row`;
      topRow.appendChild(leadingContainer);
      topRow.appendChild(trailingContainer);
      
      const bottomRow = document.createElement('div');
      bottomRow.className = `${component.getClass('top-app-bar')}-row`;
      bottomRow.appendChild(headlineElement);
      
      withLifecycleComponent.element.appendChild(topRow);
      withLifecycleComponent.element.appendChild(bottomRow);
    } else {
      // For small and center-aligned
      withLifecycleComponent.element.appendChild(leadingContainer);
      withLifecycleComponent.element.appendChild(headlineElement);
      withLifecycleComponent.element.appendChild(trailingContainer);
    }
  };
  
  // Create the top app bar interface
  const topAppBar: TopAppBar = {
    ...withLifecycleComponent,
    
    setTitle(title: string) {
      headlineElement.textContent = title;
      return this;
    },
    
    getTitle() {
      return headlineElement.textContent || '';
    },
    
    addLeadingElement(element: HTMLElement) {
      leadingContainer.appendChild(element);
      return this;
    },
    
    addTrailingElement(element: HTMLElement) {
      trailingContainer.appendChild(element);
      return this;
    },
    
    setType(type: TopAppBarType) {
      componentConfig.type = type;
      reorganizeDom(type);
      return this;
    },
    
    setScrollState(scrolled: boolean) {
      isScrolled = scrolled;
      
      if (scrolled) {
        this.element.classList.add(`${component.getClass('top-app-bar')}--scrolled`);
      } else {
        this.element.classList.remove(`${component.getClass('top-app-bar')}--scrolled`);
      }
      
      return this;
    },
    
    getHeadlineElement() {
      return headlineElement;
    },
    
    getLeadingContainer() {
      return leadingContainer;
    },
    
    getTrailingContainer() {
      return trailingContainer;
    }
  };
  
  return topAppBar;
};