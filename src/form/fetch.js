import request from '../module/request'

export default {
  async fetch (option) {
    // console.log('fetch', this.options.route, option.method)

    const info = await request(this.options.route, option.method, option.formData)

    // console.log('updated', info, this.mode)
    if (this.mode === 'create') {
      this.emit('created', info)
      this.mode = 'read'
    } else {
      this.info = info
      this.emit('updated', info)
      this.mode = 'read'
    }

    if (this.success) {
      this.success(info)
    }
  }
}
