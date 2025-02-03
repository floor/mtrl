const has = (element, className) => {
  if (!element || !className) return false
  return !!element.className.match(new RegExp(`(\\s|^)${className}(\\s|$)`))
}

const add = (element, className) => {
  if (!element || !className) return

  const sanitizedClassName = className.trim().replace(/\s+/g, ' ')
  const classNames = sanitizedClassName.split(' ')

  for (const cn of classNames) {
    if (!has(element, cn)) {
      element.classList.add(cn)
    }
  }
  return element
}

const remove = (element, className) => {
  if (!element || !className) return
  element.classList.remove(className)
  return element
}

const toggle = (element, className) => {
  if (has(element, className)) {
    remove(element, className)
  } else {
    add(element, className)
  }
  return element
}

export { has, add, remove, toggle }
