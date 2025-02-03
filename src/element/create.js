import * as css from '../module/css'

const create = (tag = 'div', className) => {
  const element = document.createElement(tag)
  css.add(element, className)
  return element
}

export default create
