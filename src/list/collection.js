
import emitter from 'material/src/module/emitter'

const defaults = {
  size: 25,
  count: true
}

class Collection {
  static uid = "material-list-collection";

  /**
   * Constructor
   * @param  {Object} options - Component options
   * @return {Object} Class instance
   */
  constructor (options) {
    this.options = Object.assign({}, defaults, options || {})
    Object.assign(this, emitter)

    return this
  }

  get (page, size, more) {
   // console.log('fetch', page, size, more)
    if (more !== true) {
      this.page = 1
      this.stop = false
    }

    this.data = this.data || []
    var signal = null

    if (this.abortController) {
      // console.log('abort')
      this.abortController.abort()
      this.abortController = null
    }

    if (more !== true) {
      this.abortController = new AbortController()
      signal = this.abortController.signal
    }

    page = page || 1
    size = size || this.options.list.size
    // console.log('fetch')

    if (page === 1) {
      this.ui.body.scrolltop = 0
    }

    var route = this.buildRoute(page, size)

    if (more !== true && this.options.count) {
      this.fetchCount(route)
    }

    fetch(route, {signal}).then((resp) => {
      return resp.json()
    }).then((data) => {
      if (this.options.debug) {
        console.log('data', route, data.length, data)
      }

      data = data || []

      if (data.error) {
        console.log('error', data.error)
        return
      }

      if (data.length < this.size && more) {
        this.stop = true
      }

      if (more === true) {
        var a = this.data.concat(data)
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
  }

  fetchCount (route, signal) {
    // console.log('fetchCount', route)
    fetch(route + '&count=1', {signal}).then((resp) => {
      return resp.json()
    }).then((data) => {
      // console.log('data', data.count)
      this.count = data.count
      this.statusDisplay('count', data.count)
    }).catch(function (e) {
      // console.log('error', e.message)
    })
  }

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
  }

  buildRoute (page, size, path) {
    // console.log('buildroute', this.options.route, path)
    path = path || 'list'

    page = page || 1
    size = size || this.options.list.size

    var route = this.options.route

    if (path) {
      route = this.options.route[path]
    }

    if (this.routeAddOn) {
      route = this.routeAddOn(route)
    }

    if (this.params) {
      // console.log('params', route, this.params())
      route = this.addParams(route, this.params())
    }

    if (this.ui.filter && this.ui.filter.element.classList.contains('selected')) {
      route = this.addParams(route, this.getFilter())
    }

    if (this.options.pagination) {
      route = this.addParams(route, 'page=' + page + '&size=' + size)
    }

    return route
  }

  storeData (list, more) {
    // console.log('storeData', list.length, more)
    if (more !== true) {
      this.dataList = []
    }

    // console.log('storeData', this.dataStore)
    this.dataStore = this.dataStore || {}
    for (var i = 0; i < list.length; i++) {
      this.dataList.push(list[i]this.dataId)
      this.dataStore[list[i]this.dataId] = list[i]
    }
  }

  set () {

  }

  setRoute (route) {
    this.route = route
  }
}

export default Collection
