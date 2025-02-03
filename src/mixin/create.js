import classify from '../module/classify'

function create (options) {
  const element = document.createElement(options.tag || 'div')

  classify(element, options)

  return element
}

export default create
