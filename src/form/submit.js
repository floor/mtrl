export default {

  async submit (ev) {
    if (ev) ev.preventDefault()
    // console.log('submit', this.mode)

    const data = this.initData()

    // for (const pair of data.entries()) {
    //   console.log(`${pair[0]}: ${pair[1]}`)
    // }

    // console.log('data', data)

    if (this.update) {
      // console.log('this.update', this.update)
      await this.update(data)
    } else {
      this.setMethod(data)
    }

    return false
  },

  setMethod (formData) {
    // console.log('setMethod', this.mode)
    let method = 'PUT'
    if (this.mode === 'create') {
      method = 'POST'
    }

    if (this.fetch) {
      // console.log('formData', formData.keys())
      this.fetch({
        method,
        formData
      })
    }

    if (this.action) {
      this.action({
        method,
        formData
      })
    }
  }
}
