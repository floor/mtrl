// src/components/navigation/system/mobile.ts

import { NavigationSystemState } from './types';
import { 
  hasTouchSupport, 
  normalizeEvent,
  TOUCH_CONFIG,
  TOUCH_TARGETS 
} from '../../../core/utils/mobile';

/**
 * Creates and appends overlay element for mobile
 *
 * @param state - System state
 * @param mobileConfig - Mobile configuration
 * @param hideDrawer - Function to hide the drawer
 * @returns Overlay element
 */
export const createOverlay = (
  state: NavigationSystemState, 
  mobileConfig: any, 
  hideDrawer: () => void
): HTMLElement => {
  if (state.overlayElement) return state.overlayElement;
  
  state.overlayElement = document.createElement('div');
  state.overlayElement.className = mobileConfig.overlayClass;
  state.overlayElement.setAttribute('aria-hidden', 'true');
  document.body.appendChild(state.overlayElement);
  
  state.overlayElement.addEventListener('click', (event) => {
    if (event.target === state.overlayElement) {
      hideDrawer();
    }
  });
  
  return state.overlayElement;
};

/**
 * Creates and adds close button to the drawer
 *
 * @param state - System state
 * @param mobileConfig - Mobile configuration
 * @param hideDrawer - Function to hide the drawer
 * @returns Close button element
 */
export const createCloseButton = (
  state: NavigationSystemState, 
  mobileConfig: any, 
  hideDrawer: () => void
): HTMLElement | null => {
  if (!state.drawer || state.closeButtonElement) return null;
  
  state.closeButtonElement = document.createElement('button');
  state.closeButtonElement.className = mobileConfig.closeButtonClass;
  state.closeButtonElement.setAttribute('aria-label', 'Close navigation');
  state.closeButtonElement.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  
  // Handle click event
  state.closeButtonElement.addEventListener('click', () => {
    hideDrawer();
  });
  
  // Apply touch-friendly styles if needed
  if (hasTouchSupport() && mobileConfig.optimizeForTouch) {
    state.closeButtonElement.style.minWidth = `${TOUCH_TARGETS.COMFORTABLE}px`;
    state.closeButtonElement.style.minHeight = `${TOUCH_TARGETS.COMFORTABLE}px`;
    
    // Add touch feedback
    state.closeButtonElement.addEventListener('touchstart', () => {
      state.closeButtonElement.classList.add('active');
    }, { passive: true });
    
    state.closeButtonElement.addEventListener('touchend', () => {
      setTimeout(() => {
        state.closeButtonElement.classList.remove('active');
      }, TOUCH_CONFIG.FEEDBACK_DURATION);
    }, { passive: true });
  }
  
  state.drawer.element.appendChild(state.closeButtonElement);
  return state.closeButtonElement;
};

/**
 * Sets up mobile mode features
 *
 * @param state - System state
 * @param mobileConfig - Mobile configuration
 * @param hideDrawer - Function to hide the drawer
 * @param isDrawerVisible - Function to check if drawer is visible
 */
export const setupMobileMode = (
  state: NavigationSystemState, 
  mobileConfig: any, 
  hideDrawer: () => void,
  isDrawerVisible: () => boolean
): void => {
  const drawer = state.drawer;
  const rail = state.rail;
  
  if (!drawer || !rail) return;
  
  // Create mobile UI elements
  createOverlay(state, mobileConfig, hideDrawer);
  createCloseButton(state, mobileConfig, hideDrawer);
  
  // Setup outside click handling
  setupOutsideClickHandling(state, mobileConfig, hideDrawer, isDrawerVisible);
  
  // Setup touch gestures if enabled
  if (mobileConfig.enableSwipeGestures && hasTouchSupport()) {
    setupTouchGestures(state, hideDrawer, isDrawerVisible);
  }
  
  // Hide drawer initially in mobile mode
  hideDrawer();
};

/**
 * Sets up outside click handling for mobile
 *
 * @param state - System state
 * @param mobileConfig - Mobile configuration
 * @param hideDrawer - Function to hide the drawer
 * @param isDrawerVisible - Function to check if drawer is visible
 */
export const setupOutsideClickHandling = (
  state: NavigationSystemState, 
  mobileConfig: any, 
  hideDrawer: () => void,
  isDrawerVisible: () => boolean
): void => {
  if (!mobileConfig.hideOnClickOutside) return;
  
  // Only set up once
  if (state.outsideClickHandlerSet) return;
  state.outsideClickHandlerSet = true;
  
  // Use either click or touchend event depending on device capability
  const eventType = hasTouchSupport() ? 'touchend' : 'click';
  
  // The handler function
  const handleOutsideClick = (event: Event) => {
    if (!state.isMobile || !isDrawerVisible()) return;
    
    const normalizedEvent = normalizeEvent(event as MouseEvent | TouchEvent);
    const target = normalizedEvent.target as HTMLElement;
    
    // Don't close if clicking on drawer, rail, or excluded elements
    if (state.drawer.element.contains(target) || 
        state.rail.element.contains(target)) {
      return;
    }
    
    // Close drawer - it's an outside click/touch
    hideDrawer();
  };
  
  // Store handler for cleanup
  state.outsideClickHandler = handleOutsideClick;
  
  // Add listener
  document.addEventListener(eventType, handleOutsideClick,
    hasTouchSupport() ? { passive: true } : false);
};

/**
 * Sets up touch gestures for mobile
 *
 * @param state - System state
 * @param hideDrawer - Function to hide the drawer
 * @param isDrawerVisible - Function to check if drawer is visible
 */
export const setupTouchGestures = (
  state: NavigationSystemState, 
  hideDrawer: () => void,
  isDrawerVisible: () => boolean,
  showDrawer?: () => void
): void => {
  const drawer = state.drawer;
  const rail = state.rail;
  
  if (!drawer || !rail) return;
  
  let touchStartX = 0;
  let touchStartY = 0;
  
  // Rail swipe right to open drawer
  rail.element.addEventListener('touchstart', (event: TouchEvent) => {
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });
  
  rail.element.addEventListener('touchmove', (event: TouchEvent) => {
    if (!state.isMobile || isDrawerVisible() || !showDrawer) return;
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    // Only consider horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && 
        deltaX > TOUCH_CONFIG.SWIPE_THRESHOLD) {
      showDrawer();
    }
  }, { passive: true });
  
  // Drawer swipe left to close
  drawer.element.addEventListener('touchstart', (event: TouchEvent) => {
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });
  
  // Use touchmove with transform for visual feedback
  drawer.element.addEventListener('touchmove', (event: TouchEvent) => {
    if (!state.isMobile || !isDrawerVisible()) return;
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartX;
    
    // Only apply transform for leftward swipes
    if (deltaX < 0) {
      // Apply transform with resistance
      drawer.element.style.transform = `translateX(${deltaX / 2}px)`;
      
      // Close if threshold reached
      if (deltaX < -TOUCH_CONFIG.SWIPE_THRESHOLD) {
        hideDrawer();
      }
    }
  }, { passive: true });
  
  // Reset transforms when touch ends
  drawer.element.addEventListener('touchend', () => {
    if (drawer.element.style.transform) {
      drawer.element.style.transition = 'transform 0.2s ease';
      drawer.element.style.transform = '';
      
      setTimeout(() => {
        drawer.element.style.transition = '';
      }, 200);
    }
  }, { passive: true });
};

/**
 * Tears down mobile-specific features
 *
 * @param state - System state
 * @param mobileConfig - Mobile configuration
 */
export const teardownMobileMode = (
  state: NavigationSystemState, 
  mobileConfig: any
): void => {
  // Hide overlay
  if (state.overlayElement) {
    state.overlayElement.classList.remove('active');
    state.overlayElement.setAttribute('aria-hidden', 'true');
  }
  
  // Hide close button
  if (state.closeButtonElement) {
    state.closeButtonElement.style.display = 'none';
  }
  
  // Remove body scroll lock if applied
  document.body.classList.remove(mobileConfig.bodyLockClass);
};