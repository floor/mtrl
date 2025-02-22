// src/core/compose/features/track.js
/**
 * @module core/compose/features
 */

/**
 * Default checkmark icon SVG
 * @memberof module:core/compose/features
 * @private
 */
const DEFAULT_ICON = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="20 6 9 17 4 12"></polyline>
</svg>`

/**
 * Adds track and thumb elements to a component
 * @memberof module:core/compose/features
 * @function withTrack
 * @param {Object} config - Track configuration
 * @param {string} config.prefix - Class prefix
 * @param {string} config.componentName - Component name
 * @param {string} [config.icon] - Custom icon HTML or 'none'
 * @returns {Function} Component transformer
 */
export const withTrack = (config) => (component) => {
  const track = document.createElement('span')
  track.className = `${config.prefix}-${config.componentName}-track`

  const thumb = document.createElement('span')
  thumb.className = `${config.prefix}-${config.componentName}-thumb`
  track.appendChild(thumb)

  // Add icon inside thumb if provided or use default
  if (config.icon !== 'none') {
    const icon = document.createElement('span')
    icon.className = `${config.prefix}-${config.componentName}-thumb-icon`
    icon.innerHTML = config.icon || DEFAULT_ICON
    thumb.appendChild(icon)
  }

  component.element.appendChild(track)

  return {
    ...component,
    track,
    thumb
  }
}
