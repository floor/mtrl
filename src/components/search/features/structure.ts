// src/components/search/features/structure.ts
import { SearchConfig } from '../types';
import { createElement } from '../../../core/dom/create';

/**
 * Creates the search component DOM structure
 * @param config Search configuration
 * @returns Component enhancer with DOM structure
 */
export const withStructure = (config: SearchConfig) => component => {
  // Get initial config values
  const isDisabled = config.disabled === true;
  const variant = config.variant || 'bar';
  const isViewMode = variant === 'view';
  const placeholder = config.placeholder || 'Search';
  const value = config.value || '';
  
  // Get prefixed class names
  const getClass = (className) => component.getClass(className);
  
  // Build attributes object for the input
  const inputAttrs = {
    'type': 'text',
    'placeholder': placeholder,
    'value': value,
    'aria-label': placeholder
  };
  
  // Only add disabled attribute if the input should be disabled
  if (isDisabled) {
    inputAttrs['disabled'] = 'disabled';
  }
  
  // Create container element
  const container = createElement({
    tag: 'div',
    className: getClass('search-container'),
    container: component.element,
    attrs: {
      style: `
        ${config.minWidth ? `min-width: ${config.minWidth}px;` : ''}
        ${config.maxWidth ? `max-width: ${config.maxWidth}px;` : ''}
        ${config.fullWidth ? 'width: 100%;' : ''}
      `
    }
  });
  
  // Create leading icon
  const leadingIcon = createElement({
    tag: 'div',
    className: getClass('search-leading-icon'),
    container: container,
    html: config.leadingIcon || '',
    attrs: {
      'role': 'button',
      'tabindex': isDisabled ? '-1' : '0',
      'aria-label': 'Search'
    }
  });
  
  // Create input wrapper
  const inputWrapper = createElement({
    tag: 'div',
    className: getClass('search-input-wrapper'),
    container: container
  });
  
  // Create input element with properly handled disabled state
  const input = createElement({
    tag: 'input',
    className: getClass('search-input'),
    container: inputWrapper,
    attrs: inputAttrs
  });
  
  // Create clear button
  const clearButton = createElement({
    tag: 'div',
    className: [
      getClass('search-clear-button'),
      value ? '' : getClass('search-clear-button--hidden')
    ],
    container: container,
    html: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    attrs: {
      'role': 'button',
      'tabindex': isDisabled || !value ? '-1' : '0',
      'aria-label': 'Clear search'
    }
  });
  
  // Create optional trailing elements
  let trailingIcon, trailingIcon2, avatar;
  
  if (config.trailingIcon) {
    trailingIcon = createElement({
      tag: 'div',
      className: getClass('search-trailing-icon'),
      container: container,
      html: config.trailingIcon,
      attrs: {
        'role': 'button',
        'tabindex': isDisabled ? '-1' : '0',
        'aria-label': 'Search option'
      }
    });
  }
  
  if (config.trailingIcon2) {
    trailingIcon2 = createElement({
      tag: 'div',
      className: getClass('search-trailing-icon'),
      container: container,
      html: config.trailingIcon2,
      attrs: {
        'role': 'button',
        'tabindex': isDisabled ? '-1' : '0',
        'aria-label': 'Search option'
      }
    });
  }
  
  if (config.avatar) {
    avatar = createElement({
      tag: 'div',
      className: getClass('search-avatar'),
      container: container,
      html: config.avatar
    });
  }
  
  // Create divider and suggestions container for view variant
  let divider, suggestionsContainer;
  
  if (isViewMode || config.suggestions) {
    divider = createElement({
      tag: 'div',
      className: getClass('search-divider')
    });
    
    suggestionsContainer = createElement({
      tag: 'div',
      className: getClass('search-suggestions-container'),
      container: component.element
    });
  }
  
  // Add component base class and accessibility attributes
  component.element.classList.add(component.getClass('search'));
  component.element.setAttribute('role', 'search');
  component.element.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
  
  // Apply style classes
  applyStyleClasses(component, config, isViewMode, isDisabled);
  
  // Return enhanced component with structure
  return {
    ...component,
    structure: {
      container,
      input,
      inputWrapper,
      leadingIcon,
      clearButton,
      trailingIcon,
      trailingIcon2,
      avatar,
      divider,
      suggestionsContainer
    }
  };
};

/**
 * Applies style classes based on configuration
 */
function applyStyleClasses(component, config, isViewMode, isDisabled) {
  const baseClass = component.getClass('search');
  
  // Apply variant class
  component.element.classList.add(`${baseClass}--${config.variant || 'bar'}`);
    
  // Apply disabled class if needed
  if (isDisabled) {
    component.element.classList.add(`${baseClass}--disabled`);
  }
  
  // Apply expanded class for view mode
  if (isViewMode) {
    component.element.classList.add(`${baseClass}--expanded`);
  }
  
  // Apply fullwidth class if needed
  if (config.fullWidth) {
    component.element.classList.add(`${baseClass}--fullwidth`);
  }
}