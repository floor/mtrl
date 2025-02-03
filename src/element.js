class Element {
  static isElement () {
    return true
  }

  constructor (options = {}) {
    // Use the spread operator for default options
    this.options = { tag: 'div', container: null, html: '', text: '', id: '', ...options }

    const element = document.createElement(this.options.tag)

    // Apply HTML, text, and id if provided
    if (this.options.html) element.innerHTML = this.options.html
    if (this.options.text) element.textContent = this.options.text
    if (this.options.id) element.setAttribute('id', this.options.id)

    // Apply additional attributes
    for (const key in this.options) {
      if (!['tag', 'container', 'html', 'text', 'id', 'data'].includes(key)) {
        element.setAttribute(key, this.options[key])
      }
    }

    // Apply additional dataset
    for (const key in this.options.data) {
      element.setAttribute('data-' + key, this.options.data[key])
    }

    // Append to container if available
    if (this.options.container) {
      this.options.container.appendChild(element)
    }

    return element
  }
}

export default Element
