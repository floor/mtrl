const viewport = el => {
  if (!el) return

  const { top, left, width, height } = el.getBoundingClientRect()

  return (
    top >= window.pageYOffset &&
    left >= window.pageXOffset &&
    top + height <= window.pageYOffset + window.innerHeight &&
    left + width <= window.pageXOffset + window.innerWidth
  )
}

export default viewport
