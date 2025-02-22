// src/components/list/list.js

import { PREFIX } from '../../core/config'
import { pipe } from '../../core/compose'
import { createBase, withElement } from '../../core/compose/component'
import { withEvents, withDisabled, withLifecycle } from '../../core/compose/features'
import createListItem from './list-item'
import { LIST_TYPES, LIST_LAYOUTS, LIST_CLASSES } from './constants'

/**
 * Creates a divider element
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Divider element
 */
const createDivider = (prefix) => {
  const divider = document.createElement('div')
  divider.className = `${prefix}-${LIST_CLASSES.DIVIDER}`
  divider.setAttribute('role', 'separator')
  return divider
}

/**
 * Creates a section title element
 * @param {string} title - Section title text
 * @param {string} prefix - CSS class prefix
 * @returns {HTMLElement} Section title element
 */
const createSectionTitle = (title, prefix) => {
  const titleEl = document.createElement('div')
  titleEl.className = `${prefix}-${LIST_CLASSES.SECTION_TITLE}`
  titleEl.textContent = title
  return titleEl
}

/**
 * Creates a list component
 * @param {Object} config - List configuration
 */
const createList = (config = {}) => {
  const baseConfig = {
    ...config,
    componentName: 'list',
    prefix: PREFIX
  }

  const createContent = (component) => {
    const { element, prefix } = component
    const items = new Map()
    const selectedItems = new Set()

    // Set list type
    element.setAttribute('data-type', config.type || LIST_TYPES.DEFAULT)

    // Handle keyboard navigation
    const handleKeyDown = (event) => {
      const focusedItem = document.activeElement
      if (!focusedItem?.classList.contains(`${prefix}-list-item`)) return

      const items = Array.from(element.querySelectorAll(`.${prefix}-list-item`))
      const currentIndex = items.indexOf(focusedItem)

      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault()
          const nextItem = items[currentIndex + 1]
          if (nextItem) nextItem.focus()
          break
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault()
          const prevItem = items[currentIndex - 1]
          if (prevItem) prevItem.focus()
          break
        case 'Home':
          event.preventDefault()
          items[0]?.focus()
          break
        case 'End':
          event.preventDefault()
          items[items.length - 1]?.focus()
          break
        case ' ':
        case 'Enter':
          event.preventDefault()
          handleItemClick(focusedItem)
          break
      }
    }

    // Handle item selection
    const handleItemClick = (itemElement) => {
      const id = itemElement.dataset.id
      if (!id) return

      const itemData = items.get(id)
      if (!itemData || itemData.disabled) return

      switch (config.type) {
        case LIST_TYPES.SINGLE_SELECT:
          // Deselect previously selected item
          selectedItems.forEach(selectedId => {
            const selected = items.get(selectedId)
            if (selected) {
              selected.element.classList.remove(`${prefix}-list-item--selected`)
              selected.element.setAttribute('aria-selected', 'false')
            }
          })
          selectedItems.clear()

          // Select new item
          itemElement.classList.add(`${prefix}-list-item--selected`)
          itemElement.setAttribute('aria-selected', 'true')
          selectedItems.add(id)
          break

        case LIST_TYPES.MULTI_SELECT:
          const isSelected = selectedItems.has(id)
          if (isSelected) {
            itemElement.classList.remove(`${prefix}-list-item--selected`)
            itemElement.setAttribute('aria-selected', 'false')
            selectedItems.delete(id)
          } else {
            itemElement.classList.add(`${prefix}-list-item--selected`)
            itemElement.setAttribute('aria-selected', 'true')
            selectedItems.add(id)
          }
          break
      }

      component.emit('selectionChange', {
        selected: Array.from(selectedItems),
        item: itemData,
        type: config.type
      })
    }

    // Create items from configuration
    const createItems = (itemsConfig = [], container = element) => {
      itemsConfig.forEach((itemConfig, index) => {
        if (itemConfig.divider) {
          container.appendChild(createDivider(prefix))
          return
        }

        const item = createListItem({
          ...itemConfig,
          layout: config.layout || LIST_LAYOUTS.HORIZONTAL,
          role: config.type === LIST_TYPES.RADIO ? 'radio' : 'option'
        })

        item.element.dataset.id = itemConfig.id
        item.element.tabIndex = index === 0 ? 0 : -1
        items.set(itemConfig.id, item)

        if (itemConfig.selected) {
          selectedItems.add(itemConfig.id)
          item.element.classList.add(`${prefix}-list-item--selected`)
          item.element.setAttribute('aria-selected', 'true')
        }

        container.appendChild(item.element)
      })
    }

    // Create sections if configured
    if (config.sections?.length) {
      config.sections.forEach(section => {
        const sectionEl = document.createElement('div')
        sectionEl.className = `${prefix}-${LIST_CLASSES.SECTION}`
        sectionEl.setAttribute('role', 'group')
        if (section.title) {
          sectionEl.appendChild(createSectionTitle(section.title, prefix))
        }
        createItems(section.items, sectionEl)
        element.appendChild(sectionEl)
      })
    } else {
      createItems(config.items)
    }

    // Add event listeners
    element.addEventListener('click', (event) => {
      const item = event.target.closest(`.${prefix}-list-item`)
      if (item) handleItemClick(item)
    })

    element.addEventListener('keydown', handleKeyDown)

    // Clean up
    if (component.lifecycle) {
      const originalDestroy = component.lifecycle.destroy
      component.lifecycle.destroy = () => {
        items.clear()
        selectedItems.clear()
        element.removeEventListener('keydown', handleKeyDown)
        originalDestroy?.()
      }
    }

    return {
      ...component,
      items,
      selectedItems,

      // Public methods
      getSelected: () => Array.from(selectedItems),

      setSelected: (ids) => {
        selectedItems.clear()
        items.forEach((item, id) => {
          const isSelected = ids.includes(id)
          item.element.classList.toggle(`${prefix}-list-item--selected`, isSelected)
          item.element.setAttribute('aria-selected', isSelected.toString())
          if (isSelected) selectedItems.add(id)
        })
        component.emit('selectionChange', {
          selected: Array.from(selectedItems),
          type: config.type
        })
      },

      addItem: (itemConfig) => {
        if (items.has(itemConfig.id)) return

        const item = createListItem({
          ...itemConfig,
          layout: config.layout || LIST_LAYOUTS.HORIZONTAL
        })

        item.element.dataset.id = itemConfig.id
        items.set(itemConfig.id, item)
        element.appendChild(item.element)

        component.emit('itemAdded', { id: itemConfig.id, item })
      },

      removeItem: (id) => {
        const item = items.get(id)
        if (!item) return

        item.element.remove()
        items.delete(id)
        selectedItems.delete(id)

        component.emit('itemRemoved', { id, item })
      }
    }
  }

  return pipe(
    createBase,
    withEvents(),
    withElement({
      tag: 'div',
      role: config.type === LIST_TYPES.DEFAULT ? 'list' : 'listbox',
      'aria-multiselectable': config.type === LIST_TYPES.MULTI_SELECT ? 'true' : undefined,
      componentName: LIST_CLASSES.ROOT,
      className: config.class
    }),
    withDisabled(),
    withLifecycle(),
    createContent
  )(baseConfig)
}

export default createList
