// modules
import { insertion } from './module/mutation.js'
import display from './mixin/display'
import offset from './element/offset'

// ui
import Control from './class/control'
import Button from './button'

class Tabs extends Control {
  static defaults = {
    class: 'tabs',
    mixins: [display],
    show: true,
    style: 'primary',
    indicator: {
      size: 30
    }
  }

  constructor (options) {
    super(options)

    insertion(this.element, () => this.setup())
  }

  setup () {
    this.items = Array.from(this.element.childNodes).filter(node => node.nodeType === Node.ELEMENT_NODE)
    this.item = {}

    this.items.forEach(item => {
      this.item[item.name] = item
      this.addListener(item)
    })

    this.indicator = document.createElement('div')
    this.indicator.classList.add('indicator')
    this.element.appendChild(this.indicator)

    if (this.options.show) this.show()

    if (this.options.selected && this.item[this.options.selected]) {
      this.select(this.options.selected, true)
    }

    this.emit('ready')
  }

  select (name, silent = false) {
    this.items.forEach(item => {
      item.classList.toggle('selected', name === item.name)
    })

    this.selectedName = name

    if (!silent) this.emit('select', name)
    this.updateIndicator(name)
  }

  updateIndicator (name) {
    name = name ?? this.selectedName

    const item = this.item[name]

    if (!item) return

    this.selected = item
    const oElement = offset(this.element)
    const oItem = offset(item)

    const label = item.querySelector('label')
    const oLabel = label ? offset(label) : null
    const width = oLabel?.width ?? this.options.indicator.size

    const style = this.options.style === 'secondary'
      ? `width: ${oItem.width}px; left: ${oItem.left - oElement.left}px;`
      : `width: ${width}px; left: ${oItem.left - oElement.left + (oItem.width / 2) - (width / 2)}px;`

    this.indicator.setAttribute('style', style)
  }

  addListener (item) {
    item.addEventListener('click', (ev) => {
      this.select(item.name)
    })
  }
}

export default Tabs
