export default {
  create () {
    // console.log('create', this.mode, this.options.item.new)
    // console.log('selected', this.info, this.item)

    if (this.mode === 'create') return

    this.mode = 'create'

    if (this.options.virtual === true) {
      this.data.unshift(this.options.item.new)
      this.render(this.data)
    } else {
      if (this.options.item) {
        this.newItem = this.renderItem(this.options.item.new, 'create')
      }
    }

    this.emit('create', this.options.item.new)
  },

  created (data) {
    // console.log('created', this.data.length, data)
    if (this.options.virtual === true) {
      this.data[0] = data
      this.render(this.data)
    } else {
      this.mode = null
      this.info = data
      this.ui.body.removeChild(this.newItem)
      this.item = this.renderItem(data, 'top')
    }
  },

  createCancel () {
    // console.log('createCancel', this.newItem)
    // console.log('remove')
    // console.log('prepare reselect', this.info, this.item)
    this.ui.body.removeChild(this.newItem)
    this.mode = null
    if (this.item && this.info) {
      this.select(this.info, this.item)
    }
  }
}
