// deep merge
const isObject = item =>
  item && typeof item === 'object' && !Array.isArray(item)

const merge = (target, ...sources) => {
  sources.forEach(source => {
    if (isObject(source)) {
      Object.keys(source).forEach(key => {
        const sourceValue = source[key]
        if (isObject(sourceValue)) {
          if (!isObject(target[key])) target[key] = {}
          merge(target[key], sourceValue)
        } else {
          target[key] = sourceValue
        }
      })
    }
  })
  return target
}

export default merge
