const last = (str, that) => {
  if (!str) return that
  if (!str.includes('.')) return that[str]

  return str.split('.').reduce((acc, key) => acc[key], that)
}

export default last
