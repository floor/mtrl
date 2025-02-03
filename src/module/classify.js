import * as css from '../module/css'

function classify (element, options) {
  css.add(element, options.prefix + '-' + options.class)

  if (options.name) {
    css.add(element, options.class + '-' + options.name)
  }

  if (options.type) {
    // css.add(element, options.class + '-' + options.type)
    css.add(element, 'type-' + options.type)
  }

  if (options.color) {
    css.add(element, options.color + '-color')
  }

  if (options.css) {
    css.add(element, options.css)
  }

  if (options.elevation) {
    css.add(element, 'elevation-z' + options.elevation)
  }

  if (options.name) {
    // console.log('name', options.name)
    element.dataset.name = options.name
  }

  if (options.label) {
    element.title = options.label
  }

  if (options.style) {
    const styles = options.style.split(' ')
    for (let i = 0; i < styles.length; i++) {
      css.add(element, 'style-' + styles[i])
    }
  }

  if (options.data) {
    for (const property in options.data) {
      if (options.data.hasOwnProperty(property)) {
        element.dataset[property] = options.data[property]
      }
    }
  }

  if (options.theme) {
    element.classList.add(options.theme + '-theme')
  }
}

export default classify
