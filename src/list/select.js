import clone from '../module/clone'

export default {
  select (item, silent) {
    // console.log('select', item.dataset.id)
    if (!item || !item.dataset.id) return

    const id = item.dataset.id

    this.index = this.dataList.indexOf(id)
    this.info = this.dataStore[id]

    if (this.options.preventSelectAgain && this.id === id) {
      return
    }

    const selected = this.ui.body.querySelector('.selected')
    if (selected) selected.classList.remove('selected')

    if (id) {
      this.highlight(item)
      this.item = item
      this.id = id

      if (silent !== true) {
        this.emit('select', id)
        this.emit('selectItem', item)
      }
    } else {
      this.id = null
      this.item = null
    }
  },

  unselect () {
    // console.log('unselect')
    const item = this.ui.body.querySelector('[data-id="' + this.id + '"]') || this.item
    this.id = null
    if (item) {
      item.classList.remove('selected')
    }
    this.index = null
    this.item = null
  },

  getInfoById (id) {
    // console.log('getInfoById', this.dataStore)
    let info = null

    if (this.dataStore) info = clone(this.dataStore[id])

    return info
  },

  getSelectedInfo () {
    return clone(this.dataStore[this.id])
  },

  getItemById (id, silent) {
    // console.log('selectItemById', id)
    const item = this.ui.body.querySelector('[data-id="' + id + '"]')

    if (!item) {
      return null
    } else {
      return item
    }
  },

  selectById (id, silent) {
    // console.log('selectById', id)

    if (!this.dataList) {
      return false
    }

    const index = this.dataList.indexOf(id)
    if (index < 0) {
      // console.log('can\'t selectid, not in the list')
      return false
    }

    this.index = index
    this.id = id

    this.selectItemById(id, 'down')

    return id
  },

  selectItemById (id, direction) {
    // console.log('selectItemById', id)
    const item = this.ui.body.querySelector('[data-id="' + id + '"]')

    this.id = id

    if (!item) {
      const index = this.dataList.indexOf(id)
      // console.log('not found in DOM, check in dataList', index)
      if (index > -1) {
        const listSize = this.options.list.size
        const slice = listSize * index / listSize
        // console.log('getSlice', slice)
      }

      return
    }

    // console.log('item found', item)

    // if (this.item) this.item.classList.remove('selected')

    const selected = this.ui.body.querySelector('.selected')
    if (selected) selected.classList.remove('selected')

    this.item = item
    item.classList.add('selected')

    if (this.options.updatePosition === true) {
      // console.log('selectPosition', item)
      this.selectPosition(item, direction)
    }

    return item
  },

  selectPosition (item, direction) {
    const offsetY = this.options.item.height
    direction = direction || 'down'
    // console.log('selectPosition', this.ui.body, direction)

    this.coord = this.ui.body.getBoundingClientRect()

    // console.log('coord', this.coord)

    const itemTop = item.offsetTop + this.coord.top - this.ui.body.scrollTop

    if (direction === 'down' && itemTop + this.options.item.height + offsetY - this.coord.y > this.coord.height) {
      var top = this.ui.body.scrollTop + itemTop - this.coord.height - this.coord.y + this.options.item.height + offsetY
      this.ui.body.scrollTo({
        top,
        left: 0
        // behavior: 'smooth'
      })
    }

    if (direction === 'up' && itemTop - offsetY < this.coord.top + this.coord.y) {
      var top = this.ui.body.scrollTop + itemTop - this.coord.top - offsetY
      // console.lof('scrollTo', top, item)
      this.ui.body.scrollTo({
        left: 0,
        top
        // behavior: 'smooth'
      })
    }
  },

  selectNext (silent) {
    // console.log('selectNext', this.id)
    const idx = this.dataList.indexOf(this.id)

    const id = this.dataList[idx + 1]

    // console.log('id', id)

    if (id) {
      this.id = id
      // console.log('item', item)
      this.selectItemById(id, 'down')

      if (silent !== true) {
        this.emit('select', id)
      }
      return id
    } else {
      return false
    }
  },

  selectPrevious (silent) {
    // console.log('selectPrevious', this.id)
    const idx = this.dataList.indexOf(this.id)

    const id = this.dataList[idx - 1]

    if (id) {
      this.id = id
      // console.log('item', item)
      this.selectItemById(id, 'up')

      if (silent !== true) {
        this.emit('select', id)
      }
      return id
    } else {
      return false
    }
  },

  scrollIntoView (item) {
    // console.log('selectPrevious', this.id)
    item = item || this.item

    if (item) {
      item.scrollIntoView({ behavior: 'instant', block: 'end', inline: 'nearest' })
    }
  },

  highlight (item) {
    if (this.item) {
      this.item.classList.remove('selected')
    }
    item.classList.add('selected')
  },

  selectCreated (info, item) {
    // console.log('select create', info, this.item)
    if (this.item) {
      this.item.classList.remove('selected')
    }

    item.classList.add('selected')

    this.emit('selectCreate', info)
  }
}
