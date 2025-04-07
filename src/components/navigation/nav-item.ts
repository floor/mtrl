// src/components/navigation/nav-item.ts
import { NavItemConfig, NavClass } from './types';

/**
 * Creates an expand/collapse icon element
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Expand icon element
 */
export const createExpandIcon = (prefix: string): HTMLElement => {
  const icon = document.createElement('span');
  icon.className = `${prefix}-${NavClass.EXPAND_ICON}`;
  icon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  `;
  return icon;
};

/**
 * Creates a nested items container
 * @param {NavItemConfig[]} items - Nested items configuration
 * @param {string} prefix - CSS class prefix
 * @param {Function} createItem - Item creation function
 * @returns {HTMLElement} Nested items container
 */
export const createNestedContainer = (
  items: NavItemConfig[], 
  prefix: string, 
  createItem: (config: NavItemConfig, container: HTMLElement, prefix: string) => HTMLElement
): HTMLElement => {
  const container = document.createElement('div');
  container.className = `${prefix}-${NavClass.NESTED_CONTAINER}`;
  
  // Use appropriate role for nested menu
  container.setAttribute('role', 'menu');
  container.hidden = true;

  items.forEach(itemConfig => {
    createItem(itemConfig, container, prefix);
  });

  return container;
};

/**
 * Creates a navigation item element
 * @param {NavItemConfig} config - Item configuration
 * @param {HTMLElement} container - Container element
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Created navigation item
 */
export const createNavItem = (
  config: NavItemConfig, 
  container: HTMLElement, 
  prefix: string
): HTMLElement => {
  const itemContainer = document.createElement('div');
  itemContainer.className = `${prefix}-${NavClass.ITEM_CONTAINER}`;

  // Determine if parent container uses tabs or menu role pattern
  const isMenuContext = container.getAttribute('role') === 'menu';
  const isTabContext = container.getAttribute('role') === 'tablist';
  const isDrawerVariant = container.closest(`.${prefix}-nav--drawer, .${prefix}-nav--drawer-modal, .${prefix}-nav--drawer-standard`) !== null;
  
  // Create the item element
  const itemElement = document.createElement('button');
  itemElement.className = `${prefix}-${NavClass.ITEM}`;
  itemElement.type = 'button'; // Ensure it's a button type for proper behavior
  
  // Set appropriate role based on context and items
  if (config.items?.length) {
    if (isDrawerVariant) {
      // For expandable drawer items with nested items
      itemElement.setAttribute('role', 'button');
      itemElement.setAttribute('aria-expanded', config.expanded ? 'true' : 'false');
      itemElement.setAttribute('aria-haspopup', 'menu');
    } else {
      // For non-drawer variants with nested items
      itemElement.setAttribute('role', 'button');
    }
  } else if (isMenuContext) {
    // For menu items
    itemElement.setAttribute('role', 'menuitem');
  } else if (isTabContext) {
    // For tab items
    itemElement.setAttribute('role', 'tab');
    itemElement.setAttribute('aria-selected', config.active ? 'true' : 'false');
    itemElement.setAttribute('tabindex', config.active ? '0' : '-1');
  } 
  // For plain navigation buttons, we don't need to set the role since buttons have inherent semantics

  if (config.id) {
    itemElement.dataset.id = config.id;
  }

  if (config.disabled) {
    itemElement.disabled = true;
    itemElement.setAttribute('aria-disabled', 'true');
  }

  // Add icon if provided
  if (config.icon) {
    const icon = document.createElement('span');
    icon.className = `${prefix}-${NavClass.ICON}`;
    icon.innerHTML = config.icon;
    itemElement.appendChild(icon);
  }

  // Add label if provided - CONVERTED TO ANCHOR FOR SEO
  if (config.label) {
    // Create anchor instead of span for the label
    const label = document.createElement('a');
    label.className = `${prefix}-${NavClass.LABEL}`;
    label.textContent = config.label;
    label.href = `/${config.id}`; // Create path based on ID
    
    // Ensure the anchor looks the same as a span would
    label.style.textDecoration = 'none';
    label.style.color = 'inherit';
    label.style.pointerEvents = 'none'; // Let the button handle click events
    
    // Add SEO attributes
    label.setAttribute('title', config.label);
    
    itemElement.appendChild(label);
    itemElement.setAttribute('aria-label', config.label);
  }

  // Add badge if provided
  if (config.badge) {
    const badge = document.createElement('span');
    badge.className = `${prefix}-${NavClass.BADGE}`;
    badge.textContent = config.badge;
    // Use appropriate aria labeling
    badge.setAttribute('aria-label', `${config.badge} notifications`);
    itemElement.appendChild(badge);
  }

  // Mark active state with appropriate semantics
  if (config.active && !config.items?.length) {
    itemElement.classList.add(`${prefix}-${NavClass.ITEM}--active`);
    
    // Use aria-current for standard navigation
    if (!isTabContext) {
      itemElement.setAttribute('aria-current', 'page');
    }
  }

  itemContainer.appendChild(itemElement);

  // Handle nested items - only for drawer variant
  if (config.items?.length && isDrawerVariant) {
    const expandIcon = createExpandIcon(prefix);
    itemElement.appendChild(expandIcon);

    const nestedContainer = createNestedContainer(config.items, prefix, createNavItem);
    nestedContainer.hidden = !config.expanded;
    itemContainer.appendChild(nestedContainer);

    // Handle expand/collapse
    itemElement.addEventListener('click', (event) => {
      event.stopPropagation();
      const isExpanded = itemElement.getAttribute('aria-expanded') === 'true';
      itemElement.setAttribute('aria-expanded', (!isExpanded).toString());
      nestedContainer.hidden = isExpanded;

      // Toggle expand icon rotation
      if (expandIcon.style) {
        expandIcon.style.transform = isExpanded ? '' : 'rotate(90deg)';
      }
    });
  }

  container.appendChild(itemContainer);
  return itemElement;
};

/**
 * Recursively gets all nested items from a navigation item
 * @param {HTMLElement} item - Navigation item element
 * @param {string} prefix - CSS class prefix
 * @returns {Array<HTMLElement>} Array of all nested items
 */
export const getAllNestedItems = (item: HTMLElement, prefix: string): HTMLElement[] => {
  const container = item.closest(`.${prefix}-${NavClass.ITEM_CONTAINER}`);
  if (!container) return [];

  const nestedContainer = container.querySelector(`.${prefix}-${NavClass.NESTED_CONTAINER}`);
  if (!nestedContainer) return [];

  const items = Array.from(nestedContainer.querySelectorAll(`.${prefix}-${NavClass.ITEM}`)) as HTMLElement[];
  return items.reduce((acc: HTMLElement[], nestedItem: HTMLElement) => {
    return [...acc, nestedItem, ...getAllNestedItems(nestedItem, prefix)];
  }, []);
};