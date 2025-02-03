export default {
  requestById (id, cb) {
    // log.error('requestById', id)
    if (!id) return
    return this.getPage(id, (data) => {
      // log.error('getPage', data)
      const page = data?.page || null
      if (data?.count) this.virtual.setCount(data?.count)
      this.request(page, null, null, cb)
    })
  },

  request (page, size, more, cb) {
    // console.log('request', page, size, more, cb)
    if (more !== true) {
      this.ui.body.innerHTML = ''
      this.virtual.reset()
      this.dataList = []
      this.data = []
      this.page = 1
      this.stop = true
    } else {
      if (this.dataList.length < size) {
        // console.log('no more request needed, data ', this.dataList.length)
        return
      }
    }

    this.data = this.data || []
    let signal = null

    if (this.abortController) {
      // console.log('abort')
      this.abortController.abort()
      this.abortController = null
    }

    if (more !== true && window.AbortController) {
      this.abortController = new AbortController()
      signal = this.abortController.signal
    }

    page = page || 1
    size = size || this.options.list.size
    // console.log('size', this.options.name, size)

    if (page === 1) {
      this.ui.body.scrolltop = 0
    }

    const route = this.buildRoute(page, size)

    if (more !== true && this.options.count) {
      this.requestCount(route)
    }

    // console.log('route - ', this.rand, route)

    fetch(route, { signal }).then((resp) => {
      return resp.json()
    }).then((data) => {
      if (this.options.debug) {
        console.log('data', route, data.length, data)
      }

      // console.log('route', route);

      data = data || []

      if (this.options.reverse) {
        data.reverse()
      }

      if (data.error) {
        console.log('error', data.error)
        return
      }

      if (data.length < this.size && more) {
        this.stop = true
      } else {
        this.stop = false
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

      if (cb) cb()

      this.emit('fetched', data)

      this.loaded = true

      if (page === 1 && data.length < 1) {
        this.emit('empty')
      }
    }).catch(function (e) {
      // console.log('error', e.message)
    })
  },

  requestCount (route, signal) {
    // console.log('fetchCount', route)
    fetch(route + '&count=1', { signal }).then((resp) => {
      return resp.json()
    }).then((data) => {
      // console.log('data', data.count)
      this.count = data.count
      this.statusDisplay('count', data.count)
    }).catch(function (e) {
      // console.log('error', e.message)
    })
  },

  addParams (route, params) {
    // console.log('addParams', route, params)

    if (!route) {
      console.log('error: no route specified!')

      return
    }

    if (route.indexOf('?') > -1) {
      // console.log('?', route, route.length, route[route.length - 1])
      if (route[route.length - 1] === '&' || route[route.length - 1] === '?') {
        route = route + params
      } else {
        route = route + '&' + params
      }
    } else {
      // console.log('add ?')
      route = route + '?' + params
    }

    return route
  },

  buildRoute (page, size, path) {
    // console.log('buildroute', this.options.route, path)
    path = path || 'list'

    page = page || 1
    size = size || this.options.list.size

    let route = this.options.route

    if (path) {
      route = this.options.route[path]
    }

    if (this.routeAddOn) {
      route = this.routeAddOn(route, path)
    }

    if (this.params && this.params()) {
      // console.log('params', route, this.params())
      route = this.addParams(route, this.params())
    } else {

    }

    if (this.ui.filter && this.ui.filter.element.classList.contains('selected')) {
      route = this.addParams(route, this.getFilter())
    }

    if (this.options.pagination) {
      route = this.addParams(route, 'page=' + page + '&size=' + size)
    }

    return route
  },

  storeData (list, more) {
    // console.log('storeData', list.length, more)
    if (more !== true) {
      this.dataList = []
    }

    // console.log('storeData', this.dataStore)
    this.dataStore = this.dataStore || {}

    for (let i = 0; i < list.length; i++) {
      this.dataList.push(list[i][this.dataId])
      this.dataStore[list[i][this.dataId]] = list[i]
    }
  }
}
