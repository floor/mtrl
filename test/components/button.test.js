// test/components/button.test.js
import { describe, test, expect, mock } from 'bun:test'
import createButton from '../../src/components/button/button'

describe('Button Component', () => {
  test('should create a button element', () => {
    const button = createButton()
    expect(button.element).toBeDefined()
    expect(button.element.tagName).toBe('BUTTON')
    expect(button.element.className).toContain('mtrl-button')
  })

  test('should add text content', () => {
    const buttonText = 'Click Me'
    const button = createButton({
      text: buttonText
    })

    const textElement = button.element.querySelector('.mtrl-button-text')
    expect(textElement).toBeDefined()
    expect(textElement.textContent).toBe(buttonText)
  })

  test('should apply variant class', () => {
    const variant = 'filled'
    const button = createButton({
      variant
    })

    expect(button.element.className).toContain(`mtrl-button--${variant}`)
  })

  test('should handle click events', () => {
    const button = createButton()
    const handleClick = mock(() => {})

    button.on('click', handleClick)

    // Simulate click event
    const event = new Event('click')
    button.element.dispatchEvent(event)

    expect(handleClick).toHaveBeenCalled()
  })

  test('should support disabled state', () => {
    const button = createButton()

    // Initially not disabled
    expect(button.element.hasAttribute('disabled')).toBe(false)

    // Disable the button
    button.disable()
    expect(button.element.hasAttribute('disabled')).toBe(true)

    // Check that the disabled property is also set
    expect(button.element.disabled).toBe(true)

    // Enable the button
    button.enable()
    expect(button.element.hasAttribute('disabled')).toBe(false)
    expect(button.element.disabled).toBe(false)
  })

  test('should add icon content', () => {
    const iconSvg = '<svg><path d="M10 10"></path></svg>'
    const button = createButton({
      icon: iconSvg
    })

    const iconElement = button.element.querySelector('.mtrl-button-icon')
    expect(iconElement).toBeDefined()
    expect(iconElement.innerHTML).toBe(iconSvg)
  })

  test('should position icon correctly', () => {
    const iconSvg = '<svg><path d="M10 10"></path></svg>'

    // Test end position
    const endButton = createButton({
      text: 'End Icon',
      icon: iconSvg,
      iconPosition: 'end'
    })

    const textElement = endButton.element.querySelector('.mtrl-button-text')
    const iconElement = endButton.element.querySelector('.mtrl-button-icon')

    // In the DOM, for end position, the text should come before the icon
    const children = Array.from(endButton.element.childNodes)
    const textIndex = children.indexOf(textElement)
    const iconIndex = children.indexOf(iconElement)

    expect(textIndex).toBeLessThan(iconIndex)

    // Test start position
    const startButton = createButton({
      text: 'Start Icon',
      icon: iconSvg,
      iconPosition: 'start'
    })

    const startTextElement = startButton.element.querySelector('.mtrl-button-text')
    const startIconElement = startButton.element.querySelector('.mtrl-button-icon')

    const startChildren = Array.from(startButton.element.childNodes)
    const startTextIndex = startChildren.indexOf(startTextElement)
    const startIconIndex = startChildren.indexOf(startIconElement)

    expect(startIconIndex).toBeLessThan(startTextIndex)
  })

  test('should support different sizes', () => {
    const sizes = ['small', 'medium', 'large']

    sizes.forEach(size => {
      const button = createButton({
        size
      })

      expect(button.element.className).toContain(`mtrl-button--${size}`)
    })
  })

  test('should allow updating text', () => {
    const button = createButton({
      text: 'Initial'
    })

    const newText = 'Updated Text'
    button.setText(newText)

    const textElement = button.element.querySelector('.mtrl-button-text')
    expect(textElement.textContent).toBe(newText)
  })

  test('should allow updating icon', () => {
    const button = createButton()

    const iconSvg = '<svg><path d="M10 10"></path></svg>'
    button.setIcon(iconSvg)

    const iconElement = button.element.querySelector('.mtrl-button-icon')
    expect(iconElement).toBeDefined()
    expect(iconElement.innerHTML).toBe(iconSvg)
  })

  test('should properly clean up resources', () => {
    const button = createButton()
    const parentElement = document.createElement('div')
    parentElement.appendChild(button.element)

    // Destroy should remove the element and clean up resources
    button.destroy()

    expect(parentElement.children.length).toBe(0)
  })
})
