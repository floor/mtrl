export default {
  verify () {
    const list = this.options.require

    let ok = true

    for (let i = 0; i < list.length; i++) {
      const field = this.ui['info.' + list[i]]

      if (!this.layout.get(list[i]).get()) {
        field.element.classList.add('textfield-error')
        ok = false
      } else {
        field.element.classList.remove('textfield-error')
      }
    }

    return ok
  }
}
