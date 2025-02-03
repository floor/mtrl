import request from '../module/request'

export default {
  async update (body, options) {
    // console.log('update', body, options)
    // console.log('mode', this.mode)
    options = options || {}

    // console.log('mode', this.mode)
    const method = options.method ||
      this.options[this.mode].method ||
      'PUT'

    const action = options.action ||
      this.options[this.mode].action ||
      this.options.action

    if (this.beforeCreate) {
      this.beforeCreate(body)
    }

    // console.log('request', action, method, body)
    const info = await request(action, method, body)

    // console.log('update', info)
    if (info.error) {
      // console.log('Error: ' + info.error)
      if (this.error) {
        this.error(info)
      }
    } else {
      // console.log('info', this.mode, info)
      if (this.mode === 'create') {
        this.emit('created', info)
        this.setMode('read')
      } else {
        this.emit('updated', info)
        this.setMode('read')
      }
      this.info = info
    }
  }
}
