// src/components/sheet/features/content.ts
/**
 * Adds content management functionality to a component
 * @param {Object} config - Component configuration with optional content
 * @returns {Function} Higher-order function that adds content to a component
 */
export const withContent = (config) => (component) => {
  const { content = '' } = config;
  
  // Create content element
  const contentElement = document.createElement('div');
  contentElement.className = `${component.getClass('sheet')}-content`;
  contentElement.innerHTML = content;
  
  // Add content element to component
  component.container = document.createElement('div');
  component.container.className = `${component.getClass('sheet')}-container`;
  component.container.appendChild(contentElement);
  component.element.appendChild(component.container);
  
  return {
    ...component,
    content: {
      /**
       * Sets the HTML content
       * @param {string} html - HTML content
       * @returns {Object} Content API for chaining
       */
      setContent(html: string) {
        contentElement.innerHTML = html;
        return this;
      },
      
      /**
       * Gets the current HTML content
       * @returns {string} HTML content
       */
      getContent() {
        return contentElement.innerHTML;
      },
      
      /**
       * Gets the content DOM element
       * @returns {HTMLElement} Content element
       */
      getElement() {
        return contentElement;
      }
    }
  };
};