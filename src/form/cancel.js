export default {
  cancel (ev) {
    if (ev) ev.preventDefault()

    this.render(this.info)

    if (this.mode === 'create') {
      this.mode = null
      this.emit('cancel', 'create')
    }

    this.setMode('read')

    return false
  }
}
