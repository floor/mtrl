import dot from '../module/dot'

export default {
  render (object, option) {
    // console.log('render', object)

    const info = dot(object)

    for (const file in this.file) {
      if (this.file.hasOwnProperty(file)) {
        this.file[file].reset()
      }
    }

    if (!info) return

    // console.log('dotified', this.field, info)

    for (const field in this.field) {
      if (this.field.hasOwnProperty(field)) {
        // console.log('field type', field, this.field[field])
        if (this.field[field] &&
            this.field[field].set) {
          const value = this.objectValueByDotKey(object, field)
          // console.log('value', value)
          this.field[field].set(value, true)
        }
      }
    }

    this.emit('rendered')

    // won't stay here
    if (option === 'create' && this.field.name) {
      this.focusNameOnRender(this.field.name)
    }
  },

  objectValueByDotKey (object, dotkey) {
    // console.log('objectValueByDotKey', object, dotkey)
    const keys = dotkey.split(/\./)

    let value = Object.assign({}, object)

    for (let i = 0; i < keys.length; i++) {
      if (value !== undefined) {
        value = value[keys[i]]
      }
    }

    return value
  },

  focusNameOnRender (field) {
    // console.log('focusNameOnRender', field)
    field.input.focus()
    field.input.select()
  }
}
