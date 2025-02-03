const passiveEvents = () => {
  let supportsPassive = false

  try {
    const opts = Object.defineProperty({}, 'passive', {
      get () {
        supportsPassive = true
      }
    })

    // Test if the browser supports passive event listeners
    window.addEventListener('testPassive', null, opts)
    window.removeEventListener('testPassive', null, opts)
  } catch (e) {
    // If there was an error, it's safe to assume that passive event listeners are not supported
    supportsPassive = false
  }

  return supportsPassive
}

export default passiveEvents
