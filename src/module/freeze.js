// Recursively freeze an object to prevent mutation

const isObject = item => {
  return item && typeof item === 'object' && !Array.isArray(item)
}

const freeze = obj => {
  if (isObject(obj)) {
    Object.freeze(obj)
    Object.keys(obj).forEach(key => freeze(obj[key]))
  }
  return obj
}

export default freeze
