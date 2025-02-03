import insert from '../element/insert'
import offset from '../element/offset'

const defaults = {
  // transition: '.375s cubic-bezier(0.4, 0.0, 0.2, 1)',
  transition: '.375s linear',
  opacity: ['1', '.3']
}

const init = (container) => {
  container.addEventListener('mousedown', (e) => {
    show(e)
  })
}

const show = (e) => {
  const container = e.target
  const offs = offset(container)

  const ripple = document.createElement('div')
  ripple.classList.add('ripple')

  const end = coordinate(offs)
  const initial = {
    left: `${e.offsetX || offs.width / 2}px`,
    top: `${e.offsetY || offs.height / 2}px`
  }

  ripple.style.left = initial.left
  ripple.style.top = initial.top
  ripple.style.transition = defaults.transition

  insert(ripple, container, 'top')

  setTimeout(() => {
    ripple.style.left = end.left
    ripple.style.top = end.top
    ripple.style.width = end.size
    ripple.style.height = end.size
  }, 1)

  document.body.onmouseup = () => {
    destroy(ripple)
  }
}

const coordinate = (o) => {
  let size = o.height
  let top = -o.height / 2

  if (o.width > o.height) {
    top = -(o.width - o.height / 2)
    size = o.width
  }

  return {
    size: `${size * 2}px`,
    top: `${top}px`,
    left: `${size / -2}px`
  }
}

const destroy = (ripple) => {
  if (ripple.parentNode) ripple.style.opacity = '0'

  document.body.onmouseup = null

  setTimeout(() => {
    if (ripple.parentNode) ripple.parentNode.removeChild(ripple)
  }, 1000)
}

export default init
