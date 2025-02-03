import create from '../element/create'
import insert from '../element/insert'

const prefix = 'material'

function label (root, text, options) {
  text = text || null

  const prefix = options.class || options.prefix

  const label = create('label', prefix + '-label')
  label.textContent = text
  label.setAttribute('for', options.name)
  insert(label, root)

  return label
}

export default label
