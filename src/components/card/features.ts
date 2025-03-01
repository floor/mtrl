// src/components/card/features.ts
import { PREFIX } from '../../core/config';
import { createElement } from '../../core/dom/create';
import { BaseComponent, CardComponent, LoadingFeature, ExpandableFeature, SwipeableFeature } from './types';

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
 * Higher-order function to add loading state to a card
 * @param {LoadingConfig} config - Loading state configuration
 * @returns {Function} Card component enhancer
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
        container: component.element
      });

      // Add spinner
      createElement({
        tag: 'div',
        className: `${PREFIX}-card-loading-spinner`,
        container: loadingElement
      });

      component.element.classList.add(`${PREFIX}-card--state-loading`);
    } else if (!loading && loadingElement) {
      // Remove loading overlay
      loadingElement.remove();
      loadingElement = null;
      component.element.classList.remove(`${PREFIX}-card--state-loading`);
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
 * Higher-order function to add expandable behavior to a card
 * @param {ExpandableConfig} config - Expandable configuration
 * @returns {Function} Card component enhancer
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
    attrs: {
      'aria-expanded': isExpanded ? 'true' : 'false',
      'aria-label': isExpanded ? 'Collapse' : 'Expand'
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
      container: component.element
    });
    newActionsContainer.appendChild(expandButton);
  }

  // Set initial state
  if (expandableContent) {
    expandableContent.classList.add(`${PREFIX}-card-expandable-content`);
    if (!initialExpanded) {
      expandableContent.style.display = 'none';
    }
    component.element.appendChild(expandableContent);
  }

  // Set expanded state
  function setExpanded(expanded: boolean): void {
    isExpanded = expanded;

    if (expandableContent) {
      expandableContent.style.display = expanded ? 'block' : 'none';
    }

    expandButton.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    expandButton.setAttribute('aria-label', expanded ? 'Collapse' : 'Expand');

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
 * Higher-order function to add swipeable behavior to a card
 * @param {SwipeableConfig} config - Swipeable configuration
 * @returns {Function} Card component enhancer
 */
export const withSwipeable = (config: SwipeableConfig = {}) => (component: BaseComponent): BaseComponent & { swipeable: SwipeableFeature } => {
  const threshold = config.threshold || 100;
  let startX = 0;
  let currentX = 0;

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