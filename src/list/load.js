
export default {
  load () {
    this.page = this.page || 2
    this.page++
    this.request(this.page)
  }
}
