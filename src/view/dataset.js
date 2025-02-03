
function dataset (element, data) {
  if (data) {
    for (const property in data) {
      if (data.hasOwnProperty(property)) {
        element.dataset[property] = data[property]
      }
    }
  }
}

export default dataset
