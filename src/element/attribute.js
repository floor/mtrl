const init = (element, attribute) => {
  for (const key in attribute) {
    if (Object.prototype.hasOwnProperty.call(attribute, key)) {
      element.setAttribute(key, attribute[key])
    }
  }
  return element
}

const set = (element, name, value) => {
  return element.setAttribute(name, `${value}`)
}

const get = (element, name) => {
  return element.getAttribute(name) || null
}

const remove = (element, name) => {
  return element.removeAttribute(name)
}

export default { init, set, get, remove }
