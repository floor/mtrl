const observer = {
  insert: (element, cb) => {
    var observer = new MutationObserver((mutations) => {
      if (document.contains(element)) {
        if (typeof cb === 'function' && !element.classList.contains('inserted')) {
          cb()
        }

        observer.disconnect()
      }
    })

    observer.observe(document, {
      attributes: false,
      childList: true,
      characterData: false,
      subtree: true
    })
  }
}

export default observer
