// src/components/tooltip/api.ts
import { TooltipComponent } from './types';
import { TOOLTIP_POSITIONS, DEFAULT_OFFSET, DEFAULT_ARROW_SIZE } from './config';

interface ApiOptions {
  lifecycle: {
    destroy: () => void;
  };
}

interface ComponentWithElements {
  element: HTMLElement;
  getClass: (name: string) => string;
}

/**
 * Enhances a tooltip component with API methods
 * @param {ApiOptions} options - API configuration options
 * @returns {Function} Higher-order function that adds API methods to component
 * @internal This is an internal utility for the Tooltip component
 */
export const withAPI = ({ lifecycle }: ApiOptions) => 
  (component: ComponentWithElements): TooltipComponent => {
    // Set up internal state
    let target: HTMLElement | null = null;
    let position = TOOLTIP_POSITIONS.BOTTOM;
    let isVisible = false;
    let showTimer: number | null = null;
    let hideTimer: number | null = null;
    let showDelay = 300;
    let hideDelay = 100;
    let showOnFocus = true;
    let showOnHover = true;
    
    // Create arrow element
    const arrowElement = document.createElement('div');
    arrowElement.className = `${component.getClass('tooltip')}__arrow`;
    component.element.appendChild(arrowElement);
    
    // Add to body (but hidden initially)
    document.body.appendChild(component.element);
    component.element.setAttribute('aria-hidden', 'true');
    
    /**
     * Calculate position based on target element and desired position
     */
    const calculatePosition = (): { top: number; left: number; arrowPosition?: string } => {
      if (!target) return { top: 0, left: 0 };
      
      const tooltipRect = component.element.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset;
      const scrollX = window.scrollX || window.pageXOffset;
      
      // Default offset
      const offset = DEFAULT_OFFSET;
      const arrowSize = DEFAULT_ARROW_SIZE;
      
      let top = 0;
      let left = 0;
      let arrowPosition: string | undefined;
      
      // Calculate position based on position value
      switch (position) {
        case TOOLTIP_POSITIONS.TOP:
          top = targetRect.top + scrollY - tooltipRect.height - offset;
          left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
          arrowPosition = 'bottom';
          break;
          
        case TOOLTIP_POSITIONS.TOP_START:
          top = targetRect.top + scrollY - tooltipRect.height - offset;
          left = targetRect.left + scrollX;
          arrowPosition = 'bottom-start';
          break;
          
        case TOOLTIP_POSITIONS.TOP_END:
          top = targetRect.top + scrollY - tooltipRect.height - offset;
          left = targetRect.left + scrollX + targetRect.width - tooltipRect.width;
          arrowPosition = 'bottom-end';
          break;
          
        case TOOLTIP_POSITIONS.RIGHT:
          top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.left + scrollX + targetRect.width + offset;
          arrowPosition = 'left';
          break;
          
        case TOOLTIP_POSITIONS.RIGHT_START:
          top = targetRect.top + scrollY;
          left = targetRect.left + scrollX + targetRect.width + offset;
          arrowPosition = 'left-start';
          break;
          
        case TOOLTIP_POSITIONS.RIGHT_END:
          top = targetRect.top + scrollY + targetRect.height - tooltipRect.height;
          left = targetRect.left + scrollX + targetRect.width + offset;
          arrowPosition = 'left-end';
          break;
          
        case TOOLTIP_POSITIONS.BOTTOM:
          top = targetRect.top + scrollY + targetRect.height + offset;
          left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
          arrowPosition = 'top';
          break;
          
        case TOOLTIP_POSITIONS.BOTTOM_START:
          top = targetRect.top + scrollY + targetRect.height + offset;
          left = targetRect.left + scrollX;
          arrowPosition = 'top-start';
          break;
          
        case TOOLTIP_POSITIONS.BOTTOM_END:
          top = targetRect.top + scrollY + targetRect.height + offset;
          left = targetRect.left + scrollX + targetRect.width - tooltipRect.width;
          arrowPosition = 'top-end';
          break;
          
        case TOOLTIP_POSITIONS.LEFT:
          top = targetRect.top + scrollY + (targetRect.height / 2) - (tooltipRect.height / 2);
          left = targetRect.left + scrollX - tooltipRect.width - offset;
          arrowPosition = 'right';
          break;
          
        case TOOLTIP_POSITIONS.LEFT_START:
          top = targetRect.top + scrollY;
          left = targetRect.left + scrollX - tooltipRect.width - offset;
          arrowPosition = 'right-start';
          break;
          
        case TOOLTIP_POSITIONS.LEFT_END:
          top = targetRect.top + scrollY + targetRect.height - tooltipRect.height;
          left = targetRect.left + scrollX - tooltipRect.width - offset;
          arrowPosition = 'right-end';
          break;
          
        default:
          top = targetRect.top + scrollY + targetRect.height + offset;
          left = targetRect.left + scrollX + (targetRect.width / 2) - (tooltipRect.width / 2);
          arrowPosition = 'top';
      }
      
      // Constrain to window boundaries
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Adjust horizontal position
      if (left < 0) {
        left = 0;
      } else if (left + tooltipRect.width > windowWidth) {
        left = windowWidth - tooltipRect.width;
      }
      
      return { top, left, arrowPosition };
    };
    
    /**
     * Handle events on target element
     */
    const addTargetEvents = (targetEl: HTMLElement) => {
      if (showOnHover) {
        targetEl.addEventListener('mouseenter', handleTargetMouseEnter);
        targetEl.addEventListener('mouseleave', handleTargetMouseLeave);
      }
      
      if (showOnFocus) {
        targetEl.addEventListener('focus', handleTargetFocus);
        targetEl.addEventListener('blur', handleTargetBlur);
      }
    };
    
    const removeTargetEvents = (targetEl: HTMLElement) => {
      if (targetEl) {
        targetEl.removeEventListener('mouseenter', handleTargetMouseEnter);
        targetEl.removeEventListener('mouseleave', handleTargetMouseLeave);
        targetEl.removeEventListener('focus', handleTargetFocus);
        targetEl.removeEventListener('blur', handleTargetBlur);
      }
    };
    
    // Event handlers
    const handleTargetMouseEnter = () => api.show();
    const handleTargetMouseLeave = () => api.hide();
    const handleTargetFocus = () => api.show();
    const handleTargetBlur = () => api.hide();
    
    // Create the API object
    const api: TooltipComponent = {
      element: component.element,
      target,
      lifecycle,
      
      getClass: component.getClass,
      
      setText(text) {
        // Create a text node
        const contentNode = document.createTextNode(text);
        
        // Clear existing content
        while (component.element.firstChild !== arrowElement) {
          component.element.removeChild(component.element.firstChild);
        }
        
        // Add new content before the arrow
        component.element.insertBefore(contentNode, arrowElement);
        
        // Update position if visible
        if (isVisible) {
          this.updatePosition();
        }
        
        return this;
      },
      
      getText() {
        // Return text content excluding the arrow element
        const clone = component.element.cloneNode(true) as HTMLElement;
        const arrowClone = clone.querySelector(`.${component.getClass('tooltip')}__arrow`);
        if (arrowClone) {
          arrowClone.remove();
        }
        return clone.textContent || '';
      },
      
      setPosition(newPosition) {
        // Update position value
        position = newPosition;
        
        // Update position class
        const baseClass = component.getClass('tooltip');
        
        // Remove existing position classes
        const positionClasses = Object.values(TOOLTIP_POSITIONS).map(p => `${baseClass}--${p}`);
        component.element.classList.remove(...positionClasses);
        
        // Add new position class
        component.element.classList.add(`${baseClass}--${newPosition}`);
        
        // Update position if visible
        if (isVisible) {
          this.updatePosition();
        }
        
        return this;
      },
      
      getPosition() {
        return position;
      },
      
      setTarget(newTarget) {
        // Remove events from old target
        if (target) {
          removeTargetEvents(target);
        }
        
        // Set new target
        target = newTarget;
        this.target = newTarget;
        
        // Set target's aria attributes
        target.setAttribute('aria-describedby', component.element.id);
        
        // Add events to new target
        addTargetEvents(target);
        
        // Update position if visible
        if (isVisible) {
          this.updatePosition();
        }
        
        return this;
      },
      
      show(immediate = false) {
        // Clear any existing timers
        if (showTimer !== null) {
          window.clearTimeout(showTimer);
          showTimer = null;
        }
        
        if (hideTimer !== null) {
          window.clearTimeout(hideTimer);
          hideTimer = null;
        }
        
        const showTooltip = () => {
          if (!target) return this;
          
          // Show the tooltip
          component.element.setAttribute('aria-hidden', 'false');
          component.element.classList.add(`${component.getClass('tooltip')}--visible`);
          isVisible = true;
          
          // Update position
          this.updatePosition();
          
          // Add resize listener
          window.addEventListener('resize', handleWindowResize);
          window.addEventListener('scroll', handleWindowScroll);
        };
        
        if (immediate) {
          showTooltip();
        } else {
          showTimer = window.setTimeout(showTooltip, showDelay);
        }
        
        return this;
      },
      
      hide(immediate = false) {
        // Clear any existing timers
        if (hideTimer !== null) {
          window.clearTimeout(hideTimer);
          hideTimer = null;
        }
        
        if (showTimer !== null) {
          window.clearTimeout(showTimer);
          showTimer = null;
        }
        
        const hideTooltip = () => {
          // Hide the tooltip
          component.element.setAttribute('aria-hidden', 'true');
          component.element.classList.remove(`${component.getClass('tooltip')}--visible`);
          isVisible = false;
          
          // Remove resize and scroll listeners
          window.removeEventListener('resize', handleWindowResize);
          window.removeEventListener('scroll', handleWindowScroll);
        };
        
        if (immediate) {
          hideTooltip();
        } else {
          hideTimer = window.setTimeout(hideTooltip, hideDelay);
        }
        
        return this;
      },
      
      isVisible() {
        return isVisible;
      },
      
      updatePosition() {
        if (!target) return this;
        
        // Calculate position
        const { top, left, arrowPosition } = calculatePosition();
        
        // Update tooltip position
        component.element.style.top = `${Math.round(top)}px`;
        component.element.style.left = `${Math.round(left)}px`;
        
        // Update arrow position
        if (arrowPosition) {
          // Remove existing arrow position classes
          arrowElement.className = `${component.getClass('tooltip')}__arrow`;
          // Add new position class
          arrowElement.classList.add(`${component.getClass('tooltip')}__arrow--${arrowPosition}`);
        }
        
        return this;
      },
      
      destroy() {
        // Clear timers
        if (showTimer !== null) {
          window.clearTimeout(showTimer);
        }
        
        if (hideTimer !== null) {
          window.clearTimeout(hideTimer);
        }
        
        // Remove target events
        if (target) {
          removeTargetEvents(target);
          target.removeAttribute('aria-describedby');
        }
        
        // Remove window events
        window.removeEventListener('resize', handleWindowResize);
        window.removeEventListener('scroll', handleWindowScroll);
        
        // Remove from DOM
        if (component.element.parentNode) {
          component.element.parentNode.removeChild(component.element);
        }
        
        // Call lifecycle destroy
        lifecycle.destroy();
      }
    };
    
    // Window event handlers
    const handleWindowResize = () => {
      api.updatePosition();
    };
    
    const handleWindowScroll = () => {
      api.updatePosition();
    };
    
    return api;
  };

export default withAPI;