import { describe, test, expect } from 'bun:test'
import createList from '../../src/components/list/list'
import { LIST_TYPES } from '../../src/components/list/constants'

describe('List Component', () => {
  test('should create a default list element', () => {
    const list = createList({
      items: [{ id: 'item1', headline: 'Item 1' }]
    })
    expect(list.element).toBeDefined()
    // Default type is "default" and role "list"
    expect(list.element.getAttribute('data-type')).toBe(LIST_TYPES.DEFAULT)
    expect(list.element.getAttribute('role')).toBe('list')
    // Check at least one list item exists
    const listItem = list.element.querySelector(`.${list.prefix}-list-item`)
    expect(listItem).not.toBeNull()
  })

  test('should support single select behavior', () => {
    const list = createList({
      type: LIST_TYPES.SINGLE_SELECT,
      items: [
        { id: 'item1', headline: 'Item 1' },
        { id: 'item2', headline: 'Item 2' }
      ]
    })

    // Simulate clicking on the first item
    const items = list.element.querySelectorAll(`.${list.prefix}-list-item`)
    const firstItem = items[0]
    firstItem.dispatchEvent(new Event('click'))
    expect(firstItem.getAttribute('aria-selected')).toBe('true')

    // Now click the second item; the first should be deselected
    const secondItem = items[1]
    secondItem.dispatchEvent(new Event('click'))
    expect(firstItem.getAttribute('aria-selected')).toBe('false')
    expect(secondItem.getAttribute('aria-selected')).toBe('true')
  })

  test('should support multi select behavior', () => {
    const list = createList({
      type: LIST_TYPES.MULTI_SELECT,
      items: [
        { id: 'item1', headline: 'Item 1' },
        { id: 'item2', headline: 'Item 2' }
      ]
    })

    const items = list.element.querySelectorAll(`.${list.prefix}-list-item`)
    const firstItem = items[0]
    const secondItem = items[1]

    // Click to select first item
    firstItem.dispatchEvent(new Event('click'))
    expect(firstItem.getAttribute('aria-selected')).toBe('true')

    // Click to select second item
    secondItem.dispatchEvent(new Event('click'))
    expect(secondItem.getAttribute('aria-selected')).toBe('true')
    expect(list.getSelected().length).toBe(2)

    // Click first item again to deselect it
    firstItem.dispatchEvent(new Event('click'))
    expect(firstItem.getAttribute('aria-selected')).toBe('false')
    expect(list.getSelected().length).toBe(1)
  })

  test('should set selected items via setSelected', () => {
    const list = createList({
      type: LIST_TYPES.MULTI_SELECT,
      items: [
        { id: 'item1', headline: 'Item 1' },
        { id: 'item2', headline: 'Item 2' },
        { id: 'item3', headline: 'Item 3' }
      ]
    })

    list.setSelected(['item2', 'item3'])
    const items = Array.from(
      list.element.querySelectorAll(`.${list.prefix}-list-item`)
    )
    const item2 = items.find(i => i.dataset.id === 'item2')
    const item3 = items.find(i => i.dataset.id === 'item3')

    expect(item2.getAttribute('aria-selected')).toBe('true')
    expect(item3.getAttribute('aria-selected')).toBe('true')
    expect(list.getSelected()).toEqual(expect.arrayContaining(['item2', 'item3']))
  })

  test('should add and remove items dynamically', () => {
    const list = createList({
      items: [{ id: 'item1', headline: 'Item 1' }]
    })

    const initialCount = list.element.querySelectorAll(`.${list.prefix}-list-item`).length
    list.addItem({ id: 'item2', headline: 'Item 2' })
    const newCount = list.element.querySelectorAll(`.${list.prefix}-list-item`).length
    expect(newCount).toBe(initialCount + 1)

    list.removeItem('item1')
    const finalCount = list.element.querySelectorAll(`.${list.prefix}-list-item`).length
    expect(finalCount).toBe(newCount - 1)
  })
})
