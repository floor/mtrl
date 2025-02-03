import build from './mixin/build'

class Image {
  static defaults = {
    class: 'image',
    tag: 'div',
    format: 'thumb'
  }

  constructor (options) {
    this.init(options)
    this.build()
  }

  init (options) {
    this.options = { ...Image.defaults, ...options }
    Object.assign(this, build)
  }

  set (src) {
    // console.log('set', src)
    if (!src) {
      this.element.style.backgroundImage = ''
    } else {
      let url = null

      if (src.format) {
        let format = this.sanitize(src.format)

        if (format.length > 0) {
          const index = format.indexOf(this.options.format)
          if (index === -1) {
            format = src.format[0] + '/'
          } else {
            format = this.options.format + '/'
          }
        }

        url = src.url + format
      } else {
        url = src.url
      }

      this.element.style.backgroundImage = 'url(' + url + src.filename + ')'
    }
  }

  sanitize (formats) {
    const a = []
    for (let i = 0; i < formats.length; i++) {
      const format = formats[i].replace(/\/$/, '')
      a.push(format)
    }
    return a
  }
}

export default Image
