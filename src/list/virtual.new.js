// based on https://sergimansilla.com/blog/virtual-scrolling/

// Import necessary modules
import passiveEvents from '../module/passive' // Import the passiveEvents utility.
import emitter from '../module/emitter' // Import the emitter module.

// Define the VirtualList class
class VirtualList {
  static uid = "material-list-virtuallist";

  constructor (options) {
    // Initialize the class with options passed to the constructor.
    this.options = { ...(options || {}) } // Spread operator to merge options with default values.
    Object.assign(this, emitter) // Assign emitter methods to the instance.

    // Destructure options for easier access to properties.
    const { itemHeight = 0, size = 0, items = [], render, container } = options

    // Initialize instance variables with default or provided values.
    this.itemHeight = itemHeight
    this.next = false
    this.size = size
    this.chunkSize = size
    this.items = items
    this.render = render
    this.scroller = VirtualList.createScroller()
    this.container = container

    // Get the offset height of the container.
    this.setOffset()

    // Add a window resize event listener to update the offset height.
    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout)

      this.resizeTimeout = setTimeout(() => {
        this.setOffset()
      }, 50)
    })

    // Add 'virtual' class to the container element.
    this.container.classList.add('virtual')
  }

  // Method to render a chunk of items within the visible range.
  renderChunk (node, from, number) {
    const fragment = document.createDocumentFragment()
    fragment.appendChild(this.scroller)

    let last = from + number
    if (last > this.count) last = this.count

    for (let i = from; i < last; i++) {
      const item = this.render(i)

      // Position the item absolutely based on its index and item height.
      item.style.position = 'absolute'
      item.style.top = i * this.itemHeight + 'px'
      fragment.appendChild(item)
    }

    node.innerHTML = ''
    node.appendChild(fragment)

    // Emit 'next' event if applicable.
    console.log('last', last)
    console.log('count', this.count)
    console.log('next', this.next)
    console.log('size', this.size)

    if (this.next && last && last > (this.count - this.size / 2)) {
      this.emit('next', this.count)
    }

    this.next = true
  }

  // Method to set the items and render the initial chunk.
  set (items) {
    this.next = false
    this.items = items
    this.count = items.length

    if (this.count < 1 || this.count === undefined) return

    this.container.innerHTML = ''
    this.container.scrollTop = 0

    const height = this.itemHeight * this.count

    this.scroller.style.height = height + 'px'

    this.itemsByScreen = Math.ceil(this.offsetHeight / this.itemHeight)

    let size = this.itemsByScreen * 4
    this.renderChunk(this.container, 0, size)

    this.size = size

    this.emit('size', size)

    let lastRepaintY
    const maxBuffer = this.itemsByScreen * this.itemHeight

    // Add a scroll event listener to render items dynamically.
    const onScroll = (e) => {
      const scrollTop = e.target.scrollTop
      const first = parseInt(scrollTop / this.itemHeight) - this.itemsByScreen

      size = this.itemsByScreen * 4

      if (!lastRepaintY || Math.abs(scrollTop - lastRepaintY) > maxBuffer) {
        this.renderChunk(this.container, first, size)
        lastRepaintY = scrollTop
      }

      const progress = Math.ceil((scrollTop / this.itemHeight) + this.itemsByScreen) - 1
      this.emit('progress', progress)
    }

    if (!this.scrollEvents) {
      // Add scroll event listener with passive option if supported.
      this.container.addEventListener(
        'scroll',
        onScroll,
        passiveEvents() ? { passive: true } : false
      )
      this.scrollEvents = true
    }
  }

  // Method to update the items and re-render the visible chunk.
  update (items) {
    this.items = items || this.items

    if (!this.items) return

    this.count = this.items.length
    const cachedItemsLen = this.itemsByScreen * 4
    const scrollTop = this.container.scrollTop
    const height = this.itemHeight * this.count

    this.scroller.style.height = height + 'px'

    let first = parseInt(scrollTop / this.itemHeight) - this.itemsByScreen
    first = first < 0 ? 0 : first

    this.renderChunk(this.container, first, cachedItemsLen)
  }

  // Method to add items and update the container height.
  add (items) {
    this.items = items || this.items

    if (!this.items) return

    this.count = this.items.length
    const height = this.itemHeight * this.count

    this.scroller.style.height = height + 'px'
  }

  // Method to reset the items and container to an initial state.
  reset () {
    this.items = []
    this.count = 0

    this.container.scrollTop = 0

    this.scroller.style.height = '0'
  }

  // Method to set the offset height of the container.
  setOffset (info) {
    this.offsetHeight = this.container.offsetHeight
    if (this.offsetHeight < 1) {
      this.offsetHeight = window.innerHeight ||
        document.documentElement.clientHeight ||
        document.body.clientHeight
    }

    this.itemsByScreen = Math.ceil(this.offsetHeight / this.itemHeight)

    const itemsByScreen = Math.ceil(this.offsetHeight / this.itemHeight)
    const size = itemsByScreen * 4

    return size
  }

  // Method to get the total count of items.
  getCount () {
    return this.count
  }

  // Static method to create a scroller element.
  static createScroller () {
    const scroller = document.createElement('div')
    scroller.classList.add('scroller')
    return scroller
  }
}

// Export the VirtualList class as the default export.
export default VirtualList
