export default {
  remove (id) {
    // console.log('remove', id, this.dataList)
    // console.log('datalist', this.dataList)

    if (!id) return

    if (!this.dataStore[id]) {
      // console.log('not in the list')
      return
    }

    this.dataList.splice(this.dataList.indexOf(id), 1)

    // remove id from the list
    this.data = this.data.filter((info) => { return info[this.dataId] !== id })

    // console.log('data', this.data)

    this.virtual.update(this.data)
  }
}
