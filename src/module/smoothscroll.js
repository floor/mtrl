const smoothscroll = (e, top, time = 275) => {
  const start = top - e.scrollTop
  const step = start / 100
  let current = 0

  while (current <= time) {
    window.setTimeout(scrolling, current, e, step)
    current += time / 100
  }
}

const scrolling = (e, step) => {
  e.scrollBy(0, step)
}

export default smoothscroll
