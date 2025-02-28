// src/components/card/config.js

import { PREFIX } from '../../core/config'
import { CARD_VARIANTS } from './constants'

const defaultConfig = {
  componentName: 'card',
  prefix: PREFIX,
  variant: CARD_VARIANTS.ELEVATED,
  interactive: false,
  fullWidth: false,
  clickable: false,
  draggable: false
}

export default defaultConfig
