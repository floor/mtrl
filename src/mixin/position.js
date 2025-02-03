export default {
  position (target, position) {
    // console.log('position', target)
    target = target || this.options.target
    position = position || this.options.position
    const { offsetX = 0, offsetY = 0, align = 'center', vAlign = 'middle' } = position

    if (!target) return this

    // console.log('--- target', target)

    this.options.container = this.options.container || this.element.parentNode

    const caller = target.getBoundingClientRect()
    const screen = this.options.container.getBoundingClientRect()
    const element = this.element.getBoundingClientRect()

    let left, top

    switch (align) {
      case 'left':
        left = caller.left + caller.width
        break
      case 'right':
        left = caller.left
        if (left + element.width + offsetX > screen.width) {
          left = caller.left - element.width + caller.width
        }
        break
      case 'center':
        left = caller.left + (caller.width / 2) - (element.width / 2)

      default:
        left = caller.left + (caller.width / 2) - (element.width / 2)
    }

    // ensure that the element remains within the limits of its container

    // if (left < 0) left = offsetX

    // if (left + element.width + offsetX > screen.width) {
    //   left = screen.width - element.width - offsetX
    // }

    if (left < 0) left = offsetX

    if (left + element.width > screen.width) {
      left = caller.left - element.width
    }

    // console.log('left', left)

    // left = Math.max(offsetX, Math.min(left, screen.width - element.width - offsetX))

    const scrollY = window.scrollY

    switch (vAlign) {
      case 'top':
        top = caller.top + scrollY - element.height
        break
      case 'inline':
        top = caller.top + scrollY
        break
      case 'bottom':
        top = caller.top + caller.height + scrollY
        break
      case 'middle':
      case 'dynamic':
        if (caller.top + caller.height / 2 < screen.height / 2) {
          top = caller.bottom + scrollY // Positionner en dessous si dans la moitié supérieure
        } else {
          top = caller.top + scrollY - element.height // Positionner au-dessus si dans la moitié inférieure
        }
        break

      default:
        top = caller.top + scrollY + (caller.height / 2) - (element.height / 2)
    }

    // console.log('screen height', screen.height, element.height, offsetX)

    if (top + element.height + offsetY > screen.height) {
      top = screen.height - element.height - offsetX
    }

    this.element.style.left = `${left}px`
    this.element.style.top = `${top}px`

    return this
  }
}
