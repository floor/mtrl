// src/components/card/features.js
import { PREFIX } from '../../core/config'
import { createElement } from '../../core/dom/create'

/**
 * Higher-order function to add loading state to a card
 * @param {Object} config - Loading state configuration
 * @param {boolean} [config.initialState=false] - Initial loading state
 * @returns {Function} Card component enhancer
 */
export const withLoading = (config = {}) => (component) => {
  const initialState = config.initialState || false
  let loadingElement = null
  let isLoading = initialState

  if (initialState) {
    setLoading(true)
  }

  function setLoading (loading) {
    isLoading = loading

    if (loading && !loadingElement) {
      // Create and add loading overlay
      loadingElement = createElement({
        tag: 'div',
        className: `${PREFIX}-card-loading-overlay`,
        container: component.element
      })

      // Add spinner
      createElement({
        tag: 'div',
        className: `${PREFIX}-card-loading-spinner`,
        container: loadingElement
      })

      component.element.classList.add(`${PREFIX}-card--state-loading`)
    } else if (!loading && loadingElement) {
      // Remove loading overlay
      loadingElement.remove()
      loadingElement = null
      component.element.classList.remove(`${PREFIX}-card--state-loading`)
    }
  }

  return {
    ...component,
    loading: {
      isLoading: () => isLoading,
      setLoading
    }
  }
}

/**
 * Higher-order function to add expandable behavior to a card
 * @param {Object} config - Expandable configuration
 * @param {boolean} [config.initialExpanded=false] - Whether card is initially expanded
 * @param {HTMLElement} [config.expandableContent] - Content to show when expanded
 * @returns {Function} Card component enhancer
 */
export const withExpandable = (config = {}) => (component) => {
  const initialExpanded = config.initialExpanded || false
  let isExpanded = initialExpanded
  const expandableContent = config.expandableContent
  let expandButton = null

  // Create expand/collapse button
  expandButton = createElement({
    tag: 'button',
    className: `${PREFIX}-card-expand-button`,
    attrs: {
      'aria-expanded': isExpanded ? 'true' : 'false',
      'aria-label': isExpanded ? 'Collapse' : 'Expand'
    }
  })

  // Add to card as action if not already present
  const actionsContainer = component.element.querySelector(`.${PREFIX}-card-actions`)
  if (actionsContainer) {
    actionsContainer.appendChild(expandButton)
  } else {
    // Create actions container if not present
    const newActionsContainer = createElement({
      tag: 'div',
      className: `${PREFIX}-card-actions`,
      container: component.element
    })
    newActionsContainer.appendChild(expandButton)
  }

  // Set initial state
  if (expandableContent) {
    expandableContent.classList.add(`${PREFIX}-card-expandable-content`)
    if (!initialExpanded) {
      expandableContent.style.display = 'none'
    }
    component.element.appendChild(expandableContent)
  }

  // Toggle expanded state
  function toggleExpanded () {
    setExpanded(!isExpanded)
  }

  // Set expanded state
  function setExpanded (expanded) {
    isExpanded = expanded

    if (expandableContent) {
      expandableContent.style.display = expanded ? 'block' : 'none'
    }

    expandButton.setAttribute('aria-expanded', expanded ? 'true' : 'false')
    expandButton.setAttribute('aria-label', expanded ? 'Collapse' : 'Expand')

    if (expanded) {
      component.element.classList.add(`${PREFIX}-card--expanded`)
    } else {
      component.element.classList.remove(`${PREFIX}-card--expanded`)
    }

    component.emit('expandedChanged', { expanded })
  }

  // Add click handler to toggle button
  expandButton.addEventListener('click', (e) => {
    e.stopPropagation()
    toggleExpanded()
  })

  return {
    ...component,
    expandable: {
      isExpanded: () => isExpanded,
      setExpanded,
      toggleExpanded
    }
  }
}

/**
 * Higher-order function to add swipeable behavior to a card
 * @param {Object} config - Swipeable configuration
 * @param {Function} [config.onSwipeLeft] - Callback when card is swiped left
 * @param {Function} [config.onSwipeRight] - Callback when card is swiped right
 * @param {number} [config.threshold=100] - Swipe distance threshold to trigger action
 * @returns {Function} Card component enhancer
 */
export const withSwipeable = (config = {}) => (component) => {
  const threshold = config.threshold || 100
  let startX = 0
  let currentX = 0

  function handleTouchStart (e) {
    startX = e.touches[0].clientX
    component.element.style.transition = 'none'
  }

  function handleTouchMove (e) {
    if (!startX) return

    currentX = e.touches[0].clientX
    const diffX = currentX - startX

    // Apply transform to move card
    component.element.style.transform = `translateX(${diffX}px)`
  }

  function handleTouchEnd () {
    if (!startX) return

    component.element.style.transition = 'transform 0.3s ease'
    const diffX = currentX - startX

    if (Math.abs(diffX) >= threshold) {
      // Swipe threshold reached
      if (diffX > 0 && config.onSwipeRight) {
        // Swipe right
        component.element.style.transform = 'translateX(100%)'
        config.onSwipeRight(component)
      } else if (diffX < 0 && config.onSwipeLeft) {
        // Swipe left
        component.element.style.transform = 'translateX(-100%)'
        config.onSwipeLeft(component)
      } else {
        // Reset if no handler
        component.element.style.transform = 'translateX(0)'
      }
    } else {
      // Reset if below threshold
      component.element.style.transform = 'translateX(0)'
    }

    startX = 0
    currentX = 0
  }

  // Add event listeners
  component.element.addEventListener('touchstart', handleTouchStart)
  component.element.addEventListener('touchmove', handleTouchMove)
  component.element.addEventListener('touchend', handleTouchEnd)

  // Add swipeable class
  component.element.classList.add(`${PREFIX}-card--swipeable`)

  // Return enhanced component
  return {
    ...component,
    swipeable: {
      reset: () => {
        component.element.style.transition = 'transform 0.3s ease'
        component.element.style.transform = 'translateX(0)'
      }
    }
  }
}
