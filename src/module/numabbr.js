const numabbr = (number, decimals = 2) => {
  if (typeof number !== 'number' || isNaN(number)) {
    return null
  }

  const factor = Math.pow(10, decimals)
  const abbrev = ['k', 'm', 'b', 't']

  for (let i = abbrev.length - 1; i >= 0; i--) {
    const size = Math.pow(10, (i + 1) * 3)

    if (size <= number) {
      let num = Math.round(number * factor / size) / factor

      // Handle special case where we round up to the next abbreviation
      if (num === 1000 && i < abbrev.length - 1) {
        num = 1
        return `${num}${abbrev[i + 1]}`
      }

      return `${num}${abbrev[i]}`
    }
  }

  return number.toString()
}

export default numabbr
