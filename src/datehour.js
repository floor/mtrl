import Component from './class/component'

class DateHour extends Component {
  static defaults = {
    class: 'date',
    tag: 'span',
    locale: navigator.language,
    format: { // Changed from 'options' to 'format'
      dateStyle: 'short',
      timeStyle: 'short',
      hour12: false
    }
  }

  constructor (options) {
    super(options)
    this.formatter = new Intl.DateTimeFormat(
      this.options.locale,
      this.options.format // Using format instead of options
    )
  }

  set (date) {
    const d = new Date(date)
    this.element.innerHTML = this.format(d)
  }

  format (date) {
    return this.formatter.format(date)
  }
}

export default DateHour
