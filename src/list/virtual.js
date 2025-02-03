import passiveEvents from '../module/passive'
import emitter from '../module/emitter'

// based on https://sergimansilla.com/blog/virtual-scrolling/

function VirtualList (options) {
  this.options = Object.assign({}, options || {})
  Object.assign(this, emitter)

  this.itemHeight = options.itemHeight

  // console.log('itemHeight', this.itemHeight)
  this.next = false
  this.size = options.size
  this.chunkSize = options.size

  this.items = options.items
  this.render = options.render

  this.scroller = VirtualList.createScroller()
  this.container = options.container

  // get offset height
  this.setOffset()

  // console.log('itemBySreen', this.itemsByScreen)

  window.addEventListener('resize', () => {
    clearTimeout(this.resizeTimeout)

    this.resizeTimeout = setTimeout(() => {
      this.setOffset()
    }, 50)
  })

  this.container.classList.add('virtual')
}

VirtualList.prototype._renderChunk = function (node, from, number) {
  // console.log('_renderChunk', from, number, this.options.class)

  const fragment = document.createDocumentFragment()
  fragment.appendChild(this.scroller)

  let last = from + number
  if (last > this.count) last = this.count

  for (let i = from; i < last; i++) {
    const item = this.render(i)

    item.style.position = 'absolute'
    item.style.top = i * this.itemHeight + 'px'
    fragment.appendChild(item)
  }

  node.innerHTML = ''
  node.appendChild(fragment)

  // console.log('last', last, 'count', this.count, 'size', this.size, 'chunk')
  // console.log('---------------------------------')
  // console.log('last && last > (this.count - this.size / 2)')
  // console.log(last + '>' + '(' + this.count + '-' + this.size + '/' + '2)' + (this.count - this.size / 2))

  if (this.next && last && last > (this.count - this.size / 2)) {
    // console.log('emit next', last, this.count, this.size)
    this.emit('next', this.count)
  }

  this.next = true

  // console.log('last', final, this.count)
}

VirtualList.prototype.set = function (items) {
  // console.log('set', items.length)
  this.next = false
  this.items = items
  this.count = items.length

  // console.log('count', this.count)

  if (this.count < 1 || this.count === undefined) return

  this.container.innerHTML = ''
  this.container.scrollTop = 0

  const height = this.itemHeight * this.count

  this.scroller.style.height = height + 'px'

  this.itemsByScreen = Math.ceil(this.offsetHeight / this.itemHeight)

  // console.log('offsetHeioght', this.container.offsetHeight)
  // console.log('this.itemsByScreen', this.itemsByScreen)

  // Cache 4 times the number of items that fit in the container viewport
  let size = this.itemsByScreen * 4
  this._renderChunk(this.container, 0, size)

  this.size = size

  // console.log('emit size', size)
  this.emit('size', size)

  const self = this
  let lastRepaintY
  const maxBuffer = this.itemsByScreen * this.itemHeight

  function onScroll (e) {
    // console.log('scroll', e.target.scrollTop, height)
    const scrollTop = e.target.scrollTop

    // console.log('itemsByScreen', self.itemsByScreen)

    // console.log('offsetHeight', self.container.offsetHeight)
    // console.log('size', self.size)
    // if (this.itemsByScreen === 0) {
    //   size = self.size = this.itemsByScreen * 4
    // }

    // console.log('scrollTop', scrollTop)

    if (scrollTop < 0) return

    // console.log('itemsByScreen', self.itemsByScreen)

    let first = parseInt(scrollTop / self.itemHeight) - self.itemsByScreen
    first = first < 0 ? 0 : first

    size = self.itemsByScreen * 4

    if (!lastRepaintY || Math.abs(scrollTop - lastRepaintY) > maxBuffer) {
      self._renderChunk(self.container, first, size)
      lastRepaintY = scrollTop
    }

    const progress = Math.ceil((scrollTop / self.itemHeight) + self.itemsByScreen) - 1
    // console.log('progress', progress, scrollTop, self.itemHeight)
    self.emit('progress', progress)

    // e.preventDefault && e.preventDefault()
  }

  // console.log('this.scrollEvents', this.scrollEvents)

  if (!this.scrollEvents) {
    this.container.addEventListener('scroll', onScroll, passiveEvents() ? { passive: true } : false)
    this.scrollEvents = true
  }

  // this.container.addEventListener('scroll', onScroll)
}

VirtualList.prototype.update = function (items) {
  // console.log('update', items)
  this.items = items || this.items

  if (!this.items) return

  this.count = this.items.length

  // var itemsByScreen = Math.ceil(this.container.offsetHeight / this.itemHeight)
  const cachedItemsLen = this.itemsByScreen * 4
  const scrollTop = this.container.scrollTop

  const height = this.itemHeight * this.count

  this.scroller.style.height = height + 'px'

  let first = parseInt(scrollTop / this.itemHeight) - this.itemsByScreen
  first = first < 0 ? 0 : first

  // console.log('first', first, cachedItemsLen)

  this._renderChunk(this.container, first, cachedItemsLen)
}

VirtualList.prototype.add = function (items) {
  // console.log('add', items.length)
  this.items = items || this.items

  if (!this.items) return

  this.count = this.items.length

  const height = this.itemHeight * this.count

  this.scroller.style.height = height + 'px'
}

VirtualList.prototype.reset = function () {
  // console.log('reset')
  this.items = []
  this.count = 0

  this.container.scrollTop = 0

  this.scroller.style.height = 0
}

VirtualList.prototype.setCount = function (count) {
  console.log('setCount', count)
  this.count = count
  const height = this.itemHeight * this.count

  console.log('scroller height', height)
  this.scroller.style.height = height + 'px'
}

VirtualList.prototype.getCount = function () {
  // console.log('getCount')

  return this.count
}

VirtualList.prototype.setOffset = function (info) {
  // console.log('setOffset', info)

  this.offsetHeight = this.container.offsetHeight
  if (this.offsetHeight < 1) {
    this.offsetHeight = window.innerHeight ||
    document.documentElement.clientHeight ||
    document.body.clientHeight
  }

  this.itemsByScreen = Math.ceil(this.offsetHeight / this.itemHeight)

  // console.log('new itemsByScreen', this.itemsByScreen)

  const itemsByScreen = Math.ceil(this.offsetHeight / this.itemHeight)

  // Cache 4 times the number of items that fit in the container viewport
  const size = itemsByScreen * 4

  return size
}

VirtualList.createScroller = function () {
  const scroller = document.createElement('div')
  scroller.classList.add('scroller')
  return scroller
}

export default VirtualList
