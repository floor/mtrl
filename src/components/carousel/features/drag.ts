// src/components/carousel/features/drag.ts
import { CAROUSEL_EVENTS } from '../constants';
import { CarouselConfig } from '../types';

/**
 * Adds drag functionality to the carousel component
 * @param {CarouselConfig} config - Carousel configuration
 * @returns {Function} Higher-order function that adds drag navigation feature
 */
export const withDrag = (config: CarouselConfig) => (component) => {
  let startX: number;
  let startScrollLeft: number;
  let currentX: number;
  let isDragging = false;
  
  // Handle pointer events
  const handlePointerDown = (event: PointerEvent) => {
    // Only handle primary button (usually left click)
    if (event.button !== 0) return;
    
    startX = event.clientX;
    startScrollLeft = component.slidesContainer.scrollLeft;
    currentX = startX;
    isDragging = true;
    
    // Set dragging state via data attribute
    component.slidesContainer.dataset.touchAction = 'none';
    component.element.dataset.dragging = 'true';
    
    // Prevent default behaviors that might cause resistance
    component.slidesContainer.style.scrollBehavior = 'auto';
    
    // Capture pointer to receive events outside element
    component.element.setPointerCapture(event.pointerId);
    
    // Stop click events during drag
    event.preventDefault();
  };
  
  const handlePointerMove = (event: PointerEvent) => {
    if (!isDragging) return;
    
    // Calculate how far the pointer has moved
    const dx = event.clientX - startX;
    
    // Directly set scroll position without any easing or calculations
    component.slidesContainer.scrollLeft = startScrollLeft - dx;
    currentX = event.clientX;
    
    event.preventDefault();
  };
  
  const handlePointerUp = (event: PointerEvent) => {
    if (!isDragging) return;
    
    isDragging = false;
    delete component.element.dataset.dragging;
    
    // Restore smooth scrolling after drag
    component.slidesContainer.style.scrollBehavior = '';
    
    // Release pointer capture
    component.element.releasePointerCapture(event.pointerId);
  };
  
  const handlePointerCancel = (event: PointerEvent) => {
    if (isDragging) {
      isDragging = false;
      delete component.element.dataset.dragging;
      component.element.releasePointerCapture(event.pointerId);
    }
  };
  
  // Prevent default on scroll to handle it ourselves
  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    component.slidesContainer.scrollLeft += event.deltaY;
  };
  
  // Add data attribute for draggable UI
  component.element.dataset.swipe = 'true';
  
  // Add pointer event listeners
  component.slidesContainer.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerCancel);
  component.slidesContainer.addEventListener('wheel', handleWheel, { passive: false });
  
  // Add keyboard navigation
  component.element.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowLeft':
        component.slidesContainer.scrollBy({ left: -200, behavior: 'smooth' });
        event.preventDefault();
        break;
      case 'ArrowRight':
        component.slidesContainer.scrollBy({ left: 200, behavior: 'smooth' });
        event.preventDefault();
        break;
    }
  });
  
  // Return the component with additional cleanup
  return {
    ...component,
    
    // Add drag cleanup to lifecycle
    lifecycle: {
      ...component.lifecycle,
      destroy: () => {
        // Remove pointer event listeners
        component.slidesContainer.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerCancel);
        component.slidesContainer.removeEventListener('wheel', handleWheel);
        component.element.removeEventListener('keydown', null);
        
        // Call original destroy if it exists
        if (component.lifecycle && component.lifecycle.destroy) {
          component.lifecycle.destroy();
        }
      }
    }
  };
};