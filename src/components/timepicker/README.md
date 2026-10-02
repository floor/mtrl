# TimePicker Component

The `TimePicker` component provides a user-friendly interface for selecting a time. It supports both dial-based
and keyboard input selection methods, 12-hour and 24-hour formats, and customizable settings.

## Features

- **Two Selection Methods**: Choose between a dial interface or keyboard input
- **Time Format Support**: 12-hour (AM/PM) or 24-hour format
- **Flexible Configuration**: Customize title, action buttons, and constraints
- **Responsive Layout**: Adapts between vertical and horizontal layouts based on device orientation
- **Accessibility**: Keyboard navigation and screen reader support
- **Full TypeScript Support**: Comprehensive type definitions for better development experience

## Basic Usage

```javascript
import { createTimePicker } from 'mtrl';

// Create a basic time picker
const timePicker = createTimePicker({
  title: 'Select time',
  value: '14:30', // Initial time (2:30 PM)
  onConfirm: ({ value }) => {
    console.log('Selected time:', value);
    // Update UI with selected time
    document.getElementById('time-input').value = value;
  }
});

// Create an input to trigger the time picker
const timeInput = document.createElement('input');
timeInput.id = 'time-input';
timeInput.type = 'text';
timeInput.readOnly = true;
timeInput.value = '14:30';
timeInput.addEventListener('click', () => {
  timePicker.open();
});

// Add input to the DOM
document.body.appendChild(timeInput);
```

## Configuration Options

The `createTimePicker` function accepts a configuration object with the following properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `value` | `string` | Current time | Initial time value in 24-hour format (HH:MM or HH:MM:SS) |
| `type` | `TIME_PICKER_TYPE` | `DIAL` | Type of time picker to display (DIAL or INPUT) |
| `format` | `TIME_FORMAT` | `AMPM` | Time format to use (AMPM for 12-hour or MILITARY for 24-hour) |
| `orientation` | `TIME_PICKER_ORIENTATION` | `VERTICAL` | Layout orientation (VERTICAL or HORIZONTAL) |
| `title` | `string` | `undefined` | Title text for the time picker |
| `showSeconds` | `boolean` | `false` | Whether to show seconds selector |
| `class` | `string` | `undefined` | Additional CSS classes to add to the time picker |
| `minTime` | `string` | `undefined` | Earliest selectable time, 24-hour (HH:MM or HH:MM:SS). Dial numbers and AM/PM that cannot reach it are disabled; a picked or typed time before it moves up to it |
| `maxTime` | `string` | `undefined` | Latest selectable time, as `minTime` at the other end |
| `minuteStep` | `number` | `1` | Minutes off the step are disabled on the dial; a pointer picks the nearest step, and a typed minute rounds to it when committed |
| `secondStep` | `number` | `1` | As `minuteStep`, for seconds |
| `cancelText` | `string` | `'Cancel'` | Custom text for cancel button |
| `confirmText` | `string` | `'OK'` | Custom text for confirm button |
| `open` | `boolean` | `false` | Whether the time picker opens once it is created |
| `container` | `string \| HTMLElement` | `document.body` | CSS selector or element to append the time picker to |
| `clockIcon` | `string` | Default SVG | Custom icon for the clock button |
| `keyboardIcon` | `string` | Default SVG | Custom icon for the keyboard button |
| `onChange` | `({ value }) => void` | `undefined` | Callback when the committed time changes |
| `onOpen` | `function` | `undefined` | Callback when time picker is opened |
| `onClose` | `function` | `undefined` | Callback when time picker is closed |
| `onConfirm` | `({ value }) => void` | `undefined` | `confirm` listener; `value` is the 24-hour string |
| `onCancel` | `function` | `undefined` | Callback when time picker is canceled |

## API Methods

Once created, the TimePicker instance provides the following methods:

### Open, Close, and Toggle

```javascript
// Open the time picker
timePicker.open();

// Close the time picker
timePicker.close();

// Toggle the time picker open/closed state
timePicker.toggle();
```

When `open()` returns, `isOpen()` is true and `open` has been emitted; the surface may be painted
after `open()` returns.

### Get and Set Value

```javascript
// Get the current time value as a string (HH:MM or HH:MM:SS)
const timeString = timePicker.getValue();

// Get the current time as an object with hours, minutes, seconds, and period
const timeObject = timePicker.getTimeObject();

// Set the time value
timePicker.setValue('15:45');
```

### Change Configuration

```javascript
// Switch between dial and input types
timePicker.setType(TIME_PICKER_TYPE.INPUT);

// Switch between 12-hour and 24-hour formats
timePicker.setFormat(TIME_FORMAT.MILITARY);

// Change the orientation
timePicker.setOrientation(TIME_PICKER_ORIENTATION.HORIZONTAL);

// Update the title
timePicker.setTitle('Choose departure time');
```

### Event Handling

```javascript
// Listen for time changes
// `change` and `input` pass { value }, as the <m-timepicker> element's do
timePicker.on('change', ({ value }) => {
  console.log('Time changed:', value);
});

// Listen for time picker opening
timePicker.on('open', () => {
  console.log('Time picker opened');
});

// Remove an event listener
timePicker.off('change', myHandler);
```

### Cleanup

```javascript
// Destroy the time picker and clean up resources
timePicker.destroy();
```

## Advanced Examples

### 24-Hour Time Picker with Seconds

```javascript
import { createTimePicker, TIME_FORMAT } from 'mtrl';

const timePicker = createTimePicker({
  title: 'Select time',
  value: '18:30:45',
  format: TIME_FORMAT.MILITARY,
  showSeconds: true,
  onConfirm: ({ value }) => {
    console.log('Selected time with seconds:', value);
  }
});
```

### Office Hours, in Quarter Hours

```javascript
import { createTimePicker } from 'mtrl';

// Only 09:00 to 17:30 can be picked, on the quarter hour: earlier and later
// hours, and minutes off the quarter, are disabled on the dial.
const meetingPicker = createTimePicker({
  title: 'Meeting time',
  value: '10:00',
  minTime: '09:00',
  maxTime: '17:30',
  minuteStep: 15,
  onConfirm: ({ value }) => {
    meetingInput.value = value;
  }
});
```

The limits are set when the picker is created; `setValue` is not held to them.

## Accessibility

The TimePicker component is designed with accessibility in mind:

- Keyboard navigation for all controls
- ARIA attributes for screen reader support
- Large touch targets for better mobile accessibility
- High contrast colors and clear visual indicators
- Support for reducing motion based on user preferences

## Customization

### Custom Styling

You can customize the appearance of the TimePicker by overriding the CSS variables and classes:

```css
/* Custom time picker styling */
.mtrl-time-picker__dialog {
  --mtrl-primary: #6200ee;
  --mtrl-on-primary: #ffffff;
  --mtrl-surface-container-high: #f5f5f5;
  --mtrl-on-surface: #1d1d1d;
  
  /* Add custom shadows */
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* Custom dial styling */
.mtrl-time-picker__dial-face {
  background-color: rgba(98, 0, 238, 0.05);
}

/* Custom buttons */
.mtrl-time-picker__confirm {
  font-weight: bold;
}
```

### Custom Icons

You can also provide custom icons for the clock and keyboard buttons:

```javascript
const timePicker = createTimePicker({
  // Other configuration...
  clockIcon: '<svg>...</svg>', // Custom clock icon
  keyboardIcon: '<svg>...</svg>' // Custom keyboard icon
});
```

## Browser Support

The TimePicker component supports all modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## TypeScript Support

The `TimePicker` component includes comprehensive TypeScript definitions:

```typescript
import { createTimePicker, TIME_PICKER_TYPE, TIME_FORMAT, TimePickerConfig } from 'mtrl';

// Configuration with TypeScript
const config: TimePickerConfig = {
  title: 'Select time',
  value: '14:30',
  type: TIME_PICKER_TYPE.DIAL,
  format: TIME_FORMAT.AMPM
};

const timePicker = createTimePicker(config);
```