import { byString } from '../module/object'

export default {
  /**
   * Initializes form data with fields and files
   * @returns {FormData} Initialized form data
   */
  initData () {
    try {
      const data = new FormData()

      if (this.mode !== 'create') {
        this.appendSysinfo(data)
      }

      return this.appendFiles(this.appendFields(data))
    } catch (error) {
      console.error('Error initializing form data:', error)
      throw new Error('Failed to initialize form data')
    }
  },

  /**
   * Fetches and sets data for the form
   * @param {Object} user - User data object
   * @returns {Promise<void>}
   */
  async getData () {
    // console.log('getData')
    Object.entries(this.field).forEach(([fieldName, field]) => {
      console.log('fieldName', fieldName)
    })
  },

  /**
   * Appends system information to form data
   * @param {FormData} data - FormData instance
   * @returns {FormData} Updated FormData
   */
  appendSysinfo (data) {
    // console.log('appendSysinfo')
    if (!Array.isArray(this.options?.sysinfo)) {
      return data
    }

    this.options.sysinfo.forEach(field => {
      const name = field === '_id' ? 'id' : field
      const value = this.info?.[field]

      if (value !== undefined) {
        data.append(name, value)
      }
    })

    return data
  },

  /**
   * Appends form fields to FormData
   * @param {FormData} data - FormData instance
   * @returns {FormData} Updated FormData
   */
  appendFields (data) {
    if (!this.field || !(data instanceof FormData)) {
      return data
    }

    Object.entries(this.field).forEach(([fieldName, field]) => {
      const value = field?.get?.()

      if (value === null || value === undefined) {
        return
      }

      const shouldAppend = this.mode === 'update' &&
        this.options?.update?.modifiedOnly
        ? this.isModified(fieldName, value)
        : true

      if (shouldAppend) {
        data.append(fieldName, value)
      }
    })

    return data
  },

  /**
   * Appends file inputs to FormData
   * @param {FormData} data - FormData instance
   * @returns {FormData} Updated FormData
   */
  appendFiles (data) {
    if (!this.file || !(data instanceof FormData)) {
      return data
    }

    Object.entries(this.file)
      .filter(([, fileField]) => {
        const input = fileField?.input
        return input?.value && input?.files?.length > 0
      })
      .forEach(([fileName, fileField]) => {
        data.append(fileName, fileField.input.files[0])
      })

    return data
  },

  /**
   * Gets structured field data
   * @returns {Object} Field data object
   */
  getFieldData () {
    if (!this.field) {
      return {}
    }

    return Object.entries(this.field).reduce((acc, [fieldName, field]) => {
      const value = field?.get?.()
      if (value !== null && value !== undefined) {
        acc[fieldName] = value
      }
      return acc
    }, {})
  },

  /**
   * Gets structured file data
   * @returns {Object} File data object
   */
  getFileData () {
    if (!this.file) {
      return {}
    }

    return Object.entries(this.file).reduce((acc, [fileName, fileField]) => {
      const input = fileField?.input
      if (input?.value && input?.files?.length > 0) {
        acc[fileName] = input.files[0]
      }
      return acc
    }, {})
  },

  /**
   * Checks if any fields have been modified from their initial values
   * @returns {boolean} True if any field is modified
   */
  isModified () {
    // console.log('checkModified', this.options.class)
    // console.log('field', this.field)
    // console.log('info', this.info)

    if (!this.field || !this.info) {
      return false
    }

    let modified = false
    Object.entries(this.field).forEach(([fieldName]) => {
      if (this.isFieldModified(fieldName)) {
        modified = true
      }
    })

    this.modified = modified

    // console.log('modified', modified)

    return modified
  },

  /**
   * Checks if a field value has been modified
   * @param {string} fieldName - Field name
   * @returns {boolean} True if modified
   */
  /**
 * Checks if a specific field value has been modified from its initial value
 * @param {string} fieldName - Field name to check
 * @returns {boolean} True if the field is modified
 */
  isFieldModified (fieldName) {
    // console.log('isFieldModified', fieldName)
    const currentValue = this.field[fieldName]?.get?.() ?? undefined
    const initialValue = this.info[fieldName] ?? undefined

    // Special case for text fields: treat undefined and empty string as equivalent
    if (typeof currentValue === 'string' || currentValue === undefined) {
      const normalizedCurrent = currentValue || ''
      const normalizedInitial = initialValue || ''
      return normalizedCurrent !== normalizedInitial
    }

    // Handle number comparisons
    if (typeof initialValue === 'number') {
      const parsedCurrent = Number(currentValue)
      return isNaN(parsedCurrent) ? true : parsedCurrent !== initialValue
    }

    // Standard null/undefined checks
    if (initialValue === undefined || initialValue === null) {
      return currentValue !== null && currentValue !== undefined
    }

    log.error('modified', initialValue !== currentValue)

    return initialValue !== currentValue
  }
}
