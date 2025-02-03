export default {
  image (info, layout) {
    if (info.image) {
      let format = 'thumb'
      if (this.options.image && this.options.image.format) {
        format = this.options.image.format || format + '/'
      } else {
        format = ''
      }

      const r = Math.floor(Math.random() * 100000) + 1

      if (info.image.filename) {
        const image = info.image.url + format + info.image.filename
        layout.get('image').style.backgroundImage = 'url("' + image + '?' + r + '")'
      }
    }
  }
}
