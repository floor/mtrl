export default function jsonToHTML (obj) {
  // Start an HTML string
  let html = '<div>'

  // Loop through each property of the object
  for (const [key, value] of Object.entries(obj)) {
    // If the value is an object, call the function recursively
    if (typeof value === 'object' && value !== null) {
      html += `<div class="${key}">${key}${jsonToHTML(value)}</div>`
    } else if (Array.isArray(value)) {
      html += `<div class="${key}">${key}<ul>${value.map(item => `<li>${item}</li>`).join('')}</ul></div>`
    } else {
      html += `<p>${key}: ${value || 'N/A'}</p>`
    }
  }

  // Close the HTML string
  html += '</div>'
  return html
}
