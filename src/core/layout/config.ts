// src/core/layout/config.ts
/**
 * @module core/layout
 * @description Layout configuration utilities
 */

import { addClass, removeClass, hasClass } from '../dom/classes';

/**
 * Helper function to clean up previous layout classes from an element
 * 
 * @param element - Element to clean layout classes from
 */
export function cleanupLayoutClasses(element: HTMLElement): void {
  if (!element) return;
  
  // Get all classes from the element
  const classList = Array.from(element.classList);
  
  // Find and remove layout-related classes
  const layoutClasses = classList.filter(cls => 
    cls.startsWith('layout--') || 
    cls.includes('-layout--')
  );
  
  // Remove each layout class
  layoutClasses.forEach(cls => {
    element.classList.remove(cls);
  });
}

/**
 * Helper function to get the layout type from element classes
 * 
 * @param element - Element to check
 * @returns Layout type if found, empty string otherwise
 */
export function getLayoutType(element: HTMLElement): string {
  return hasClass(element, 'layout--stack') ? 'stack' : 
         hasClass(element, 'layout--row') ? 'row' : 
         hasClass(element, 'layout--grid') ? 'grid' : '';
}

/**
 * Applies layout classes based on the layout configuration
 * 
 * @param element - Element to apply layout classes to
 * @param layoutConfig - Layout configuration
 * @param cleanupFirst - Whether to clean up previous layout classes first
 */
export function applyLayoutClasses(
  element: HTMLElement, 
  layoutConfig: any,
  cleanupFirst: boolean = true
): void {
  if (!element || !layoutConfig) return;
  
  // First remove any existing layout classes to avoid accumulation
  if (cleanupFirst) {
    cleanupLayoutClasses(element);
  }
  
  // Apply base layout type
  if (layoutConfig.type) {
    addClass(element, `layout--${layoutConfig.type}`);
  }
  
  // Apply common layout properties
  if (layoutConfig.gap !== undefined) {
    // Get current layout type for prefixed gap class
    const layoutType = layoutConfig.type || getLayoutType(element);
       
    if (layoutType) {
      // Add the new gap class
      addClass(element, `layout--${layoutType}-gap-${layoutConfig.gap}`);
    }
  }
  
  // Apply alignment properties
  if (layoutConfig.align) {
    const layoutType = layoutConfig.type || getLayoutType(element);
       
    if (layoutType) {
      addClass(element, `layout--${layoutType}-${layoutConfig.align}`);
    }
  }
  
  // Apply justification
  if (layoutConfig.justify) {
    const layoutType = layoutConfig.type || getLayoutType(element);
       
    if (layoutType) {
      addClass(element, `layout--${layoutType}-justify-${layoutConfig.justify}`);
    }
  }
  
  // Apply grid-specific properties
  if (layoutConfig.type === 'grid' || getLayoutType(element) === 'grid') {
    // Grid columns
    if (typeof layoutConfig.columns === 'number') {
      addClass(element, `layout--grid-cols-${layoutConfig.columns}`);
    } else if (layoutConfig.columns === 'auto-fill') {
      addClass(element, 'layout--grid-fill');
    } else if (layoutConfig.columns === 'auto-fit') {
      addClass(element, 'layout--grid-cols-auto-fit');
    }
    
    // Other grid properties
    if (layoutConfig.dense) {
      addClass(element, 'layout--grid-dense');
    }
    
    if (layoutConfig.autoHeight) {
      addClass(element, 'layout--grid-auto-height');
    }
  }
  
  // Apply row-specific properties
  if (layoutConfig.type === 'row' || getLayoutType(element) === 'row') {
    // Wrap behavior
    if (layoutConfig.wrap === false || layoutConfig.wrap === 'nowrap') {
      addClass(element, 'layout--row-nowrap');
    } else if (layoutConfig.wrap === 'reverse') {
      addClass(element, 'layout--row-wrap-reverse');
    }
    
    // Mobile responsiveness
    if (layoutConfig.mobileStack) {
      addClass(element, 'layout--row-mobile-stack');
    }
    
    if (layoutConfig.mobileScroll) {
      addClass(element, 'layout--row-mobile-scroll');
    }
  }
  
  // No masonry, split or sidebar specific properties anymore
  
  // Add any additional custom classes
  if (layoutConfig.class) {
    layoutConfig.class.split(' ').filter(Boolean).forEach(cls => {
      // Don't prefix these classes as they're user-defined
      element.classList.add(cls);
    });
  }
}

/**
 * Applies layout item classes based on the configuration
 * 
 * @param element - Element to apply layout item classes to
 * @param itemConfig - Layout item configuration
 */
export function applyLayoutItemClasses(element: HTMLElement, itemConfig: any): void {
  if (!element || !itemConfig) return;
  
  // Add the base layout item class
  addClass(element, 'layout__item');
  
  // Add width classes
  if (itemConfig.width && itemConfig.width >= 1 && itemConfig.width <= 12) {
    addClass(element, `layout__item--${itemConfig.width}`);
  }
  
  // Add responsive classes
  if (itemConfig.sm) addClass(element, `layout__item--sm-${itemConfig.sm}`);
  if (itemConfig.md) addClass(element, `layout__item--md-${itemConfig.md}`);
  if (itemConfig.lg) addClass(element, `layout__item--lg-${itemConfig.lg}`);
  if (itemConfig.xl) addClass(element, `layout__item--xl-${itemConfig.xl}`);
  
  // Add grid span classes
  if (itemConfig.span) addClass(element, `layout__item--span-${itemConfig.span}`);
  if (itemConfig.rowSpan) addClass(element, `layout__item--row-span-${itemConfig.rowSpan}`);
  
  // Add ordering
  if (itemConfig.order) {
    if (typeof itemConfig.order === 'number') {
      addClass(element, `layout__item--order-${itemConfig.order}`);
    } else {
      addClass(element, `layout__item--order-${itemConfig.order}`);
    }
  }
  
  // Add alignment
  if (itemConfig.align) {
    addClass(element, `layout__item--self-${itemConfig.align}`);
  }
  
  // Add auto class
  if (itemConfig.auto) {
    addClass(element, 'layout__item--auto');
  }
}