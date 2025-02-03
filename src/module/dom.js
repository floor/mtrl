// DOM manipulation function

function append (container, element) {
  container.appendChild(element)
  return element
}

function prepend (container, element) {
  return container.insertBefore(element, container.firstChild)
}

function after (container, element) {
  return container.parentNode.insertBefore(element, container.nextSibling)
}

function before (container, element) {
  return container.insertBefore(element, container)
}

function replace (container, element) {
  return container.parentNode.replaceChild(element, container)
}

function remove (element) {
  const parent = element.parentNode
  return parent.removeChild(element)
}

function dispose (element) {
  const el = element
  return (el.parentNode) ? el.parentNode.removeChild(el) : el
}

function empty (element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
}

function destroy (element) {
  if (element && element.parentNode) {
    return element.parentNode.removeChild(element)
  } else {
    // console.error('Element or its parent node is null')
    return null
  }
}

export default { append, prepend, after, before, replace, remove, destroy, empty, dispose }
