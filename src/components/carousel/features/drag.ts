// src/components/carousel/features/drag.ts
import { CarouselConfig } from "../types";

/**
 * Adds drag functionality to the carousel component with Material Design 3 scroll behavior support
 *
 * @param {CarouselConfig} config - Carousel configuration
 * @returns {Function} Higher-order function that adds drag navigation feature
 */
export const withDrag = (config: CarouselConfig) => (component) => {
  let startX: number;
  let startScrollLeft: number;
  let currentX: number;
  let isDragging = false;
  let velocity = 0;
  let lastTimestamp = 0;
  let animationFrame: number;

  // Scroll behavior from config
  const scrollBehavior = config.scrollBehavior || "default";

  // Handle pointer events
  const handlePointerDown = (event: PointerEvent) => {
    // Only handle primary button (usually left click)
    if (event.button !== 0) return;

    // Cancel any ongoing scroll animations
    cancelAnimationFrame(animationFrame);

    startX = event.clientX;
    startScrollLeft = component.slidesContainer.scrollLeft;
    currentX = startX;
    isDragging = true;
    lastTimestamp = Date.now();
    velocity = 0;

    // Set dragging state via data attribute
    component.slidesContainer.dataset.touchAction = "none";
    component.element.dataset.dragging = "true";

    // Prevent default behaviors that might cause resistance
    component.slidesContainer.style.scrollBehavior = "auto";

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

    // Calculate velocity for momentum scrolling
    const now = Date.now();
    const dt = now - lastTimestamp;

    if (dt > 0) {
      const dx = event.clientX - currentX;
      velocity = dx / dt; // Pixels per millisecond
    }

    currentX = event.clientX;
    lastTimestamp = now;

    event.preventDefault();
  };

  /**
   * Finds the nearest snap position based on current scroll position
   * Used for snap scrolling behavior
   */
  const findSnapPosition = () => {
    const slideElements = component.slides.getElements();
    const containerWidth = component.slidesContainer.clientWidth;
    const scrollLeft = component.slidesContainer.scrollLeft;

    // For center-aligned hero layout
    const isCentered = config.layout === "hero" && config.centered;

    let closestPosition = 0;
    let closestDistance = Infinity;

    // Find the closest slide position for snapping
    slideElements.forEach((slide) => {
      let targetPosition;

      if (isCentered) {
        // For centered layouts, snap to center-aligned position
        const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
        targetPosition = slideCenter - containerWidth / 2;
      } else {
        // For standard layouts, snap to start-aligned position
        targetPosition = slide.offsetLeft;
      }

      const distance = Math.abs(targetPosition - scrollLeft);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestPosition = targetPosition;
      }
    });

    return closestPosition;
  };

  /**
   * Animates scroll with momentum and snapping
   * @param {number} startPosition - Starting scroll position
   * @param {number} endPosition - Target scroll position
   * @param {number} startVelocity - Initial velocity in pixels/ms
   */
  const animateScroll = (
    startPosition: number,
    endPosition: number,
    startVelocity: number
  ) => {
    const startTime = Date.now();
    const distance = endPosition - startPosition;

    // Base animation duration on distance and velocity
    // Faster flicks = shorter duration
    let duration = 500; // Base duration in ms

    if (Math.abs(startVelocity) > 0.5) {
      // For faster flicks, reduce duration
      duration = Math.min(duration, 300);
    }

    const animateStep = () => {
      const elapsed = Date.now() - startTime;
      let progress = Math.min(elapsed / duration, 1);

      // Ease out cubic function for smooth deceleration
      progress = 1 - Math.pow(1 - progress, 3);

      const currentPosition = startPosition + distance * progress;
      component.slidesContainer.scrollLeft = currentPosition;

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateStep);
      }
    };

    animationFrame = requestAnimationFrame(animateStep);
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (!isDragging) return;

    isDragging = false;
    delete component.element.dataset.dragging;

    // Release pointer capture
    component.element.releasePointerCapture(event.pointerId);

    // Handle scroll behavior based on config
    if (scrollBehavior === "snap") {
      // Find nearest snap position
      const snapPosition = findSnapPosition();

      // Use velocity for a more natural feel
      animateScroll(
        component.slidesContainer.scrollLeft,
        snapPosition,
        velocity
      );
    } else if (Math.abs(velocity) > 0.5) {
      // For standard scrolling, add momentum effect for fast flicks
      const momentumDistance = velocity * 100; // Arbitrary multiplier for momentum
      const targetPosition =
        component.slidesContainer.scrollLeft - momentumDistance;

      animateScroll(
        component.slidesContainer.scrollLeft,
        targetPosition,
        velocity
      );
    }

    // Reset velocity
    velocity = 0;

    // Restore scrolling behavior
    setTimeout(() => {
      component.slidesContainer.style.scrollBehavior = "";
    }, 0);
  };

  const handlePointerCancel = (event: PointerEvent) => {
    if (isDragging) {
      isDragging = false;
      delete component.element.dataset.dragging;
      component.element.releasePointerCapture(event.pointerId);

      // Restore scrolling behavior
      component.slidesContainer.style.scrollBehavior = "";
    }
  };

  /**
   * Handle wheel events for horizontal scrolling
   * @param {WheelEvent} event - Wheel event
   */
  const handleWheel = (event: WheelEvent) => {
    // For full-screen layout, allow vertical scrolling
    if (config.layout === "full-screen") {
      // Let the default scroll behavior happen
      return;
    }

    // For other layouts, transform vertical scrolling to horizontal
    event.preventDefault();

    // Determine the scroll delta
    const delta = event.deltaY || event.deltaX;

    // Calculate scroll increment based on wheel delta
    const scrollIncrement = delta * 0.5;

    // For snap scrolling, we want to snap after wheel events
    if (scrollBehavior === "snap") {
      // First scroll normally
      component.slidesContainer.scrollLeft += scrollIncrement;

      // Clear previous snap timeout
      clearTimeout(component["wheelSnapTimeout"]);

      // Set timeout to snap after wheel motion stops
      component["wheelSnapTimeout"] = setTimeout(() => {
        const snapPosition = findSnapPosition();

        // Animate to snap position
        animateScroll(component.slidesContainer.scrollLeft, snapPosition, 0);
      }, 150); // Short delay to detect end of wheel motion
    } else {
      // Standard scrolling - just scroll directly
      component.slidesContainer.scrollLeft += scrollIncrement;
    }
  };

  /**
   * Apply parallax effect to slides during scroll
   * Used for multi-browse layout with different sized items
   */
  const applyParallaxEffect = () => {
    // Only apply for multi-browse layout
    if (
      config.layout !== "multi-browse" ||
      !component.element.dataset.enableParallax
    ) {
      return;
    }

    const slides = component.slides.getElements();
    const containerWidth = component.slidesContainer.clientWidth;
    const scrollLeft = component.slidesContainer.scrollLeft;

    slides.forEach((slide) => {
      const slideLeft = slide.offsetLeft;
      const slideWidth = slide.offsetWidth;

      // Calculate how centered the slide is in the container
      const slideCenterX = slideLeft + slideWidth / 2;
      const containerCenterX = scrollLeft + containerWidth / 2;
      const distanceFromCenter = slideCenterX - containerCenterX;

      // Normalize to a -1 to 1 range
      const normalizedDistance = Math.max(
        -1,
        Math.min(1, distanceFromCenter / (containerWidth / 2))
      );

      // Apply a subtle parallax effect
      // Move images in the opposite direction of the scroll by a small amount
      const slideImage = slide.querySelector(
        `.${component.getClass("carousel")}-slide-image img`
      );
      if (slideImage) {
        (slideImage as HTMLElement).style.transform = `translateX(${
          normalizedDistance * -5
        }%)`;
      }
    });
  };

  // Handle scroll events for parallax and active slide detection
  const handleScroll = () => {
    // Apply parallax effect if enabled
    applyParallaxEffect();
  };

  // Add parallax data attribute if it's multi-browse
  if (config.layout === "multi-browse") {
    component.element.dataset.enableParallax = "true";
  }

  // Add data attribute for draggable UI
  component.element.dataset.swipe = "true";

  // Add pointer event listeners
  component.slidesContainer.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("pointercancel", handlePointerCancel);

  // Add wheel event listener with appropriate passive setting
  component.slidesContainer.addEventListener("wheel", handleWheel, {
    passive: false,
  });

  // Add scroll event listener for parallax effect
  component.slidesContainer.addEventListener("scroll", handleScroll, {
    passive: true,
  });

  // Add keyboard navigation
  const handleKeyDown = (event: KeyboardEvent) => {
    // Only handle keyboard navigation when the carousel has focus
    if (component.element !== document.activeElement) {
      return;
    }

    switch (event.key) {
      case "ArrowLeft":
        if (component.prev) {
          component.prev();
        } else {
          // Fallback if prev method not available
          component.slidesContainer.scrollBy({
            left: -200,
            behavior: scrollBehavior === "snap" ? "smooth" : "auto",
          });
        }
        event.preventDefault();
        break;

      case "ArrowRight":
        if (component.next) {
          component.next();
        } else {
          // Fallback if next method not available
          component.slidesContainer.scrollBy({
            left: 200,
            behavior: scrollBehavior === "snap" ? "smooth" : "auto",
          });
        }
        event.preventDefault();
        break;

      case "Home":
        // Go to first slide
        if (component.goTo) {
          component.goTo(0);
        }
        event.preventDefault();
        break;

      case "End":
        // Go to last slide
        if (component.goTo && component.slides.getCount) {
          component.goTo(component.slides.getCount() - 1);
        }
        event.preventDefault();
        break;
    }
  };

  // Make the carousel focusable for keyboard navigation
  component.element.setAttribute("tabindex", "0");
  component.element.addEventListener("keydown", handleKeyDown);

  // Add aria attributes for accessibility
  component.element.setAttribute("aria-label", "Carousel");

  // Return the component with additional cleanup
  return {
    ...component,

    // Add drag cleanup to lifecycle
    lifecycle: {
      ...component.lifecycle,
      destroy: () => {
        // Cancel any animations
        cancelAnimationFrame(animationFrame);

        // Remove pointer event listeners
        component.slidesContainer.removeEventListener(
          "pointerdown",
          handlePointerDown
        );
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerCancel);

        // Remove wheel and scroll event listeners
        component.slidesContainer.removeEventListener("wheel", handleWheel);
        component.slidesContainer.removeEventListener("scroll", handleScroll);

        // Remove keyboard event listener
        component.element.removeEventListener("keydown", handleKeyDown);

        // Call original destroy if it exists
        if (component.lifecycle && component.lifecycle.destroy) {
          component.lifecycle.destroy();
        }
      },
    },
  };
};
