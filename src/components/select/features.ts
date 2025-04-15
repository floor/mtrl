// src/components/select/features.ts
import createTextfield from '../textfield';
import createMenu from '../menu';
import { SelectOption, SelectConfig, BaseComponent } from './types';

/**
 * Creates a textfield for the select component
 * @param config - Select configuration
 * @returns Function that enhances a component with textfield functionality
 */
export const withTextfield = (config: SelectConfig) => 
  (component: BaseComponent): BaseComponent => {
    // Get option text from value if provided
    let initialText = '';
    if (config.value) {
      const option = (config.options || []).find(opt => opt.id === config.value);
      if (option) {
        initialText = option.text;
      }
    }
    
    // Create dropdown icon for the textfield
    const dropdownIcon = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7 10l5 5 5-5H7z"/></svg>';
    
    // Create textfield component
    const textfield = createTextfield({
      label: config.label,
      variant: config.variant || 'filled',
      value: initialText,
      name: config.name,
      disabled: config.disabled,
      required: config.required,
      supportingText: config.supportingText,
      error: config.error,
      trailingIcon: dropdownIcon,
      readonly: true // Make readonly since selection happens via menu
    });
    
    // Add select-specific class
    textfield.element.classList.add(`${config.prefix || 'mtrl'}-select`);
    
    return {
      ...component,
      element: textfield.element,
      textfield
    };
  };

/**
 * Recursively processes select options to create menu items
 * Ensures all items have proper data structure
 * @param options The options to process
 * @returns Properly structured menu items
 */
const processMenuItems = (options) => {
  return options.map(option => {
    if ('type' in option && option.type === 'divider') {
      return option; // Just pass dividers through
    }
    
    // Create a basic menu item
    const menuItem = {
      id: option.id,
      text: option.text,
      icon: option.icon,
      disabled: option.disabled,
      hasSubmenu: false,
      data: option
    };
    
    // If this option has a submenu, process those items recursively
    if (option.hasSubmenu && Array.isArray(option.submenu)) {
      menuItem.hasSubmenu = true;
      menuItem.submenu = processMenuItems(option.submenu);
    }
    
    return menuItem;
  });
};

/**
 * Creates a menu for the select component
 * @param config - Select configuration
 * @returns Function that enhances a component with menu functionality
 */
export const withMenu = (config: SelectConfig) => 
  (component: BaseComponent): BaseComponent => {
    if (!component.textfield) {
      console.warn('Cannot add menu: textfield not found');
      return component;
    }
    
    // Initialize state
    const state = {
      options: config.options || [],
      selectedOption: null as SelectOption
    };
    
    // Find initial selected option
    if (config.value) {
      state.selectedOption = state.options.find(opt => opt.id === config.value);
    }
    
    // Convert options to menu items with proper recursive processing
    const menuItems = processMenuItems(state.options);
    
    // Create menu component
    const menu = createMenu({
      anchor: component.textfield.element,
      items: menuItems,
      placement: config.placement || 'bottom-start',
      width: '100%', // Match width of textfield
      closeOnSelect: true,
      closeOnClickOutside: true,
      closeOnEscape: true,
      offset: 0 // Set offset to 0 to eliminate gap between textfield and menu
    });
    
    // Handle menu selection
    menu.on('select', (event) => {
      // Safely access data properties with proper type checking
      if (!event.item || event.item.hasSubmenu) {
        return; // Skip processing for submenu items
      }
      
      // Safely extract the option data and validate it
      const option = event.item.data;
      if (!option || !('id' in option) || !('text' in option)) {
        console.warn('Invalid menu selection: missing required data properties');
        return;
      }
      
      state.selectedOption = option;
      
      // Update textfield
      component.textfield.setValue(option.text);
      
      // Emit change event
      if (component.emit) {
        component.emit('change', {
          select: component,
          value: option.id,
          text: option.text,
          option,
          originalEvent: event.originalEvent,
          preventDefault: () => { event.defaultPrevented = true; },
          defaultPrevented: false
        });
      }
    });
    
    // NOTE: We're NOT adding our own click handler to the textfield here
    // because the menu's withAnchor feature already adds a toggle behavior.
    // Adding our own click handler would cause conflicts.
    
    // Add keyboard event listener for textfield
    component.textfield.element.addEventListener('keydown', (e) => {
      if (component.textfield.input.disabled) return;
      
      // Handle keyboard-based open
      if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') && !menu.isOpen()) {
        e.preventDefault();
        menu.open(e, 'keyboard'); // Specify keyboard interaction
        
        // Emit open event
        if (component.emit) {
          component.emit('open', {
            select: component,
            originalEvent: e,
            preventDefault: () => {},
            defaultPrevented: false
          });
        }
      } else if (e.key === 'Escape' && menu.isOpen()) {
        e.preventDefault();
        menu.close(e);
      }
    });
    
    // Update textfield styling when menu opens/closes
    menu.on('open', () => {
      // Add open class to the select component
      component.textfield.element.classList.add(`${config.prefix || 'mtrl'}-select--open`);
      
      // Add focused class to the textfield
      const PREFIX = config.prefix || 'mtrl';
      component.textfield.element.classList.add(`${PREFIX}-textfield--focused`);
      
      // If using the filled variant, we need to add focus styles to ensure the label changes color
      if (component.textfield.element.classList.contains(`${PREFIX}-textfield--filled`)) {
        component.textfield.element.classList.add(`${PREFIX}-textfield--filled-focused`);
      }
    });
    
    menu.on('close', (event) => {
      // Remove open class from the select component
      component.textfield.element.classList.remove(`${config.prefix || 'mtrl'}-select--open`);
      
      // Remove focused class from the textfield
      const PREFIX = config.prefix || 'mtrl';
      component.textfield.element.classList.remove(`${PREFIX}-textfield--focused`);
      
      // Remove filled focus class if present
      if (component.textfield.element.classList.contains(`${PREFIX}-textfield--filled`)) {
        component.textfield.element.classList.remove(`${PREFIX}-textfield--filled-focused`);
      }
      
      // Emit close event
      if (component.emit) {
        component.emit('close', {
          select: component,
          originalEvent: event.originalEvent,
          preventDefault: () => {},
          defaultPrevented: false
        });
      }
    });
    
    // Handle special case for showing selected item in menu
    const markSelectedMenuItem = () => {
      if (!state.selectedOption) return;
      
      // Get all menu items
      const menuList = menu.element.querySelector(`.${config.prefix || 'mtrl'}-menu-list`);
      if (!menuList) return;
      
      // Find and mark the selected item
      const items = menuList.querySelectorAll(`.${config.prefix || 'mtrl'}-menu-item`);
      items.forEach(item => {
        const itemId = item.getAttribute('data-id');
        if (itemId === state.selectedOption.id) {
          item.classList.add(`${config.prefix || 'mtrl'}-menu-item--selected`);
        } else {
          item.classList.remove(`${config.prefix || 'mtrl'}-menu-item--selected`);
        }
      });
    };
    
    // Mark selected item when menu opens
    menu.on('open', () => {
      setTimeout(markSelectedMenuItem, 50); // Small delay to ensure DOM is ready
    });
    
    // Expose select API
    return {
      ...component,
      menu,

      // Select controller
      select: {
        getValue: () => state.selectedOption?.id || null,
        
        setValue: (value) => {
          const option = state.options.find(opt => 'id' in opt && opt.id === value);
          if (option && 'text' in option) {
            state.selectedOption = option;
            component.textfield.setValue(option.text);
            
            // Update menu item if menu is open
            if (menu.isOpen()) {
              markSelectedMenuItem();
            }
          }
          return component;
        },
        
        getText: () => state.selectedOption?.text || '',
        
        getSelectedOption: () => state.selectedOption,
        
        getOptions: () => [...state.options],
        
        setOptions: (options) => {
          state.options = options;
          
          // Process options to menu items with proper handling for submenus
          const menuItems = processMenuItems(options);
          menu.setItems(menuItems);
          
          // If previously selected option is no longer available, clear selection
          if (state.selectedOption && !options.find(opt => 
            'id' in opt && opt.id === state.selectedOption.id)
          ) {
            state.selectedOption = null;
            component.textfield.setValue('');
          }
          
          return component;
        },
        
        open: (event?: Event, interactionType: 'mouse' | 'keyboard' = 'mouse') => {
          menu.open(event, interactionType);
          return component;
        },
        
        close: () => {
          menu.close();
          return component;
        },
        
        isOpen: () => menu.isOpen()
      }
    };
  };