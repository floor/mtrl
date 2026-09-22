// FLO-114: dialog's internal event hosts must accept the callback type supplied
// by withEvents. These assertions are compiled, not executed. The private
// DialogFeatureHost is reached through getApiConfig's parameter rather than
// exported for a test. ts:check also checks the real composition pipeline.
import type { DialogComponent, DialogEvent, DialogFeatureComponent } from "../../src/components/dialog/types";
import type { ApiOptions } from "../../src/components/dialog/api";
import { getApiConfig } from "../../src/components/dialog/config";
import type { EventCallback } from "../../src/core/state/emitter";

type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type FeatureHost = Parameters<typeof getApiConfig>[0];

export const featureOnUsesCoreCallback: Equals<
  Parameters<DialogFeatureComponent["on"]>[1], EventCallback
> = true;

export const configOnUsesCoreCallback: Equals<
  Parameters<FeatureHost["on"]>[1], EventCallback
> = true;

export const configOffUsesCoreCallback: Equals<
  Parameters<FeatureHost["off"]>[1], EventCallback
> = true;

export const apiOnUsesCoreCallback: Equals<
  Parameters<ApiOptions["events"]["on"]>[1], EventCallback
> = true;

export const apiOffUsesCoreCallback: Equals<
  Parameters<ApiOptions["events"]["off"]>[1], EventCallback
> = true;

// Existing public behavior: handlers receive DialogEvent, arbitrary event names
// remain accepted, and both methods return the component for chaining.
type PublicSubscription = (event: string, handler: (event: DialogEvent) => void) => DialogComponent;

export const publicOnIsUnchanged: Equals<DialogComponent["on"], PublicSubscription> = true;
export const publicOffIsUnchanged: Equals<DialogComponent["off"], PublicSubscription> = true;
