
/**
 * extract.e extract a event and the context
 * @param  {[type]} str [description]
 * @return {[type]}     [description]
 */
const e = (instance, ev) => {
  if (!ev) return instance
  else if (!ev.match(/\./)) {
    return {
      element: instance,
      name: ev
    }
  }

  let iteration
  const obj = {}
  let element

  const keys = ev.split('.')

  if (keys[0] === 'window') {
    element = window
  } else {
    for (let i = 0, l = keys.length; i <= l; i++) {
      const key = keys[i]
      iteration = iteration || instance
      iteration = iteration[key]

      if (i === keys.length - 2) {
        element = iteration
      }
    }
  }

  obj.element = element
  obj.name = keys[keys.length - 1]
  return obj
}

/**
 * extract.f extract a function from a string using dot
 * @param  {string} func A string representing a function accessible in dot notation
 * @return {function}      The function
 */
const f = (instance, func) => {
  if (!func) return

  if (typeof func === 'function') {
    return func
  } else if (!func.match(/\./)) return instance[func]
  let iteration

  const keys = func.split('.')
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]

    iteration = iteration || instance
    iteration = iteration[key]
  }

  return iteration
}

export default { e, f }
