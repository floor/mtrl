// src/components/card/features.ts
import { PREFIX } from '../../core/config';
import { createElement } from '../../core/dom/create';
import { BaseComponent, CardComponent, LoadingFeature, ExpandableFeature, SwipeableFeature } from './types';
import { CARD_ELEVATION_LEVELS } from './config';

interface LoadingConfig {
  initialState?: boolean;
}

interface ExpandableConfig {
  initialExpanded?: boolean;
  expandableContent?: HTMLElement;
}

interface SwipeableConfig {
  onSwipeLeft?: (component: CardComponent) => void;
  onSwipeRight?: (component: CardComponent) => void;
  threshold?: number;
}

/**
 * Higher-order function to add loading state to a card.
 * Adds a loading overlay with spinner and proper ARIA attributes
 * for accessibility during asynchronous operations.
 * 
 * @param {LoadingConfig} config - Loading state configuration
 * @returns {Function} Card component enhancer
 * @category Components
 * @example
 * ```typescript
 * // Create a card with loading state
 * const card = pipe(
 *   createCard,
 *   withLoading({ initialState: true })
 * )();
 * 
 * // Toggle loading state
 * setTimeout(() => card.loading.setLoading(false), 2000);
 * 
 * // Check loading state
 * console.log(card.loading.isLoading()); // false after timeout
 * ```
 */
export const withLoading = (config: LoadingConfig = {}) => (component: BaseComponent): BaseComponent & { loading: LoadingFeature } => {
  const initialState = config.initialState || false;
  let loadingElement: HTMLElement | null = null;
  let isLoading = initialState;

  function setLoading(loading: boolean): void {
    isLoading = loading;

    if (loading && !loadingElement) {
      // Create and add loading overlay
      loadingElement = createElement({
        tag: 'div',
        className: `${PREFIX}-card-loading-overlay`,
        container: component.element,
        attributes: {
          'role': 'progressbar',
          'aria-busy': 'true',
          'aria-label': 'Loading'
        }
      });

      // Add spinner
      createElement({
        tag: 'div',
        className: `${PREFIX}-card-loading-spinner`,
        container: loadingElement
      });

      component.element.classList.add(`${PREFIX}-card--state-loading`);
      component.element.setAttribute('aria-busy', 'true');
    } else if (!loading && loadingElement) {
      // Remove loading overlay
      loadingElement.remove();
      loadingElement = null;
      component.element.classList.remove(`${PREFIX}-card--state-loading`);
      component.element.setAttribute('aria-busy', 'false');
    }
  }

  if (initialState) {
    setLoading(true);
  }

  return {
    ...component,
    loading: {
      isLoading: () => isLoading,
      setLoading
    }
  };
};

/**
 * Higher-order function to add elevation to a card based on its variant.
 * 
 * Sets the initial elevation CSS variable according to Material Design 3 guidelines:
 * - Elevated variant: 1dp elevation
 * - Filled and outlined variants: 0dp elevation
 * 
 * These elevation values affect shadows and surface appearance of the card
 * to create appropriate visual hierarchy.
 * 
 * @param {BaseComponent} component - Card component
 * @returns {BaseComponent} Card component with elevation applied
 * @category Components
 * @example
 * ```typescript
 * // Apply elevation in the composition chain
 * const card = pipe(
 *   createBase,
 *   withElement(config),
 *   withElevation
 * )(baseConfig);
 * ```
 */
export const withElevation = (component: BaseComponent): BaseComponent => {
  const config = component.config;
  
  // Set initial elevation based on variant
  if (config.variant === 'elevated') {
    component.element.style.setProperty('--card-elevation', String(CARD_ELEVATION_LEVELS.LEVEL1));
  } else {
    component.element.style.setProperty('--card-elevation', String(CARD_ELEVATION_LEVELS.LEVEL0));
  }
  
  return component;
};

/**
 * Higher-order function to add expandable behavior to a card.
 * Creates a collapsible section with proper accessibility attributes and
 * toggle controls. Supports keyboard interaction and screen readers.
 * 
 * @param {ExpandableConfig} config - Expandable configuration
 * @returns {Function} Card component enhancer
 * @category Components
 * @example
 * ```typescript
 * // Create a card with expandable content
 * const expandableContent = document.createElement('div');
 * expandableContent.textContent = 'Additional content that can be expanded';
 * 
 * const card = pipe(
 *   createCard,
 *   withExpandable({ 
 *     initialExpanded: false,
 *     expandableContent
 *   })
 * )();
 * 
 * // Later toggle the expanded state
 * card.expandable.toggleExpanded();
 * 
 * // Or check current state
 * if (card.expandable.isExpanded()) {
 *   console.log('Card is expanded');
 * }
 * ```
 */
export const withExpandable = (config: ExpandableConfig = {}) => (component: BaseComponent): BaseComponent & { expandable: ExpandableFeature } => {
  const initialExpanded = config.initialExpanded || false;
  let isExpanded = initialExpanded;
  const expandableContent = config.expandableContent;
  let expandButton: HTMLButtonElement;

  // Create expand/collapse button
  expandButton = createElement({
    tag: 'button',
    className: `${PREFIX}-card-expand-button`,
    attributes: {
      'aria-expanded': isExpanded ? 'true' : 'false',
      'aria-label': isExpanded ? 'Collapse content' : 'Expand content',
      'aria-controls': expandableContent?.id || `${component.element.id || 'card'}-expandable-content`
    }
  }) as HTMLButtonElement;

  // Add to card as action if not already present
  const actionsContainer = component.element.querySelector(`.${PREFIX}-card-actions`);
  if (actionsContainer) {
    actionsContainer.appendChild(expandButton);
  } else {
    // Create actions container if not present
    const newActionsContainer = createElement({
      tag: 'div',
      className: `${PREFIX}-card-actions`,
      container: component.element,
      attributes: {
        'role': 'group'
      }
    });
    newActionsContainer.appendChild(expandButton);
  }

  // Set initial state
  if (expandableContent) {
    expandableContent.classList.add(`${PREFIX}-card-expandable-content`);
    
    // Ensure the expandable content has an ID for ARIA controls
    if (!expandableContent.id) {
      expandableContent.id = `${component.element.id || 'card'}-expandable-content`;
    }
    
    if (!initialExpanded) {
      expandableContent.style.display = 'none';
      expandableContent.setAttribute('aria-hidden', 'true');
    } else {
      expandableContent.setAttribute('aria-hidden', 'false');
    }
    
    component.element.appendChild(expandableContent);
  }

  // Set expanded state
  function setExpanded(expanded: boolean): void {
    isExpanded = expanded;

    if (expandableContent) {
      expandableContent.style.display = expanded ? 'block' : 'none';
      expandableContent.setAttribute('aria-hidden', expanded ? 'false' : 'true');
    }

    expandButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    expandButton.setAttribute('aria-label', expanded ? 'Collapse content' : 'Expand content');

    if (expanded) {
      component.element.classList.add(`${PREFIX}-card--expanded`);
    } else {
      component.element.classList.remove(`${PREFIX}-card--expanded`);
    }

    component.emit?.('expandedChanged', { expanded });
  }

  // Toggle expanded state
  function toggleExpanded(): void {
    setExpanded(!isExpanded);
  }

  // Add click handler to toggle button
  expandButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleExpanded();
  });

  // Add keyboard handler for accessibility
  expandButton.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpanded();
    }
  });

  return {
    ...component,
    expandable: {
      isExpanded: () => isExpanded,
      setExpanded,
      toggleExpanded
    }
  };
};

/**
 * Higher-order function to add swipeable behavior to a card.
 * Implements touch-based swipe gestures with customizable threshold and callbacks.
 * Includes keyboard accessibility support and visual feedback during swipe.
 * 
 * @param {SwipeableConfig} config - Swipeable configuration 
 * @returns {Function} Card component enhancer
 * @category Components
 * @example
 * ```typescript
 * // Create a swipeable card with custom actions
 * const card = pipe(
 *   createCard,
 *   withSwipeable({
 *     threshold: 100, // Swipe sensitivity in pixels
 *     onSwipeLeft: (card) => {
 *       console.log('Swiped left');
 *       // For example: Delete or archive action
 *     },
 *     onSwipeRight: (card) => { 
 *       console.log('Swiped right');
 *       // For example: Save or favorite action
 *     }
 *   })
 * )({ variant: 'elevated' });
 * 
 * // Reset card position programmatically
 * card.swipeable.reset();
 * ```
 */
export const withSwipeable = (config: SwipeableConfig = {}) => (component: BaseComponent): BaseComponent & { swipeable: SwipeableFeature } => {
  const threshold = config.threshold || 100;
  let startX = 0;
  let currentX = 0;
  
  // Add accessibility information for swipeable cards
  component.element.setAttribute('aria-description', 'Swipeable card. Swipe left or right to perform actions.');

  // Create hidden buttons for keyboard accessibility
  const leftActionButton = createElement({
    tag: 'button',
    className: `${PREFIX}-card-swipe-left-action`,
    text: 'Swipe Left Action',
    container: component.element,
    attributes: {
      'aria-label': 'Perform swipe left action',
      'style': 'position: absolute; left: -9999px; top: -9999px; visibility: hidden;' // Visually hidden but accessible
    }
  }) as HTMLButtonElement;
  
  const rightActionButton = createElement({
    tag: 'button',
    className: `${PREFIX}-card-swipe-right-action`,
    text: 'Swipe Right Action',
    container: component.element,
    attributes: {
      'aria-label': 'Perform swipe right action',
      'style': 'position: absolute; left: -9999px; top: -9999px; visibility: hidden;' // Visually hidden but accessible
    }
  }) as HTMLButtonElement;
  
  // Add keyboard handlers to the hidden buttons
  leftActionButton.addEventListener('click', () => {
    if (config.onSwipeLeft) {
      component.element.style.transform = 'translateX(-100%)';
      component.element.style.transition = 'transform 0.3s ease';
      config.onSwipeLeft(component as CardComponent);
    }
  });
  
  rightActionButton.addEventListener('click', () => {
    if (config.onSwipeRight) {
      component.element.style.transform = 'translateX(100%)';
      component.element.style.transition = 'transform 0.3s ease';
      config.onSwipeRight(component as CardComponent);
    }
  });

  function handleTouchStart(e: TouchEvent): void {
    startX = e.touches[0].clientX;
    component.element.style.transition = 'none';
  }

  function handleTouchMove(e: TouchEvent): void {
    if (!startX) return;

    currentX = e.touches[0].clientX;
    const diffX = currentX - startX;

    // Apply transform to move card
    component.element.style.transform = `translateX(${diffX}px)`;
  }

  function handleTouchEnd(): void {
    if (!startX) return;

    component.element.style.transition = 'transform 0.3s ease';
    const diffX = currentX - startX;

    if (Math.abs(diffX) >= threshold) {
      // Swipe threshold reached
      if (diffX > 0 && config.onSwipeRight) {
        // Swipe right
        component.element.style.transform = 'translateX(100%)';
        config.onSwipeRight(component as CardComponent);
      } else if (diffX < 0 && config.onSwipeLeft) {
        // Swipe left
        component.element.style.transform = 'translateX(-100%)';
        config.onSwipeLeft(component as CardComponent);
      } else {
        // Reset if no handler
        component.element.style.transform = 'translateX(0)';
      }
    } else {
      // Reset if below threshold
      component.element.style.transform = 'translateX(0)';
    }

    startX = 0;
    currentX = 0;
  }

  // Add event listeners
  component.element.addEventListener('touchstart', handleTouchStart as EventListener);
  component.element.addEventListener('touchmove', handleTouchMove as EventListener);
  component.element.addEventListener('touchend', handleTouchEnd);

  // Add swipeable class
  component.element.classList.add(`${PREFIX}-card--swipeable`);

  // Return enhanced component
  return {
    ...component,
    swipeable: {
      reset: () => {
        component.element.style.transition = 'transform 0.3s ease';
        component.element.style.transform = 'translateX(0)';
      }
    }
  };
};