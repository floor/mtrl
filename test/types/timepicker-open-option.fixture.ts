// test/types/timepicker-open-option.fixture.ts
//
// FLO-548: the time picker's option is `open`; `isOpen` is the method only.
import createTimePicker from "../../src/components/timepicker";

const picker = createTimePicker({ open: true });
const state: boolean = picker.isOpen();
void state;

// @ts-expect-error the option is `open`; `isOpen` is not a config key
createTimePicker({ isOpen: true });

// The option's default is named after the option
import { TIMEPICKER_DEFAULTS } from "../../src/components/timepicker/constants";
const closed: false = TIMEPICKER_DEFAULTS.OPEN;
void closed;
// @ts-expect-error IS_OPEN was the default of the option `isOpen`, renamed `open`
void TIMEPICKER_DEFAULTS.IS_OPEN;
