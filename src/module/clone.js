const deepClone = obj => {
  if (typeof obj !== 'object' || obj === null) {
    return obj // Return the value if obj is not an object
  }

  const clone = Array.isArray(obj) ? [] : {}

  Object.entries(obj).forEach(([key, value]) => {
    clone[key] = deepClone(value)
  })

  return clone
}

export default deepClone
