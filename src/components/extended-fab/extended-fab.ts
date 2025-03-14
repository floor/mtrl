// src/components/extended-fab/extended-fab.ts
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withIcon,
  withVariant,
  withRipple,
  withDisabled,
  withLifecycle,
  withText
} from '../../core/compose/features';
import { withAPI } from './api';
import { ExtendedFabConfig, ExtendedFabComponent } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';

/**
 * Creates a new Extended Floating Action Button (Extended FAB) component
 * 
 * @param {ExtendedFabConfig} config - Extended FAB configuration object
 * @returns {ExtendedFabComponent} Extended FAB component instance
 * 
 * @example
 * ```typescript
 * // Create a basic Extended FAB with icon and text
 * const extendedFab = createExtendedFab({
 *   icon: '<svg>...</svg>',
 *   text: 'Create',
 *   ariaLabel: 'Create new item'
 * });
 * 
 * // Create a tertiary Extended FAB with a custom position
 * const customExtendedFab = createExtendedFab({
 *   text: 'Add to cart',
 *   icon: '<svg>...</svg>',
 *   variant: 'tertiary',
 *   position: 'bottom-right',
 *   collapseOnScroll: true
 * });
 * 
 * // Add click handler
 * extendedFab.on('click', () => {
 *   console.log('Extended FAB clicked');
 * });
 * ```
 */
const createExtendedFab = (config: ExtendedFabConfig = {}): ExtendedFabComponent => {
  const fabConfig = createBaseConfig(config);

  // Set up scroll collapse handler if needed
  const setupScrollCollapse = (component: ExtendedFabComponent): void => {
    if (fabConfig.collapseOnScroll) {
      let lastScrollY = window.scrollY;
      let ticking = false;
      const scrollThreshold = 10; // Minimum scroll amount to trigger collapse/expand
      
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - lastScrollY;
            
            // If scrolling down beyond threshold, collapse
            if (scrollDelta > scrollThreshold) {
              component.collapse();
            } 
            // If scrolling up beyond threshold, expand
            else if (scrollDelta < -scrollThreshold) {
              component.expand();
            }
            // If at the top of the page, ensure expanded
            if (currentScrollY <= 0) {
              component.expand();
            }
            
            lastScrollY = currentScrollY;
            ticking = false;
          });
          
          ticking = true;
        }
      };
      
      // Add scroll listener
      window.addEventListener('scroll', handleScroll, { passive: true });
      
      // Ensure it's expanded by default
      requestAnimationFrame(() => {
        component.expand();
      });
      
      // Clean up on destroy
      const originalDestroy = component.destroy;
      component.destroy = () => {
        window.removeEventListener('scroll', handleScroll);
        originalDestroy.call(component);
      };
    }
  };

  try {
    const extendedFab = pipe(
      createBase,
      withEvents(),
      withElement(getElementConfig(fabConfig)),
      withVariant(fabConfig),
      withIcon(fabConfig),
      withText(fabConfig),
      withDisabled(fabConfig),
      withRipple(fabConfig),
      withLifecycle(),
      comp => withAPI(getApiConfig(comp))(comp)
    )(fabConfig);
    
    // Set up scroll collapse after component is created
    setupScrollCollapse(extendedFab);
    
    return extendedFab;
  } catch (error) {
    console.error('Extended FAB creation error:', error);
    throw new Error(`Failed to create Extended FAB: ${(error as Error).message}`);
  }
};

export default createExtendedFab;