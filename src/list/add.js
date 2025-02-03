
export default {
  add (info, context, silent) {
  // console.log('list add', info)

    if (this.options.reverse) {
      context = 'bottom'
    }

    if (!this.dataStore) return
    context = context !== undefined ? context : null

    this.dataList = this.dataList || []

    if (typeof context === 'number') {
      if (this.data) {
        this.data.splice(context, 0, info)
      } else {
        console.log('error no data')
      }

      if (this.dataList) {
        this.dataList.splice(context, 0, info[this.dataId])
      }
    } else if (context === 'bottom') {
      if (this.data) { this.data.push(info) }
      if (this.dataList) { this.dataList.push(info[this.dataId]) }
    } else {
      if (this.data) {
        this.data.unshift(info)
      } else {
        console.log('error no data')
      }

      if (this.dataList) { this.dataList.unshift(info[this.dataId]) }
    }

    this.dataStore[info[this.dataId]] = info
    // console.log('data', this.data.length, this.data)

    if (window.getComputedStyle(this.element, null).display === 'none') {
      this.virtual.items = this.data
    } else {
      this.virtual.update(this.data)
    }

    if (silent !== true) this.emit('added', info, context)

    // this.ui.body.scrollTo(0, this.ui.body.scrollTop + 1)
    // this.ui.body.scrollTo(0, this.ui.body.scrollTop - 1)

    return info
  }

}
