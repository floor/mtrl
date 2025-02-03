import Component from './class/component'
import Element from './element'
import position from './mixin/position'
import touch from './module/touch'

class Tooltip extends Component {
  static defaults = {
    base: 'component',
    class: 'tooltip',
    tag: 'span',
    mixins: [position],
    targets: '[data-tooltip]',
    offset: {
      top: 60
    },
    position: {
      align: 'center',
      vAlign: 'bottom'
    },
    disabled: false,
    layout: [
      [Element, { tag: 'span', class: 'pointer' }],
      [Element, 'label', { tag: 'span', class: 'label' }]
    ]
  }

  bindTargets () {
    const targets = document.querySelectorAll(this.options.targets)
    for (let i = 0; i < targets.length; i++) {
      targets[i].addEventListener('mouseover', (e) => {
        if (touch()) return

        if (this.disabled === true) {
          this.hide()
          return
        }

        if (e.currentTarget.classList.contains('selected')) {
          this.hide()
          return
        }

        this.ui.label.innerHTML = e.currentTarget.dataset.tooltip
        const coord = this.offset(e.currentTarget)

        this.show()
        // this.element.style.top = (coord.top + this.options.offset.top) + 'px'
        // this.element.style.left = coord.left - (this.element.offsetWidth / 2) + (e.currentTarget.offsetWidth / 2) + 'px'

        this.position(e.currentTarget)
      })

      targets[i].addEventListener('mouseleave', (e) => {
        this.ui.label.innerHTML = ''
        this.hide()
      })
    }

    this.element.addEventListener('click', (e) => {
      e.preventDefault()
      e.stop()
      this.hide()
    })
  }

  offset (target) {
    const rect = target.getBoundingClientRect()
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
  }

  hide () {
    this.element.classList.remove('show')
  }

  show () {
    this.element.classList.add('show')
  }

  disable () {
    // console.log('disable')
    this.hide()
    this.disabled = true
  }

  enable () {
    // console.log('enable')
    this.disabled = false
  }
}

export default Tooltip
