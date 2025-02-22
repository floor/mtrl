// src/components/snackbar/constants.js

export const SNACKBAR_VARIANTS = {
  BASIC: 'basic',
  ACTION: 'action' // With action button
}

export const SNACKBAR_POSITIONS = {
  CENTER: 'center',
  START: 'start',
  END: 'end'
}

export const SNACKBAR_SCHEMA = {
  variant: {
    type: 'string',
    enum: Object.values(SNACKBAR_VARIANTS),
    required: false
  },
  position: {
    type: 'string',
    enum: Object.values(SNACKBAR_POSITIONS),
    required: false
  },
  message: {
    type: 'string',
    required: true
  },
  action: {
    type: 'string',
    required: false
  },
  duration: {
    type: 'number',
    required: false
  },
  class: {
    type: 'string',
    required: false
  }
}
