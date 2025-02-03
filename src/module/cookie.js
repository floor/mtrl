const cookie = {
  set: (name, value, expire = 365) => {
    const d = new Date()
    d.setTime(d.getTime() + (expire * 24 * 60 * 60 * 1000))
    const expires = `expires=${d.toUTCString()}`
    document.cookie = `${name}=${value};${expires};path=/`
  },
  get: name => {
    const nameEQ = `${name}=`
    const ca = decodeURIComponent(document.cookie).split(';')

    for (let c of ca) {
      while (c.charAt(0) === ' ') c = c.substring(1)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length)
    }

    return ''
  },
  del: name => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  }
}

export default cookie
