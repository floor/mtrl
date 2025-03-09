// src/components/tabs/scroll-indicators.ts
import { TabsComponent } from './types';

/**
 * Configuration for scroll indicators
 */
export interface ScrollIndicatorConfig {
  /** Whether to show scroll indicators */
  enabled?: boolean;
  /** Whether to add scroll buttons */
  showButtons?: boolean;
  /** Scroll indicator appearance */
  appearance?: 'fade' | 'shadow';
}

/**
 * Adds scroll indicators to a tabs component
 * @param tabs - Tabs component to enhance
 * @param config - Scroll indicator configuration
 */
export const addScrollIndicators = (
  tabs: TabsComponent,
  config: ScrollIndicatorConfig = {}
): void => {
  const { 
    enabled = true, 
    showButtons = false, 
    appearance = 'fade' 
  } = config;
  
  if (!enabled) return;
  
  // Find scroll container
  const scrollContainer = tabs.element.querySelector(`.${tabs.getClass('tabs')}-scroll`);
  if (!scrollContainer) return;
  
  // Add indicator elements
  const leftIndicator = document.createElement('div');
  leftIndicator.className = `${tabs.getClass('tabs')}-scroll-indicator ${tabs.getClass('tabs')}-scroll-indicator--left`;
  leftIndicator.classList.add(`${tabs.getClass('tabs')}-scroll-indicator--${appearance}`);
  
  const rightIndicator = document.createElement('div');
  rightIndicator.className = `${tabs.getClass('tabs')}-scroll-indicator ${tabs.getClass('tabs')}-scroll-indicator--right`;
  rightIndicator.classList.add(`${tabs.getClass('tabs')}-scroll-indicator--${appearance}`);
  
  tabs.element.appendChild(leftIndicator);
  tabs.element.appendChild(rightIndicator);
  
  // Add buttons if requested
  if (showButtons) {
    const leftButton = document.createElement('button');
    leftButton.className = `${tabs.getClass('tabs')}-scroll-button ${tabs.getClass('tabs')}-scroll-button--left`;
    leftButton.setAttribute('aria-label', 'Scroll tabs left');
    leftButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';
    
    const rightButton = document.createElement('button');
    rightButton.className = `${tabs.getClass('tabs')}-scroll-button ${tabs.getClass('tabs')}-scroll-button--right`;
    rightButton.setAttribute('aria-label', 'Scroll tabs right');
    rightButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>';
    
    tabs.element.appendChild(leftButton);
    tabs.element.appendChild(rightButton);
    
    // Add button click handlers
    leftButton.addEventListener('click', () => {
      scrollContainer.scrollBy({
        left: -100,
        behavior: 'smooth'
      });
    });
    
    rightButton.addEventListener('click', () => {
      scrollContainer.scrollBy({
        left: 100,
        behavior: 'smooth'
      });
    });
  }
  
  /**
   * Updates indicator visibility based on scroll position
   */
  const updateIndicators = (): void => {
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainer as HTMLElement;
    
    // Show left indicator only when scrolled right
    leftIndicator.classList.toggle('visible', scrollLeft > 0);
    
    // Show right indicator only when more content is available to scroll
    rightIndicator.classList.toggle('visible', scrollLeft + clientWidth < scrollWidth - 1);
    
    // Update button states if present
    if (showButtons) {
      const leftButton = tabs.element.querySelector(`.${tabs.getClass('tabs')}-scroll-button--left`) as HTMLButtonElement;
      const rightButton = tabs.element.querySelector(`.${tabs.getClass('tabs')}-scroll-button--right`) as HTMLButtonElement;
      
      if (leftButton) {
        leftButton.disabled = scrollLeft <= 0;
      }
      
      if (rightButton) {
        rightButton.disabled = scrollLeft + clientWidth >= scrollWidth - 1;
      }
    }
  };
  
  // Initial update
  updateIndicators();
  
  // Add scroll listener
  scrollContainer.addEventListener('scroll', updateIndicators);
  
  // Add resize observer to update on container size changes
  const resizeObserver = new ResizeObserver(updateIndicators);
  resizeObserver.observe(scrollContainer as Element);
  
  // Add cleanup to component destroy method
  const originalDestroy = tabs.destroy;
  tabs.destroy = function() {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    
    scrollContainer.removeEventListener('scroll', updateIndicators);
    
    if (leftIndicator.parentNode) {
      leftIndicator.parentNode.removeChild(leftIndicator);
    }
    
    if (rightIndicator.parentNode) {
      rightIndicator.parentNode.removeChild(rightIndicator);
    }
    
    if (showButtons) {
      const leftButton = tabs.element.querySelector(`.${tabs.getClass('tabs')}-scroll-button--left`);
      const rightButton = tabs.element.querySelector(`.${tabs.getClass('tabs')}-scroll-button--right`);
      
      if (leftButton && leftButton.parentNode) {
        leftButton.parentNode.removeChild(leftButton);
      }
      
      if (rightButton && rightButton.parentNode) {
        rightButton.parentNode.removeChild(rightButton);
      }
    }
    
    originalDestroy.call(this);
  };
};