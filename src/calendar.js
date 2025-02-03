import create from './element/create'
import insert from './element/insert'
import * as css from './module/css'
import events from './module/events'
import emitter from './module/emitter'

import Button from './button'
import iconBack from './skin/material/icon/back.svg'
import iconForward from './skin/material/icon/forward.svg'

class Calendar {
  static defaults = {
    prefix: 'material',
    class: 'calendar',
    target: '.week-day',
    functions: ['newEvent'],
    rangedays: 7,
    months: ['January', 'February', 'Mars', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    days: ['Sunday', 'Monday', 'Tuesday', 'wednesday', 'Thursday', 'Friday', 'Saturday'],
    mode: 'view',
    range: [8, 18],
    display: 'three',
    weekend: [0, 1],
    events: [
      ['root.dblclick', 'add']
    ]
  }

  constructor (options) {
    this.init(options)
    this.build()
    this.setup()
  }

  init (options) {
    this.options = { ...Calendar.defaults, ...options }
    Object.assign(this, emitter, attach)

    // init function
    this._initFunction(this.options.functions)

    this.date = this.options.date || new Date()

    this.firstDay = this.getFirstDayOfWeek(this.date)

    this.firstDay.setHours(0)
    this.firstDay.setMinutes(0)
    this.firstDay.setSeconds(0)

    return this
  }

  setup () {
    events.attach(this.options.events, this)
  }

  getFirstDayOfWeek (d) {
    d = new Date(d)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday

    return new Date(d.setDate(diff))
  }

  /**
   * [_initFunction description]
   * @param  {?} functions [description]
   * @return {?}           [description]
   */
  _initFunction (functions) {
    functions = functions || []

    for (let i = 0; i < functions.length; i++) {
      const name = functions[i]
      if (this.options[name]) {
        this[name] = this.options[name]
      }
    }
  }

  /**
   * [_initList description]
   * @param  {Object} options this class options
   * @return {Object} The class instance
   */
  build () {
    // define main tag
    const tag = this.options.tag || 'div'

    this.element = create(tag, this.options.prefix + '-' + this.options.class)

    this.buildWeek()

    if (this.options.container) {
      insert(this.element, this.options.container)
    }

    return this
  }

  /**
   * [buildWeek description]
   * @return {[type]} [description]
   */
  buildWeek () {
    this.buildHeader()
    this.buildAllDay()
    this.buildBody()

    this.body.scrollTop = 480

    return this
  }

  /**
   * [buildHeader description]
   * @return {[type]} [description]
   */
  buildHeader () {
    this.header = create('header')
    insert(this.header, this.element)

    this.buildHeadline()

    const element = create('div')
    insert(element, this.header)
    css.add(element, 'header-days')

    const date = new Date(this.firstDay)
    const days = this.options.rangedays

    const margin = create('div')
    css.add(margin, 'margin')
    insert(margin, element)

    for (let i = 0; i < days; i++) {
      const dow = this.options.days[date.getDay()]
      const dom = (date.getMonth() + 1) + '/' + date.getDate()

      const cell = create('div')
      cell.innerHTML = '<div class="first">' + dow + '</div><div class="second">' + dom + '</div>'
      css.add(cell, 'date')
      insert(cell, element)

      date.setDate(date.getDate() + 1)
    }
  }

  /**
   * [buildHeadline description]
   * @return {?} [description]
   */
  buildHeadline () {
    this.headline = create('div', this.options.class + '-headline')

    insert(this.headline, this.header)

    const year = this.firstDay.getFullYear()

    const month = this.options.months[this.firstDay.getMonth()]

    const monthIndex = create('div', 'month-year')
    monthIndex.innerHTML = '<b>' + month + '</b> ' + year
    insert(monthIndex, this.headline)

    this.buildNavigation()
  }

  /**
   * [buildNavigation description]
   * @return {?} [description]
   */
  buildNavigation () {
    const navigation = create('div', this.options.prefix + '-toolbar')
    insert(navigation, this.headline)

    const back = new Button({
      icon: iconBack,
      style: 'dense'
    }).on('click', () => {
      this.back()
    }).insert(navigation)

    css.add(back.root, 'compact')

    const today = new Button({
      style: 'dense',
      label: 'today'
    }).on('click', () => {
      this.goto()
    }).insert(navigation)

    css.add(today.root, 'compact')

    const next = new Button({
      icon: iconForward,
      style: 'dense'
    }).on('click', () => {
      this.next()
    }).insert(navigation)

    css.add(next.root, 'compact')
  }

  /**
   * [_initAllDay description]
   * @param  {?} head [description]
   * @return {?}      [description]
   */
  buildAllDay () {
    const allday = create('div', 'allday')
    insert(allday, this.header)

    const dow = new Date(this.firstDay)
    const days = this.options.rangedays

    const label = create('label', 'label')
    label.innerHTML = 'all-day'
    insert(label, allday)

    for (let i = 0; i < days; i++) {
      const day = create('div', 'date')
      day.setAttribute('data-date', this.dateToString(dow))
      insert(day, allday)

      dow.setDate(dow.getDate() + 1)
    }
  }

  /**
   * [_initBody description]
   * @param  {?} content [description]
   * @return {?}         [description]
   */
  buildBody () {
    const cells = []

    const firstDay = this.firstDay

    const days = this.options.rangedays

    this.body = create('div')
    css.add(this.body, this.options.class + '-body')
    insert(this.body, this.element)

    const hours = create('div')
    css.add(hours, 'hours')
    insert(hours, this.body)

    this.initCanvas()

    for (let i = 0; i < 24; i++) {
      const hour = create('div')
      css.add(hour, 'hour')
      insert(hour, hours)

      hour.innerHTML = i + ':00'
    }

    const sday = new Date(firstDay)
    for (let k = 0; k < days; k++) {
      const day = create('div')
      css.add(day, 'week-day')
      day.setAttribute('data-date', this.dateToString(sday))
      insert(day, this.body)

      sday.setDate(sday.getDate() + 1)
    }

    this.cells = cells

    // content.scrollTop = 460;
  }

  /**
   * _dateToString
   * @param  {Date} d
   * @return {Date}
   */
  dateToString (d) {
    let day = d.getDate()
    let month = d.getMonth() + 1
    const year = d.getFullYear()

    if (day < 10) {
      day = '0' + day
    }
    if (month < 10) {
      month = '0' + month
    }

    const date = year + '-' + month + '-' + day

    return date
  }

  /**
   * [_initCanvas description]
   * @param  {?} content [description]
   * @return {?}         [description]
   */
  initCanvas () {
    const canvas = create('canvas')
    css.add(canvas, 'canvas')
    canvas.width = '2000'
    canvas.height = '1440'
    insert(canvas, this.body)

    const ctx = canvas.getContext('2d')
    ctx.lineWidth = 0.5
    ctx.strokeStyle = '#dedbdb'

    const offset = 6

    for (let j = 0; j <= 24; j++) {
      ctx.beginPath()

      if (j < this.options.range[0] - 1 || j > this.options.range[1] - 1) {
        ctx.strokeStyle = '#F2F2F2'
      } else {
        ctx.strokeStyle = '#D9D9D9'
      }

      const y = j * 60 + 0.5

      ctx.moveTo(0, y + 60 + offset)
      ctx.lineTo(2000, y + 60 + offset)
      ctx.stroke()
    }
  }

  /**
   * [onSelect description]
   * @param  {?} e [description]
   * @return {?}   [description]
   */
  add (e) {
    if (e.target && e.target.matches(this.options.target)) {
      const data = e.target.getAttribute('data-date')

      const d = data.split(/-/)

      const time = this.roundTime(e.offsetY / 60)

      const h = parseInt(time)
      const m = (time - h) * 60

      const date = new Date(d[0], d[1], d[2], h, m)

      this.emit('add', date)
    }
  }

  /**
   * [roundTime description]
   * @param  {?} value [description]
   * @return {?}       [description]
   */
  roundTime (value) {
    const step = 0.5
    const inv = 1.0 / step
    return Math.round(value * inv) / inv
  }

  /**
   * Setter
   * @param {string} prop
   * @param {string} value
   */
  set (prop, value, options) {
    console.log('set calendart', prop, value)
    switch (prop) {
      case 'week':
        this.setWeek(value, options)
        break
      default:
        this.setWeek(value, options)
    }

    return this
  }

  /**
   * Set list
   * @param {Array} list List of info object
   * @return {Object} The class instance
   */
  setWeek (data) {
    this.buildWeek(data)
    return this
  }

  /**
   * next
   * @return {void}
   */
  next () {
    this.firstDay.setDate(this.firstDay.getDate() + this.options.rangedays)

    this.element.innerHTML = ''

    this.buildWeek()
  }

  /**
   * back
   * @return {void}
   */
  back () {
    this.firstDay.setDate(this.firstDay.getDate() - this.options.rangedays)

    this.element.innerHTML = ''

    this.buildWeek()
  }

  /**
   * [goto description]
   * @param  {?} date [description]
   * @return {?}      [description]
   */
  goto (date) {
    date = date || new Date()

    this.firstDay = this.getFirstDayOfWeek(this.date)
    this.element.innerHTML = ''

    this.buildWeek()
  }

  newEvent (date) {
    // console.log('new Event', date);
  }

  empty () {
    console.log('empty')
    this.element.innerHTML = ''
  }
}

export default Calendar
