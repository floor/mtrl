import emitter from './module/emitter'

class Loader {
  static defaults = {
    class: 'loader',
    timeout: 17000
  }

  constructor (options) {
    this.init(options)
    this.build()
  }

  init (options) {
    this.options = { ...Loader.defaults, ...options }
    Object.assign(this, emitter)
  }

  build () {
    this.element = document.createElement(this.options.tag || 'div')
    this.element.classList.add(this.options.class || 'loader')

    this.container = document.createElement('div')
    this.container.classList.add('container')
    this.element.appendChild(this.container)

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
        <circle
          class="base"
          cx="25" 
          cy="25" 
          r="20" 
          fill="none" 
          stroke="#e5e7eb" 
          stroke-width="3"
        />
        <circle
          class="base"
          cx="25" 
          cy="25" 
          r="16" 
          fill="none" 
          stroke="#e5e7eb" 
          stroke-width="2"
        />
        
        <circle 
          class="outer"
          cx="25" 
          cy="25" 
          r="20" 
          fill="none" 
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="62.8 62.8"
          stroke-dashoffset="62.8">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            calcMode="spline"
            keySplines="0.4, 0, 0.2, 1"
            keyTimes="0;1"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        <circle
          class="inner"
          cx="25" 
          cy="25" 
          r="16" 
          fill="none" 

          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="50.24 50.24"
          stroke-dashoffset="50.24">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 25 25"
            to="360 25 25"
            dur="1.8s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>`

    this.container.innerHTML = svg
    this.text = document.createElement(this.options.tag || 'span')
    this.text.classList.add('text')
    this.text.innerHTML = this.options.text
    this.container.appendChild(this.text)
  }

  setText (text) {
    if (text) {
      this.text.innerHTML = text
    }
  }

  show () {
    this.element.classList.add('show')

    clearTimeout(this.timeout)

    if (this.options.timeout) {
      this.timeout = setTimeout(() => {
        this.hide()
        this.emit('timeout')
      }, this.options.timeout)
    }
  }

  hide () {
    clearTimeout(this.timeout)
    this.element.classList.remove('show')
  }
}

export default Loader
