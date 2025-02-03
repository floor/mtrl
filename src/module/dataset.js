/**
 * Applies data attributes to a DOM element based on an object's properties.
 *
 * This function takes an object and applies its key-value pairs as data attributes
 * to a provided DOM element. Only the object's own properties (not inherited properties)
 * are applied.
 *
 * @param {Element} element - The DOM element to which data attributes will be applied.
 * @param {Object} data - An object containing key-value pairs to be applied as data attributes.
 */
const dataset = (element, data) => {
  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      element.dataset[key] = value
    })
  }
}

export default dataset
