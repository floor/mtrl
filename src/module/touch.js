export default () => {
  try {
    document.createEvent('TouchEvent')
    return true
  } catch (e) {
    return false
  }
}
