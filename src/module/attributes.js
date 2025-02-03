/**
 * Sets attributes on a DOM element based on provided options.
 *
 * This function iterates over a list of attributes and sets them on the specified element.
 * Special attributes such as 'required', 'disabled', 'multiple', 'checked' are set as boolean attributes,
 * while others are set with their corresponding values from the options.
 *
 * @param {Element} element - The DOM element to which attributes will be applied.
 * @param {Object} options - An object containing the attributes and their values.
 */
const special = ['required', 'disabled', 'multiple', 'checked']

const attributes = (element, options) => {
  if (!element || !options?.attributes) return

  options.attributes.forEach(attribute => {
    if (options[attribute] !== undefined) {
      const value = special.includes(attribute) ? '' : options[attribute]
      element.setAttribute(attribute, value)
    }
  })
}

export default attributes
