// test/types/overlay-is-open.fixture.ts
//
// FLO-548: isOpen() is a method on the snackbar and on both pickers, and the
// snackbar's state has three values.
import type { TimePickerComponent } from "../../src/components/timepicker/types";
import type { DatePickerComponent } from "../../src/components/datepicker/types";
import type { SnackbarComponent, SnackbarState } from "../../src/components/snackbar/types";

declare const time: TimePickerComponent;
declare const date: DatePickerComponent;
declare const snackbar: SnackbarComponent;

const open: boolean[] = [time.isOpen(), date.isOpen(), snackbar.isOpen()];
void open;
const queued: SnackbarState = "queued";
void queued;

// @ts-expect-error the time picker's isOpen is a method, not a boolean
const leftover: boolean = time.isOpen;
void leftover;
