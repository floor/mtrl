// src/components/list/features.ts
import { 
  ListConfig, 
  ListItemConfig, 
  ListItemData, 
  BaseComponent,
  SelectionChangeEvent
} from './types';
import { LIST_TYPES, LIST_LAYOUTS } from './constants';
import { createDivider, createSectionTitle } from './utils';
import createListItem from './list-item';

/**
 * Enhances component with list content and functionality
 * @param {ListConfig} config - List configuration
 * @returns {Function} Higher-order function that adds list features to component
 */
export const withListContent = (config: ListConfig) => 
  (component: BaseComponent): BaseComponent => {
    const { element } = component;
    const prefix = component.prefix || config.prefix || '';
    const items = new Map<string, ListItemData>();
    const selectedItems = new Set<string>();

    // Set list type
    element.setAttribute('data-type', config.type || LIST_TYPES.DEFAULT);

    // Handle keyboard navigation
    const handleKeyDown = (event: KeyboardEvent): void => {
      const focusedItem = document.activeElement as HTMLElement;
      if (!focusedItem?.classList.contains(`${prefix}-list-item`)) return;

      const listItems = Array.from(element.querySelectorAll(`.${prefix}-list-item`)) as HTMLElement[];
      const currentIndex = listItems.indexOf(focusedItem);

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          const nextItem = listItems[currentIndex + 1];
          if (nextItem) nextItem.focus();
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          const prevItem = listItems[currentIndex - 1];
          if (prevItem) prevItem.focus();
          break;
        case 'Home':
          event.preventDefault();
          listItems[0]?.focus();
          break;
        case 'End':
          event.preventDefault();
          listItems[listItems.length - 1]?.focus();
          break;
        case ' ':
        case 'Enter':
          event.preventDefault();
          handleItemClick(focusedItem);
          break;
      }
    };

    // Handle item selection
    const handleItemClick = (itemElement: HTMLElement): void => {
      const id = itemElement.dataset.id;
      if (!id) return;

      const itemData = items.get(id);
      if (!itemData || itemData.disabled) return;

      switch (config.type) {
        case LIST_TYPES.SINGLE_SELECT:
          // Deselect previously selected item
          selectedItems.forEach(selectedId => {
            const selected = items.get(selectedId);
            if (selected) {
              selected.element.classList.remove(`${prefix}-list-item--selected`);
              selected.element.setAttribute('aria-selected', 'false');
            }
          });
          selectedItems.clear();

          // Select new item
          itemElement.classList.add(`${prefix}-list-item--selected`);
          itemElement.setAttribute('aria-selected', 'true');
          selectedItems.add(id);
          break;

        case LIST_TYPES.MULTI_SELECT:
          const isSelected = selectedItems.has(id);
          if (isSelected) {
            itemElement.classList.remove(`${prefix}-list-item--selected`);
            itemElement.setAttribute('aria-selected', 'false');
            selectedItems.delete(id);
          } else {
            itemElement.classList.add(`${prefix}-list-item--selected`);
            itemElement.setAttribute('aria-selected', 'true');
            selectedItems.add(id);
          }
          break;
      }

      component.emit?.('selectionChange', {
        selected: Array.from(selectedItems),
        item: itemData,
        type: config.type
      } as SelectionChangeEvent);
    };

    // Create items from configuration
    const createItems = (itemsConfig: ListItemConfig[] = [], container: HTMLElement = element): void => {
      itemsConfig.forEach((itemConfig, index) => {
        if (itemConfig.divider) {
          container.appendChild(createDivider(prefix));
          return;
        }

        const item = createListItem({
          ...itemConfig,
          layout: config.layout || LIST_LAYOUTS.HORIZONTAL,
          role: config.type === LIST_TYPES.RADIO ? 'radio' : 'option'
        });

        item.element.dataset.id = itemConfig.id;
        item.element.tabIndex = index === 0 ? 0 : -1;
        items.set(itemConfig.id, item);

        if (itemConfig.selected) {
          selectedItems.add(itemConfig.id);
          item.element.classList.add(`${prefix}-list-item--selected`);
          item.element.setAttribute('aria-selected', 'true');
        }

        container.appendChild(item.element);
      });
    };

    // Create sections if configured
    if (config.sections?.length) {
      config.sections.forEach(section => {
        const sectionEl = document.createElement('div');
        sectionEl.className = `${prefix}-list-section`;
        sectionEl.setAttribute('role', 'group');
        if (section.title) {
          sectionEl.appendChild(createSectionTitle(section.title, prefix));
        }
        createItems(section.items, sectionEl);
        element.appendChild(sectionEl);
      });
    } else if (config.items) {
      createItems(config.items);
    }

    // Add event listeners
    element.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const item = target.closest(`.${prefix}-list-item`) as HTMLElement;
      if (item) handleItemClick(item);
    });

    element.addEventListener('keydown', handleKeyDown);

    // Clean up
    if (component.lifecycle) {
      const originalDestroy = component.lifecycle.destroy;
      component.lifecycle.destroy = () => {
        items.clear();
        selectedItems.clear();
        element.removeEventListener('keydown', handleKeyDown);
        originalDestroy?.();
      };
    }

    return {
      ...component,
      items,
      selectedItems,

      // Public methods
      getSelected: () => Array.from(selectedItems),

      setSelected: (ids: string[]) => {
        selectedItems.clear();
        items.forEach((item, id) => {
          const isSelected = ids.includes(id);
          item.element.classList.toggle(`${prefix}-list-item--selected`, isSelected);
          item.element.setAttribute('aria-selected', isSelected.toString());
          if (isSelected) selectedItems.add(id);
        });
        component.emit?.('selectionChange', {
          selected: Array.from(selectedItems),
          type: config.type
        } as SelectionChangeEvent);
      },

      addItem: (itemConfig: ListItemConfig) => {
        if (items.has(itemConfig.id)) return;

        const item = createListItem({
          ...itemConfig,
          layout: config.layout || LIST_LAYOUTS.HORIZONTAL
        });

        item.element.dataset.id = itemConfig.id;
        items.set(itemConfig.id, item);
        element.appendChild(item.element);

        component.emit?.('itemAdded', { id: itemConfig.id, item });
      },

      removeItem: (id: string) => {
        const item = items.get(id);
        if (!item) return;

        item.element.remove();
        items.delete(id);
        selectedItems.delete(id);

        component.emit?.('itemRemoved', { id, item });
      }
    };
  };