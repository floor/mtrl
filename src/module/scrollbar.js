window._scrollbar = {}

const scrollbar = () => {
  // if (window._scrollbar.checked) return

  const list = document.createElement('div')
  list.classList.add('list')
  list.style.zIndex = '1000'
  list.style.display = 'block'
  list.style.width = '300px'
  list.style.minWidth = '300px'
  list.style.height = '20px'
  list.style.position = 'absolute'
  list.style.top = '-200px'
  list.style.right = 'initial'
  list.style.bottom = 'initial'
  list.style.left = '200px'
  list.style.overflowY = 'hidden'
  document.body.appendChild(list)

  const body = document.createElement('div')
  body.classList.add('body')
  body.style.overflowY = 'scroll'
  list.appendChild(body)

  const item = document.createElement('div')
  item.classList.add('item')
  item.style.height = '40px'
  item.style.margin = '0'
  item.style.padding = '0'
  item.style.border = '0'
  item.style.backgroundColor = 'green'
  body.appendChild(item)

  const info = item.getBoundingClientRect()

  document.body.removeChild(list)

  window._scrollbar.checked = true

  return 300 - info.width
}

export default scrollbar
