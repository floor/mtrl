/**
 * Serializes an object into a string representation.
 *
 * This function takes an object and serializes its properties into a string format.
 * It sorts the keys of the object, and for each key, it checks if the corresponding
 * value is an object. If it is, the function is called recursively on that object.
 * The output is a string where each key-value pair is separated by a colon, and
 * pairs are separated by a pipe character.
 *
 * @param {Object} object - The object to be serialized.
 * @returns {string} The serialized string representation of the object.
 */
const serialize (object, separator = '|') => {
  const keys = Object.keys(object).sort()
  const serialized = keys.map(key => {
    const value = object[key]
    if (typeof value === 'object' && value !== null) {
      return `${key}:${serialize(value)}`
    }
    return `${key}:${value}`
  })
  return serialized.join(separator)
}

export default serialize
