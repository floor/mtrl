
export default {
  click (e) {
    // console.log('click', e.target)
    e.stopPropagation()

    if (e.target === e.currentTarget) {
      return
    }

    const target = '[data-id]'
    let item = e.target
    let i = 0

    while (item && !item.matches(target)) {
      // console.log('item', item)
      if (i > 10) {
        item = null
        break
      }
      item = item.parentNode
      i++
    }

    if (e.target.matches('BUTTON') && e.target.dataset.name && item.dataset.id) {
      // console.log('button', e.target.dataset.name)
      this.emit(e.target.dataset.name, item.dataset.id)
      return this
    }

    if (this.select) {
      this.select(item)
    }

    // console.log('item', item, e.target.dataset.name)

    return this
    // console.log(item)
  }
}
