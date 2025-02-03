export default {
  init () {
    this.build()
    events.attach(this.options.events, this)
  }
}
