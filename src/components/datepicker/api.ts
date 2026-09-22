import type { DatePickerComponent, DatePickerEvents } from "./types";
import type { EventCallback } from "../../core/state/emitter";

/** Keep the typed public event API and fluent return identity at the boundary. */
export function withAPI(
  component: Omit<DatePickerComponent, "on" | "off">,
  events: { on(event: string, handler: EventCallback): unknown; off(event: string, handler: EventCallback): unknown },
): DatePickerComponent {
  const api: DatePickerComponent = {
    ...component,
    on<K extends keyof DatePickerEvents>(event: K, handler: DatePickerEvents[K]) { events.on(event, handler); return api; },
    off<K extends keyof DatePickerEvents>(event: K, handler: DatePickerEvents[K]) { events.off(event, handler); return api; },
  };
  return api;
}
