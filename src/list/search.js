export default {
  search (keywords, page, size, more) {
    // console.log('search', keywords, page, size, more)

    this.emit('searching')

    if (more !== true) {
      this.ui.body.innerHTML = ''
      this.virtual.reset()
      this.data = []
      this.dataList = []
      this.data = []
      this.page = 1
      this.stop = false
    }

    this.data = this.data || []
    let signal = null

    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }

    if (more !== true) {
      this.abortController = new AbortController()
      signal = this.abortController.signal
    }

    page = page || 1
    size = size || this.options.list.size

    if (page === 1) {
      this.ui.body.scrolltop = 0
    }

    let route = this.buildRoute(page, size, 'search')

    route = this.addParams(route, 'search=' + keywords)

    // console.log('route', route)

    if (more !== true && this.options.count) {
      this.requestCount(route)
    }

    fetch(route, { signal }).then((resp) => {
      return resp.json()
    }).then((data) => {
      // console.log('data', data)
      this.storeData(data)

      this.data = data || []

      // console.log('list', list)

      if (data.error) {
        console.log('error', data.error)
        return
      }

      if (data.length < this.size && more) {
        this.stop = true
      }

      if (more === true) {
        const a = this.data.concat(data)
        this.data = a
        this.storeData(data, more)
        this.virtual.add(this.data)
      } else {
        this.data = []
        this.data = data
        this.storeData(data)
        this.render(data)
      }

      this.emit('fetched', data)
    }).catch(function (e) {
      // console.log('error', e.message)
    })
  },

  cancelSearch () {
    // console.log('cancel search')
    this.ui.body.innerHTML = ''
  },

  /**
   * [toggleSearch description]
   * @return {[type]} [description]
   */
  toggleSearch (e) {
    e.stopPropagation()
    // console.log('toggle search', this.ui.body)
    if (!this.ui['search-input'].element.classList.contains('show')) {
      this.showSearch()
    } else {
      this.hideSearch()
    }
  },

  /**
   * [showSearch description]
   * @return {[type]} [description]
   */
  showSearch (doNotEmpty) {
    if (this.hideFilter) {
      this.hideFilter()
    }

    // console.log('showSearch')
    this.mode = 'search'
    this.element.classList.add('search-mode')

    if (this.ui.search) {
      this.ui.search.element.classList.add('selected')
    }

    if (this.ui['search-input']) {
      this.ui['search-input'].set()
      this.ui['search-input'].show()
      this.ui['search-input'].focus()
    }

    if (!doNotEmpty) this.ui.body.innerHTML = ''

    // this.ui['search-list'].classList.add('show')
    // this.ui.body.classList.add('hide')
  },

  /**
   * [hideSearch description]
   * @return {[type]} [description]
   */
  hideSearch (notfetch) {
    // console.log('hideSearch', notfetch)
    this.mode = 'standard'
    this.element.classList.remove('search-mode')

    if (this.ui.search) {
      this.ui.search.element.classList.remove('selected')
    }
    if (this.ui['search-input']) {
      this.ui['search-input'].hide()
      this.ui['search-input'].set()
    }
    // this.ui['search-list'].classList.remove('show')
    // this.ui.body.classList.remove('hide')
    // console.log('request', notfetch)
    if (!notfetch) {
      this.request()
    }
  }
}
