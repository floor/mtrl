const isArray = (object) => {
  return Object.prototype.toString.call(object) === '[object Array]'
}

const isLiteralObject = (object) => {
  return object && typeof object === 'object' && Object.getPrototypeOf(object) === Object.getPrototypeOf({})
}

const isIterable = (object) => {
  return isLiteralObject(object) ||
    isArray(object) ||
    (typeof object === 'object' &&
      object !== null &&
      object.length !== undefined)
}

const each = (object, callback) => {
  if (isArray(object) || (typeof object === 'object' && object.length !== undefined)) {
    for (let i = 0, l = object.length; i < l; i++) {
      callback.apply(object[i], [object[i], i])
    }
    return
  }

  if (isLiteralObject(object)) {
    for (const key in object) {
      callback.apply(object[key], [object[key], key])
    }
  }
}

const indexOf = (array, obj) => {
  if (Array.prototype.indexOf) {
    return Array.prototype.indexOf.call(array, obj)
  }
  for (let i = 0, j = array.length; i < j; i++) {
    if (array[i] === obj) {
      return i
    }
  }
  return -1
}

export { isArray, isIterable, isLiteralObject, each, indexOf }
