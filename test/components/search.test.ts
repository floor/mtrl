// test/components/search.test.ts
import { describe, test, expect } from 'bun:test';
import { 
  type SearchComponent,
  type SearchConfig,
  type NavVariant,
  type SearchEventType,
  type SearchEvent
} from '../../src/components/search/types';

// Constants for search variants
const SEARCH_VARIANTS = {
  RAIL: 'rail',
  DRAWER: 'drawer',
  BAR: 'bar',
  MODAL: 'modal',
  STANDARD: 'standard'
} as const;

// Constants for search events
const SEARCH_EVENTS = {
  FOCUS: 'focus',
  BLUR: 'blur',
  INPUT: 'input',
  SUBMIT: 'submit',
  CLEAR: 'clear',
  ICON_CLICK: 'iconClick'
} as const;

// Mock search implementation
const createMockSearch = (config: SearchConfig = {}): SearchComponent => {
  // Create main container element
  const element = document.createElement('div');
  element.className = 'mtrl-search';
  
  // Default settings
  const settings = {
    variant: config.variant || SEARCH_VARIANTS.STANDARD,
    disabled: config.disabled || false,
    placeholder: config.placeholder || 'Search',
    value: config.value || '',
    leadingIcon: config.leadingIcon !== undefined ? config.leadingIcon : '<svg>search</svg>',
    trailingIcon: config.trailingIcon || '',
    trailingIcon2: config.trailingIcon2 || '',
    avatar: config.avatar || '',
    showClearButton: config.showClearButton !== undefined ? config.showClearButton : true,
    suggestions: config.suggestions || [],
    showDividers: config.showDividers || false,
    expanded: false,
    hasFocus: false
  };
  
  // Apply variant class
  element.classList.add(`mtrl-search--${settings.variant}`);
  
  // Apply disabled state
  if (settings.disabled) {
    element.classList.add('mtrl-search--disabled');
  }
  
  // Apply additional classes
  if (config.class) {
    const classes = config.class.split(' ');
    classes.forEach(className => element.classList.add(className));
  }
  
  // Apply width styles
  if (config.fullWidth) {
    element.classList.add('mtrl-search--full-width');
    element.style.width = '100%';
  } else {
    if (config.maxWidth) {
      element.style.maxWidth = `${config.maxWidth}px`;
    }
    
    if (config.minWidth) {
      element.style.minWidth = `${config.minWidth}px`;
    }
  }
  
  // Create search input container
  const inputContainer = document.createElement('div');
  inputContainer.className = 'mtrl-search__container';
  
  // Create leading icon if provided
  if (settings.leadingIcon && settings.leadingIcon !== 'none') {
    const leadingIconElement = document.createElement('div');
    leadingIconElement.className = 'mtrl-search__leading-icon';
    leadingIconElement.innerHTML = settings.leadingIcon;
    inputContainer.appendChild(leadingIconElement);
  }
  
  // Create search input
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'mtrl-search__input';
  input.placeholder = settings.placeholder;
  input.value = settings.value;
  input.disabled = settings.disabled;
  inputContainer.appendChild(input);
  
  // Create clear button if enabled
  let clearButton: HTMLElement | null = null;
  if (settings.showClearButton) {
    clearButton = document.createElement('button');
    clearButton.className = 'mtrl-search__clear';
    clearButton.type = 'button';
    clearButton.innerHTML = '<svg>clear</svg>';
    clearButton.style.display = settings.value ? 'block' : 'none';
    inputContainer.appendChild(clearButton);
  }
  
  // Create avatar if provided
  if (settings.avatar) {
    const avatarElement = document.createElement('div');
    avatarElement.className = 'mtrl-search__avatar';
    avatarElement.innerHTML = settings.avatar;
    inputContainer.appendChild(avatarElement);
  }
  
  // Create trailing icons if provided
  if (settings.trailingIcon) {
    const trailingIconElement = document.createElement('div');
    trailingIconElement.className = 'mtrl-search__trailing-icon';
    trailingIconElement.innerHTML = settings.trailingIcon;
    inputContainer.appendChild(trailingIconElement);
  }
  
  if (settings.trailingIcon2) {
    const trailingIcon2Element = document.createElement('div');
    trailingIcon2Element.className = 'mtrl-search__trailing-icon';
    trailingIcon2Element.innerHTML = settings.trailingIcon2;
    inputContainer.appendChild(trailingIcon2Element);
  }
  
  element.appendChild(inputContainer);
  
  // Create suggestions container if suggestions provided
  let suggestionsContainer: HTMLElement | null = null;
  if (settings.suggestions.length > 0) {
    suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'mtrl-search__suggestions';
    suggestionsContainer.style.display = 'none';
    
    const renderSuggestions = () => {
      if (!suggestionsContainer) return;
      
      suggestionsContainer.innerHTML = '';
      
      settings.suggestions.forEach((suggestion, index) => {
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'mtrl-search__suggestion';
        
        if (typeof suggestion === 'string') {
          suggestionElement.textContent = suggestion;
          suggestionElement.setAttribute('data-value', suggestion);
        } else {
          if (suggestion.icon) {
            const iconElement = document.createElement('span');
            iconElement.className = 'mtrl-search__suggestion-icon';
            iconElement.innerHTML = suggestion.icon;
            suggestionElement.appendChild(iconElement);
          }
          
          const textElement = document.createElement('span');
          textElement.className = 'mtrl-search__suggestion-text';
          textElement.textContent = suggestion.text;
          suggestionElement.appendChild(textElement);
          
          suggestionElement.setAttribute('data-value', suggestion.value || suggestion.text);
        }
        
        // Add divider if enabled and not the last item
        if (settings.showDividers && index < settings.suggestions.length - 1) {
          const divider = document.createElement('div');
          divider.className = 'mtrl-search__suggestion-divider';
          suggestionsContainer.appendChild(suggestionElement);
          suggestionsContainer.appendChild(divider);
        } else {
          suggestionsContainer.appendChild(suggestionElement);
        }
        
        // Handle suggestion click
        suggestionElement.addEventListener('click', () => {
          const value = suggestionElement.getAttribute('data-value') || '';
          search.setValue(value, true);
          search.submit();
          search.showSuggestions(false);
        });
      });
    };
    
    renderSuggestions();
    element.appendChild(suggestionsContainer);
  }
  
  // Track event handlers
  const eventHandlers: Record<string, Function[]> = {};
  
  // Emit an event
  const emit = (event: SearchEventType, originalEvent?: Event | null): boolean => {
    let defaultPrevented = false;
    
    const eventData: SearchEvent = {
      search,
      value: input.value,
      originalEvent: originalEvent || null,
      preventDefault: () => {
        defaultPrevented = true;
      },
      defaultPrevented: false
    };
    
    // Call handlers from config.on
    if (config.on && config.on[event]) {
      config.on[event]!(eventData);
    }
    
    // Call registered event handlers
    if (eventHandlers[event]) {
      eventHandlers[event].forEach(handler => handler(eventData));
    }
    
    // Direct callback handlers
    if (event === SEARCH_EVENTS.SUBMIT && config.onSubmit) {
      config.onSubmit(input.value);
    } else if (event === SEARCH_EVENTS.INPUT && config.onInput) {
      config.onInput(input.value);
    } else if (event === SEARCH_EVENTS.CLEAR && config.onClear) {
      config.onClear();
    }
    
    eventData.defaultPrevented = defaultPrevented;
    return defaultPrevented;
  };
  
  // Set up event handlers
  input.addEventListener('focus', (e) => {
    if (!settings.disabled) {
      settings.hasFocus = true;
      element.classList.add('mtrl-search--focused');
      
      if (suggestionsContainer && settings.suggestions.length > 0) {
        suggestionsContainer.style.display = 'block';
      }
      
      emit(SEARCH_EVENTS.FOCUS, e);
    }
  });
  
  input.addEventListener('blur', (e) => {
    settings.hasFocus = false;
    element.classList.remove('mtrl-search--focused');
    
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (suggestionsContainer && !settings.hasFocus) {
        suggestionsContainer.style.display = 'none';
      }
    }, 200);
    
    emit(SEARCH_EVENTS.BLUR, e);
  });
  
  input.addEventListener('input', (e) => {
    if (!settings.disabled) {
      if (clearButton) {
        clearButton.style.display = input.value ? 'block' : 'none';
      }
      
      emit(SEARCH_EVENTS.INPUT, e);
    }
  });
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !settings.disabled) {
      search.submit();
    }
  });
  
  // Clear button handler
  if (clearButton) {
    clearButton.addEventListener('click', (e) => {
      if (!settings.disabled) {
        search.clear();
        emit(SEARCH_EVENTS.CLEAR, e);
      }
    });
  }
  
  // Create the search component
  const search: SearchComponent = {
    element,
    
    setValue: (value: string, triggerEvent: boolean = false) => {
      input.value = value;
      
      if (clearButton) {
        clearButton.style.display = value ? 'block' : 'none';
      }
      
      if (triggerEvent) {
        emit(SEARCH_EVENTS.INPUT);
      }
      
      return search;
    },
    
    getValue: () => input.value,
    
    setPlaceholder: (text: string) => {
      settings.placeholder = text;
      input.placeholder = text;
      return search;
    },
    
    getPlaceholder: () => settings.placeholder,
    
    setLeadingIcon: (iconHtml: string) => {
      const existingIcon = element.querySelector('.mtrl-search__leading-icon');
      
      if (iconHtml === 'none') {
        if (existingIcon) {
          existingIcon.remove();
        }
      } else {
        if (existingIcon) {
          existingIcon.innerHTML = iconHtml;
        } else {
          const leadingIconElement = document.createElement('div');
          leadingIconElement.className = 'mtrl-search__leading-icon';
          leadingIconElement.innerHTML = iconHtml;
          inputContainer.insertBefore(leadingIconElement, inputContainer.firstChild);
        }
      }
      
      settings.leadingIcon = iconHtml;
      return search;
    },
    
    setTrailingIcon: (iconHtml: string) => {
      const existingIcon = element.querySelector('.mtrl-search__trailing-icon');
      
      if (iconHtml === 'none') {
        if (existingIcon) {
          existingIcon.remove();
        }
      } else {
        if (existingIcon) {
          existingIcon.innerHTML = iconHtml;
        } else {
          const trailingIconElement = document.createElement('div');
          trailingIconElement.className = 'mtrl-search__trailing-icon';
          trailingIconElement.innerHTML = iconHtml;
          inputContainer.appendChild(trailingIconElement);
        }
      }
      
      settings.trailingIcon = iconHtml;
      return search;
    },
    
    setTrailingIcon2: (iconHtml: string) => {
      const existingIcons = element.querySelectorAll('.mtrl-search__trailing-icon');
      const existingIcon2 = existingIcons.length > 1 ? existingIcons[1] : null;
      
      if (iconHtml === 'none') {
        if (existingIcon2) {
          existingIcon2.remove();
        }
      } else {
        if (existingIcon2) {
          existingIcon2.innerHTML = iconHtml;
        } else {
          const trailingIcon2Element = document.createElement('div');
          trailingIcon2Element.className = 'mtrl-search__trailing-icon';
          trailingIcon2Element.innerHTML = iconHtml;
          inputContainer.appendChild(trailingIcon2Element);
        }
      }
      
      settings.trailingIcon2 = iconHtml;
      return search;
    },
    
    setAvatar: (avatarHtml: string) => {
      const existingAvatar = element.querySelector('.mtrl-search__avatar');
      
      if (avatarHtml === 'none') {
        if (existingAvatar) {
          existingAvatar.remove();
        }
      } else {
        if (existingAvatar) {
          existingAvatar.innerHTML = avatarHtml;
        } else {
          const avatarElement = document.createElement('div');
          avatarElement.className = 'mtrl-search__avatar';
          avatarElement.innerHTML = avatarHtml;
          inputContainer.appendChild(avatarElement);
        }
      }
      
      settings.avatar = avatarHtml;
      return search;
    },
    
    showClearButton: (show: boolean) => {
      settings.showClearButton = show;
      
      if (show) {
        if (!clearButton) {
          clearButton = document.createElement('button');
          clearButton.className = 'mtrl-search__clear';
          clearButton.type = 'button';
          clearButton.innerHTML = '<svg>clear</svg>';
          
          clearButton.addEventListener('click', (e) => {
            if (!settings.disabled) {
              search.clear();
              emit(SEARCH_EVENTS.CLEAR, e);
            }
          });
          
          inputContainer.appendChild(clearButton);
        }
        
        clearButton.style.display = input.value ? 'block' : 'none';
      } else {
        if (clearButton) {
          clearButton.remove();
          clearButton = null;
        }
      }
      
      return search;
    },
    
    setSuggestions: (suggestions: string[] | Array<{text: string, value?: string, icon?: string}>) => {
      settings.suggestions = suggestions;
      
      if (suggestions.length > 0) {
        if (!suggestionsContainer) {
          suggestionsContainer = document.createElement('div');
          suggestionsContainer.className = 'mtrl-search__suggestions';
          suggestionsContainer.style.display = settings.hasFocus ? 'block' : 'none';
          element.appendChild(suggestionsContainer);
        }
        
        suggestionsContainer.innerHTML = '';
        
        suggestions.forEach((suggestion, index) => {
          const suggestionElement = document.createElement('div');
          suggestionElement.className = 'mtrl-search__suggestion';
          
          if (typeof suggestion === 'string') {
            suggestionElement.textContent = suggestion;
            suggestionElement.setAttribute('data-value', suggestion);
          } else {
            if (suggestion.icon) {
              const iconElement = document.createElement('span');
              iconElement.className = 'mtrl-search__suggestion-icon';
              iconElement.innerHTML = suggestion.icon;
              suggestionElement.appendChild(iconElement);
            }
            
            const textElement = document.createElement('span');
            textElement.className = 'mtrl-search__suggestion-text';
            textElement.textContent = suggestion.text;
            suggestionElement.appendChild(textElement);
            
            suggestionElement.setAttribute('data-value', suggestion.value || suggestion.text);
          }
          
          // Add divider if enabled and not the last item
          if (settings.showDividers && index < suggestions.length - 1) {
            const divider = document.createElement('div');
            divider.className = 'mtrl-search__suggestion-divider';
            suggestionsContainer.appendChild(suggestionElement);
            suggestionsContainer.appendChild(divider);
          } else {
            suggestionsContainer.appendChild(suggestionElement);
          }
          
          // Handle suggestion click
          suggestionElement.addEventListener('click', () => {
            const value = suggestionElement.getAttribute('data-value') || '';
            search.setValue(value, true);
            search.submit();
            search.showSuggestions(false);
          });
        });
      } else if (suggestionsContainer) {
        suggestionsContainer.remove();
        suggestionsContainer = null;
      }
      
      return search;
    },
    
    showSuggestions: (show: boolean) => {
      if (suggestionsContainer) {
        suggestionsContainer.style.display = show ? 'block' : 'none';
      }
      
      return search;
    },
    
    focus: () => {
      if (!settings.disabled) {
        input.focus();
      }
      
      return search;
    },
    
    blur: () => {
      input.blur();
      return search;
    },
    
    expand: () => {
      if (settings.variant === SEARCH_VARIANTS.BAR && !settings.expanded) {
        settings.expanded = true;
        element.classList.add('mtrl-search--expanded');
        input.focus();
      }
      
      return search;
    },
    
    collapse: () => {
      if (settings.variant === SEARCH_VARIANTS.BAR && settings.expanded) {
        settings.expanded = false;
        element.classList.remove('mtrl-search--expanded');
        input.blur();
      }
      
      return search;
    },
    
    clear: () => {
      input.value = '';
      
      if (clearButton) {
        clearButton.style.display = 'none';
      }
      
      emit(SEARCH_EVENTS.CLEAR);
      
      return search;
    },
    
    submit: () => {
      emit(SEARCH_EVENTS.SUBMIT);
      return search;
    },
    
    enable: () => {
      settings.disabled = false;
      input.disabled = false;
      element.classList.remove('mtrl-search--disabled');
      return search;
    },
    
    disable: () => {
      settings.disabled = true;
      input.disabled = true;
      element.classList.add('mtrl-search--disabled');
      return search;
    },
    
    isDisabled: () => settings.disabled,
    
    on: (event: SearchEventType, handler: (event: SearchEvent) => void) => {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      
      eventHandlers[event].push(handler);
      return search;
    },
    
    off: (event: SearchEventType, handler: (event: SearchEvent) => void) => {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      
      return search;
    },
    
    destroy: () => {
      // Remove element from DOM if it has a parent
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      
      // Clear event handlers
      for (const event in eventHandlers) {
        eventHandlers[event] = [];
      }
    }
  };
  
  return search;
};

describe('Search Component', () => {
  test('should create a search component', () => {
    const search = createMockSearch({
      placeholder: 'Search items'
    });
    
    expect(search.element).toBeDefined();
    expect(search.element.tagName).toBe('DIV');
    expect(search.element.className).toContain('mtrl-search');
    
    const input = search.element.querySelector('input');
    expect(input).toBeDefined();
    expect(input?.className).toContain('mtrl-search__input');
    expect(input?.placeholder).toBe('Search items');
  });
  
  test('should apply variant classes', () => {
    const variants: NavVariant[] = [
      SEARCH_VARIANTS.STANDARD,
      SEARCH_VARIANTS.BAR,
      SEARCH_VARIANTS.DRAWER,
      SEARCH_VARIANTS.MODAL,
      SEARCH_VARIANTS.RAIL
    ];
    
    variants.forEach(variant => {
      const search = createMockSearch({ variant });
      expect(search.element.className).toContain(`mtrl-search--${variant}`);
    });
  });
  
  test('should apply disabled state', () => {
    const search = createMockSearch({
      disabled: true
    });
    
    expect(search.element.className).toContain('mtrl-search--disabled');
    
    const input = search.element.querySelector('input');
    expect(input?.disabled).toBe(true);
    
    expect(search.isDisabled()).toBe(true);
  });
  
  test('should render leading icon by default', () => {
    const search = createMockSearch();
    
    const leadingIcon = search.element.querySelector('.mtrl-search__leading-icon');
    expect(leadingIcon).toBeDefined();
    expect(leadingIcon?.innerHTML).toBe('<svg>search</svg>');
  });
  
  test('should support no leading icon with "none" value', () => {
    const search = createMockSearch({
      leadingIcon: 'none'
    });
    
    const leadingIcon = search.element.querySelector('.mtrl-search__leading-icon');
    expect(leadingIcon).toBeNull();
  });
  
  test('should render trailing icons when provided', () => {
    const search = createMockSearch({
      trailingIcon: '<svg>filter</svg>',
      trailingIcon2: '<svg>more</svg>'
    });
    
    const trailingIcons = search.element.querySelectorAll('.mtrl-search__trailing-icon');
    expect(trailingIcons.length).toBe(2);
    expect(trailingIcons[0].innerHTML).toBe('<svg>filter</svg>');
    expect(trailingIcons[1].innerHTML).toBe('<svg>more</svg>');
  });
  
  test('should render avatar when provided', () => {
    const avatarHtml = '<img src="avatar.jpg" alt="User">';
    const search = createMockSearch({
      avatar: avatarHtml
    });
    
    const avatar = search.element.querySelector('.mtrl-search__avatar');
    expect(avatar).toBeDefined();
    expect(avatar?.innerHTML).toBe(avatarHtml);
  });
  
  test('should show clear button by default when value is provided', () => {
    const search = createMockSearch({
      value: 'test query'
    });
    
    const clearButton = search.element.querySelector('.mtrl-search__clear');
    expect(clearButton).toBeDefined();
    expect(clearButton?.style.display).not.toBe('none');
  });
  
  test('should hide clear button when value is empty', () => {
    const search = createMockSearch({
      value: ''
    });
    
    const clearButton = search.element.querySelector('.mtrl-search__clear');
    expect(clearButton).toBeDefined();
    expect(clearButton?.style.display).toBe('none');
  });
  
  test('should not render clear button when showClearButton is false', () => {
    const search = createMockSearch({
      showClearButton: false,
      value: 'test'
    });
    
    const clearButton = search.element.querySelector('.mtrl-search__clear');
    expect(clearButton).toBeNull();
  });
  
  test('should set and get value', () => {
    const search = createMockSearch();
    
    expect(search.getValue()).toBe('');
    
    search.setValue('test query');
    
    expect(search.getValue()).toBe('test query');
    
    const input = search.element.querySelector('input');
    expect(input?.value).toBe('test query');
  });
  
  test('should set and get placeholder', () => {
    const search = createMockSearch({
      placeholder: 'Original placeholder'
    });
    
    expect(search.getPlaceholder()).toBe('Original placeholder');
    
    search.setPlaceholder('New placeholder');
    
    expect(search.getPlaceholder()).toBe('New placeholder');
    
    const input = search.element.querySelector('input');
    expect(input?.placeholder).toBe('New placeholder');
  });
  
  test('should change leading icon', () => {
    const search = createMockSearch();
    
    const initialIcon = search.element.querySelector('.mtrl-search__leading-icon');
    expect(initialIcon?.innerHTML).toBe('<svg>search</svg>');
    
    search.setLeadingIcon('<svg>new-icon</svg>');
    
    const updatedIcon = search.element.querySelector('.mtrl-search__leading-icon');
    expect(updatedIcon?.innerHTML).toBe('<svg>new-icon</svg>');
  });
  
  test('should remove leading icon', () => {
    const search = createMockSearch();
    
    const initialIcon = search.element.querySelector('.mtrl-search__leading-icon');
    expect(initialIcon).not.toBeNull();
    
    search.setLeadingIcon('none');
    
    const updatedIcon = search.element.querySelector('.mtrl-search__leading-icon');
    expect(updatedIcon).toBeNull();
  });
  
  test('should change trailing icon', () => {
    const search = createMockSearch({
      trailingIcon: '<svg>menu</svg>'
    });
    
    const initialIcon = search.element.querySelector('.mtrl-search__trailing-icon');
    expect(initialIcon?.innerHTML).toBe('<svg>menu</svg>');
    
    search.setTrailingIcon('<svg>new-icon</svg>');
    
    const updatedIcon = search.element.querySelector('.mtrl-search__trailing-icon');
    expect(updatedIcon?.innerHTML).toBe('<svg>new-icon</svg>');
  });
  
  test('should change second trailing icon', () => {
    const search = createMockSearch({
      trailingIcon: '<svg>filter</svg>',
      trailingIcon2: '<svg>menu</svg>'
    });
    
    const trailingIcons = search.element.querySelectorAll('.mtrl-search__trailing-icon');
    expect(trailingIcons[1].innerHTML).toBe('<svg>menu</svg>');
    
    search.setTrailingIcon2('<svg>new-icon</svg>');
    
    const updatedIcons = search.element.querySelectorAll('.mtrl-search__trailing-icon');
    expect(updatedIcons[1].innerHTML).toBe('<svg>new-icon</svg>');
  });
  
  test('should change avatar', () => {
    const search = createMockSearch({
      avatar: '<img src="user1.jpg">'
    });
    
    const initialAvatar = search.element.querySelector('.mtrl-search__avatar');
    expect(initialAvatar?.innerHTML).toBe('<img src="user1.jpg">');
    
    search.setAvatar('<img src="user2.jpg">');
    
    const updatedAvatar = search.element.querySelector('.mtrl-search__avatar');
    expect(updatedAvatar?.innerHTML).toBe('<img src="user2.jpg">');
  });
  
  test('should render string suggestions', () => {
    const suggestions = ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'];
    
    const search = createMockSearch({
      suggestions
    });
    
    const suggestionsContainer = search.element.querySelector('.mtrl-search__suggestions');
    expect(suggestionsContainer).toBeDefined();
    expect(suggestionsContainer?.style.display).toBe('none');
    
    const suggestionElements = search.element.querySelectorAll('.mtrl-search__suggestion');
    expect(suggestionElements.length).toBe(3);
    
    expect(suggestionElements[0].textContent).toBe('Suggestion 1');
    expect(suggestionElements[1].textContent).toBe('Suggestion 2');
    expect(suggestionElements[2].textContent).toBe('Suggestion 3');
  });
  
  test('should render object suggestions with icons', () => {
    const suggestions = [
      { text: 'Suggestion 1', icon: '<svg>icon1</svg>' },
      { text: 'Suggestion 2', icon: '<svg>icon2</svg>' },
      { text: 'Suggestion 3', value: 'custom-value', icon: '<svg>icon3</svg>' }
    ];
    
    const search = createMockSearch({
      suggestions
    });
    
    const suggestionElements = search.element.querySelectorAll('.mtrl-search__suggestion');
    expect(suggestionElements.length).toBe(3);
    
    // Check for icons
    const icons = search.element.querySelectorAll('.mtrl-search__suggestion-icon');
    expect(icons.length).toBe(3);
    
    // Check text content
    const textElements = search.element.querySelectorAll('.mtrl-search__suggestion-text');
    expect(textElements.length).toBe(3);
    expect(textElements[0].textContent).toBe('Suggestion 1');
    expect(textElements[1].textContent).toBe('Suggestion 2');
    expect(textElements[2].textContent).toBe('Suggestion 3');
    
    // Check data-value attributes
    expect(suggestionElements[0].getAttribute('data-value')).toBe('Suggestion 1');
    expect(suggestionElements[1].getAttribute('data-value')).toBe('Suggestion 2');
    expect(suggestionElements[2].getAttribute('data-value')).toBe('custom-value');
  });
  
  test('should add dividers between suggestions when enabled', () => {
    const suggestions = ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'];
    
    const search = createMockSearch({
      suggestions,
      showDividers: true
    });
    
    const dividers = search.element.querySelectorAll('.mtrl-search__suggestion-divider');
    // There should be dividers between items (n-1 dividers)
    expect(dividers.length).toBe(2);
  });
  
  test('should update suggestions', () => {
    const search = createMockSearch();
    
    const newSuggestions = ['New 1', 'New 2', 'New 3'];
    search.setSuggestions(newSuggestions);
    
    const suggestionsContainer = search.element.querySelector('.mtrl-search__suggestions');
    expect(suggestionsContainer).toBeDefined();
    
    const suggestionElements = search.element.querySelectorAll('.mtrl-search__suggestion');
    expect(suggestionElements.length).toBe(3);
    
    expect(suggestionElements[0].textContent).toBe('New 1');
    expect(suggestionElements[1].textContent).toBe('New 2');
    expect(suggestionElements[2].textContent).toBe('New 3');
  });
  
  test('should show and hide suggestions', () => {
    const search = createMockSearch({
      suggestions: ['Suggestion 1', 'Suggestion 2']
    });
    
    const suggestionsContainer = search.element.querySelector('.mtrl-search__suggestions');
    expect(suggestionsContainer?.style.display).toBe('none');
    
    search.showSuggestions(true);
    expect(suggestionsContainer?.style.display).toBe('block');
    
    search.showSuggestions(false);
    expect(suggestionsContainer?.style.display).toBe('none');
  });
  
  test('should clear input value', () => {
    const search = createMockSearch({
      value: 'test query'
    });
    
    expect(search.getValue()).toBe('test query');
    
    search.clear();
    
    expect(search.getValue()).toBe('');
    
    const clearButton = search.element.querySelector('.mtrl-search__clear');
    expect(clearButton?.style.display).toBe('none');
  });
  
  test('should enable and disable search', () => {
    const search = createMockSearch();
    
    expect(search.isDisabled()).toBe(false);
    
    search.disable();
    
    expect(search.isDisabled()).toBe(true);
    expect(search.element.className).toContain('mtrl-search--disabled');
    
    const input = search.element.querySelector('input');
    expect(input?.disabled).toBe(true);
    
    search.enable();
    
    expect(search.isDisabled()).toBe(false);
    expect(search.element.className).not.toContain('mtrl-search--disabled');
    expect(input?.disabled).toBe(false);
  });
  
  test('should expand and collapse search bar', () => {
    const search = createMockSearch({
      variant: SEARCH_VARIANTS.BAR
    });
    
    expect(search.element.className).not.toContain('mtrl-search--expanded');
    
    search.expand();
    
    expect(search.element.className).toContain('mtrl-search--expanded');
    
    search.collapse();
    
    expect(search.element.className).not.toContain('mtrl-search--expanded');
  });
  
  test('should emit change events', () => {
    const search = createMockSearch();
    
    let inputEventFired = false;
    let eventValue = '';
    
    search.on(SEARCH_EVENTS.INPUT, (event) => {
      inputEventFired = true;
      eventValue = event.value;
    });
    
    search.setValue('test', true);
    
    expect(inputEventFired).toBe(true);
    expect(eventValue).toBe('test');
  });
  
  test('should emit submit events', () => {
    const search = createMockSearch({
      value: 'query'
    });
    
    let submitEventFired = false;
    let eventValue = '';
    
    search.on(SEARCH_EVENTS.SUBMIT, (event) => {
      submitEventFired = true;
      eventValue = event.value;
    });
    
    search.submit();
    
    expect(submitEventFired).toBe(true);
    expect(eventValue).toBe('query');
  });
  
  test('should emit clear events', () => {
    const search = createMockSearch({
      value: 'query'
    });
    
    let clearEventFired = false;
    
    search.on(SEARCH_EVENTS.CLEAR, () => {
      clearEventFired = true;
    });
    
    search.clear();
    
    expect(clearEventFired).toBe(true);
    expect(search.getValue()).toBe('');
  });
  
  test('should call onSubmit callback', () => {
    let callbackFired = false;
    let callbackValue = '';
    
    const search = createMockSearch({
      value: 'test',
      onSubmit: (value) => {
        callbackFired = true;
        callbackValue = value;
      }
    });
    
    search.submit();
    
    expect(callbackFired).toBe(true);
    expect(callbackValue).toBe('test');
  });
  
  test('should call onInput callback', () => {
    let callbackFired = false;
    let callbackValue = '';
    
    const search = createMockSearch({
      onInput: (value) => {
        callbackFired = true;
        callbackValue = value;
      }
    });
    
    search.setValue('input test', true);
    
    expect(callbackFired).toBe(true);
    expect(callbackValue).toBe('input test');
  });
  
  test('should call onClear callback', () => {
    let callbackFired = false;
    
    const search = createMockSearch({
      value: 'test',
      onClear: () => {
        callbackFired = true;
      }
    });
    
    search.clear();
    
    expect(callbackFired).toBe(true);
  });
  
  test('should apply full width', () => {
    const search = createMockSearch({
      fullWidth: true
    });
    
    expect(search.element.className).toContain('mtrl-search--full-width');
    expect(search.element.style.width).toBe('100%');
  });
  
  test('should apply min and max width', () => {
    const search = createMockSearch({
      minWidth: 200,
      maxWidth: 400
    });
    
    expect(search.element.style.minWidth).toBe('200px');
    expect(search.element.style.maxWidth).toBe('400px');
  });
  
  test('should toggle clear button visibility', () => {
    const search = createMockSearch({
      value: 'test'
    });
    
    // Clear button should be visible with value
    const initialClearButton = search.element.querySelector('.mtrl-search__clear');
    expect(initialClearButton).not.toBeNull();
    
    // Hide clear button
    search.showClearButton(false);
    let clearButton = search.element.querySelector('.mtrl-search__clear');
    expect(clearButton).toBeNull();
    
    // Show clear button again
    search.showClearButton(true);
    clearButton = search.element.querySelector('.mtrl-search__clear');
    expect(clearButton).not.toBeNull();
  });
  
  test('should remove event listeners', () => {
    const search = createMockSearch();
    
    let eventCount = 0;
    
    const handler = () => {
      eventCount++;
    };
    
    search.on(SEARCH_EVENTS.INPUT, handler);
    
    search.setValue('test', true);
    expect(eventCount).toBe(1);
    
    search.off(SEARCH_EVENTS.INPUT, handler);
    
    search.setValue('another', true);
    expect(eventCount).toBe(1); // Count should not increase
  });
  
  test('should be properly destroyed', () => {
    const search = createMockSearch();
    document.body.appendChild(search.element);
    
    expect(document.body.contains(search.element)).toBe(true);
    
    search.destroy();
    
    expect(document.body.contains(search.element)).toBe(false);
  });
});