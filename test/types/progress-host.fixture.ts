// FLO-114: the internal progress host must accept the canvas thickness setter.
// Its old number|string parameter promised more than the canvas can handle.
import type { ComponentWithLifecycle } from "../../src/components/progress/features/state";
import type { ProgressComponent } from "../../src/components/progress";
import type { ProgressThickness } from "../../src/components/progress/types";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type HostSetter = NonNullable<ComponentWithLifecycle["setThickness"]>;
export const hostUsesPublicThickness: Equals<Parameters<HostSetter>[0], ProgressThickness> = true;
export const hostMatchesPublicSetter: Equals<
  Parameters<HostSetter>[0], Parameters<ProgressComponent["setThickness"]>[0]
> = true;
export const supportedThicknesses: Equals<ProgressThickness, "thin" | "thick" | number> = true;

// A genuine canvas-shaped setter is assignable to the host under strictFunctionTypes.
const setThickness = (_thickness: ProgressThickness): void => {};
export const host: ComponentWithLifecycle = {
  element: document.createElement("div"),
  setThickness,
};
host.setThickness?.("thin");
host.setThickness?.("thick");
host.setThickness?.(6);
// @ts-expect-error the canvas does not accept arbitrary preset strings
host.setThickness?.("wide");
// @ts-expect-error 'default' is not a ProgressThickness preset
host.setThickness?.("default");
// @ts-expect-error only preset strings and numeric pixel values are supported
host.setThickness?.(true);
