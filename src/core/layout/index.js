import { isObject } from '../utils'

const createComponent = (Component, options = {}) => {
  // Check if Component is a class (has prototype) or function
  const isClass = Component.prototype && Component.prototype.constructor === Component

  if (isClass) {
    return new Component(options)
  }

  return Component(options)
}

/**
 * Recursively creates components based on a provided schema.
 *
 * @param {Array} schema - An array of components or sub-schemas.
 * @param {HTMLElement} container - The container for the current level of components.
 * @param {Object} [structure={}] - An accumulator object for components, keyed by name.
 * @param {number} [level=0] - The current level of recursion.
 * @returns {Object} The structure containing all created components.
 */
const createLayout = (schema, container, structure = {}, level = 0, components = []) => {
  level++
  let component
  const object = {}
  const fragment = document.createDocumentFragment()

  if (!Array.isArray(schema)) {
    console.error('Schema is not an array!', container, level, schema)
  }

  for (let i = 0; i < schema.length; i++) {
    let name
    let options = {}

    if (schema[i] instanceof Object && typeof schema[i] === 'function') {
      if (isObject(schema[i + 1])) {
        options = schema[i + 1]
      } else if (isObject(schema[i + 2])) {
        options = schema[i + 2]
      }

      if (options.id) {
        name = options.id
      } else if (typeof schema[i + 1] === 'string') {
        name = schema[i + 1]
        if (!schema[i].isElement && !schema[i].isComponent) {
          options.name = name
        }
      }

      component = createComponent(schema[i], options)

      const element = component.element || component
      if (level === 1) structure.element = element

      if (name) {
        structure[name] = component
        components.push([name, component])
      }

      if (component) {
        if (component.insert) component.insert(fragment)
        else fragment.appendChild(element)

        if (container) {
          // console.log('container', container)
          component._container = container
          if (component.onInserted) component.onInserted(container)
        }
      }
    } else if (Array.isArray(schema[i])) {
      if (!component) component = container
      createLayout(schema[i], component, structure, level, components)
    }
  }

  if (container && fragment.hasChildNodes()) {
    const wrapper = container.element || container
    wrapper.appendChild(fragment)
  }

  function get (name) {
    return structure[name] || null
  }

  object.component = structure
  object.components = components
  object.get = get

  return object
}

export default createLayout
