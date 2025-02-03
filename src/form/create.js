
export default {

  create () {
    console.log('create', this.options.create.info)

    this.clean()

    const info = this.options.create.info || { name: 'New Item' }

    console.log('info', info)

    this.render(info, 'create')
    this.setMode('create')
    this.enableControls()

    this.emit('new')
  }
}
