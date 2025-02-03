import dataset from '../view/dataset'

import { create } from '../module/layout'

export default {
  build () {
    // console.log('build', this.options.layout)
    this.element = document.createElement('div')
    this.element.classList.add('form')

    if (this.options.class !== 'form') {
      this.element.classList.add(this.options.class)
    }

    if (this.options.form) {
      this.element.classList.add(this.options.form)
    }

    if (this.options.data) {
      dataset(this.element, this.options.data)
    }

    this.buildForm(this.options.form)

    this.buildLayout()

    // console.log('optioins container', this.options)

    if (this.options.container) {
      this.options.container.appendChild(this.element)
    }
  },

  buildForm (form) {
    this.form = document.createElement('form')
    this.element.appendChild(this.form)

    if (form && form.method) {
      this.form.setAttribute('method', form.method)
    }

    if (this.options.autocomplete) {
      this.form.setAttribute('autocomplete', this.options.autocomplete)
    }

    if (this.options.action) {
      this.form.setAttribute('action', this.options.action)
    }
  },

  buildLayout () {
    // console.log('buildLayout')
    this.form.innerHTML = ''
    this.layout = create(this.options.layout, this.form)
    this.ui = this.layout.component

    // console.log('ui', this.ui)

    this.extractInfo(this.ui)
    this.extractFile(this.ui)
    // console.log('file', this.file)

    if (this.disableControl) {
      this.disableControl()
    }

    if (this.language) {
      // console.log('translate')
      this.translate()
    }
  },

  extractFile (object) {
    this.file = {}

    for (const property in object) {
      if (object.hasOwnProperty(property)) {
        const files = property.split(/\./)
        if (files[0] === 'file' && files[1] !== undefined) {
          const name = property.substr(5, property.length)

          this.file[name] = object[property]
        }
      }
    }
  },

  extractInfo (object) {
    // console.log('extractField', object)

    this.field = {}
    this.fields = []

    for (const property in object) {
      if (object.hasOwnProperty(property)) {
        const infos = property.split(/\./)

        if (infos[0] === 'info' && infos[1] !== undefined) {
          const name = property.substr(5, property.length)
          // console.log('field', name, property)
          this.fields.push(name)
          this.field[name] = object[property]
        }
      }
    }
  },

  clean () {
    // console.log('clean', this.info)
    for (const member in this.info) {
      delete this.info[member]
    }

    this.form.reset()

    // console.log('cleaned', this.info)

    this.emit('cleaned')
  }
}
