import dom from '../module/dom'

const insert = (component, container, context = 'bottom') => {
  // console.log('insert', component, container, context)

  if (!component || !container) return

  const element = component.element || component
  container = container.element || container

  const contexts = ['top', 'bottom', 'after', 'before']
  const methods = ['prepend', 'append', 'after', 'before']

  const index = contexts.indexOf(context)
  if (index === -1) {
    return
  }

  const method = methods[index]

  // Insert component element to the DOM tree using dom
  dom[method](container, element)

  return element
}

export default insert
