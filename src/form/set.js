export default {
  set (id) {
    // console.log('set', id)
    if (!id) return

    if (this.clean) {
      this.clean()
    }

    this.emit('set', id)

    this.setMode('read')
    // this.render(info)
    fetch(this.options.action + id, {
      headers: {
        Accept: 'application/json'
      },
      method: 'GET'
    }).then((resp) => {
      // console.log('resp', resp)
      return resp.json()
    }).then((info) => {
      if (this.options.debug) {
        console.log('info', info)
      }
      this.info = info
      this.render(info)
      this.emit('setted', info)
    })
  },

  setInfo (info) {
    // console.log('set', id)
    if (!info) return

    // console.log('info', info)
    this.info = info
    this.render(info)
    this.emit('setted', info)
  },

  updateInfo (info) {
    Object.assign(this.info, info)
    this.render(info)
  }
}
