
export default {

  initController () {
    // console.log('initController', this.field)

    this.disableControls()

    Object.keys(this.field).forEach(field => this.bindControl(this.field[field]))
    Object.keys(this.file).forEach(file => this.bindControl(this.file[file]))
  },

  setMode (mode) {
    // console.log('setMode', mode)
    this.mode = mode

    this.updateClassMode(mode)

    this.emit('mode', mode)
  },

  updateClassMode (mode) {
    const modes = ['read', 'create', 'update']

    for (let i = 0; i < modes.length; i++) {
      this.form.classList.remove(modes[i] + '-mode')
    }

    this.form.classList.add(mode + '-mode')
  },

  changeMode (mode) {
    // console.log('changeMode', mode, this.options.class)

    if (mode === 'update' && this.enableControls) {
      this.enableControls()
    } else if (mode === 'update' && this.disableControls) {
      this.disableControls()
    } else if (mode === 'read' && this.disableControls) {
      this.disableControls()
    }
  },

  bindControl (control) {
    // console.log('bindControl', control.class)
    if (control && control.on) {
      control.on('change', () => {
        if (this.isModified) this.isModified()
        this.setMode('update')
        this.emit('changed', this.options.class)
        // console.log('isModified', this.isModified)
      })
    }
  },

  enableControls () {
    const controls = this.options.controls || ['submit', 'cancel']

    if (controls === null) return

    for (let i = 0; i < controls.length; i++) {
      if (this.ui[controls[i]] && this.ui[controls[i]].enable) {
        this.ui[controls[i]].enable()
      }
    }

    this.emit('enableControls')
  },

  disableControls () {
    // console.log('disableControls')
    const controls = this.options.controls || ['submit', 'cancel']

    if (controls === null) return

    for (let i = 0; i < controls.length; i++) {
      if (this.ui[controls[i]] && this.ui[controls[i]].disable) {
        this.ui[controls[i]].disable()
      }
    }
  }
}
