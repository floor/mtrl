const insertion = (element, callback) => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node === element || node.contains(element)) {
          callback()
          observer.disconnect()
        }
      })
    })
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

export { insertion }
