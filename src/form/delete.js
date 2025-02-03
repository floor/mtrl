import Dialog from '../dialog'

export default {
  del () {
    new Dialog({
      name: 'alert',
      content: 'Delete ' + this.info.name + '?',
      accept: { text: 'Delete', color: 'primary' },
      cancel: { text: 'Cancel', color: 'primary' }
    }).on('accepted', () => {
      this.confirmDelete()
    }).on('canceled', () => {
      // console.log('alert dialog canceled')
    }).insert(document.body).show()
  },

  confirmDelete () {
    // console.log('delete', this.info._id)
    if (!this.info._id) return
    this.setMode('delete')
    fetch(this.options.action, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: this.info._id
      }),
      method: 'DELETE'
    }).then((resp) => {
      // console.log('resp', resp)
      return resp.json()
    }).then((data) => {
      // console.log('data', data)
      this.form.reset()
      this.emit('deleted', this.info._id)
    })
  }
}
