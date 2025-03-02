// src/core/compose/features/with-title.ts
/**
 * Adds title functionality to a component
 * @param {Object} config - Component configuration with optional title
 * @returns {Function} Higher-order function that adds title to a component
 */
export const withTitle = (config) => (component) => {
  const { title = '' } = config;
  
  // Only create title element if title is provided or dragHandle is enabled
  let titleElement = null;
  
  if (title || config.dragHandle) {
    // Create title element
    titleElement = document.createElement('div');
    titleElement.className = `${component.getClass('sheet')}-title`;
    
    if (title) {
      titleElement.textContent = title;
    }
    
    // Insert before content
    component.container.insertBefore(titleElement, component.container.firstChild);
    
    // Add drag handle if enabled
    if (config.dragHandle) {
      const handleElement = document.createElement('div');
      handleElement.className = `${component.getClass('sheet')}-handle`;
      component.container.insertBefore(handleElement, component.container.firstChild);
      
      // Store handle element reference
      component.dragHandle = {
        element: handleElement,
        
        /**
         * Sets the visibility of the drag handle
         * @param {boolean} visible - Whether the handle should be visible
         */
        setVisible(visible: boolean) {
          handleElement.style.display = visible ? 'block' : 'none';
        }
      };
    }
  }
  
  return {
    ...component,
    title: {
      /**
       * Sets the title text
       * @param {string} text - Title text
       * @returns {Object} Title API for chaining
       */
      setTitle(text: string) {
        if (!titleElement && text) {
          // Create title element if it doesn't exist
          titleElement = document.createElement('div');
          titleElement.className = `${component.getClass('sheet')}-title`;
          component.container.insertBefore(titleElement, component.content.getElement());
        }
        
        if (titleElement) {
          titleElement.textContent = text;
        }
        
        return this;
      },
      
      /**
       * Gets the current title text
       * @returns {string} Title text or empty string
       */
      getTitle() {
        return titleElement ? titleElement.textContent || '' : '';
      },
      
      /**
       * Gets the title DOM element
       * @returns {HTMLElement|null} Title element or null
       */
      getElement() {
        return titleElement;
      }
    }
  };
};