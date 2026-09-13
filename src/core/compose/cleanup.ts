/** A resource scope shared by every stage of a component's composition. */
export interface CleanupScope {
  readonly destroyed: boolean;
  add(cleanup: () => void): void;
  destroy(): void;
}

export const createCleanup = (): CleanupScope => {
  let callbacks: (() => void)[] | undefined;
  let destroyed = false;
  return {
    get destroyed() { return destroyed; },
    add(cleanup) {
      if (destroyed) cleanup();
      else (callbacks ??= []).push(cleanup);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      const pending = callbacks;
      callbacks = undefined;
      let failure: unknown;
      let failed = false;
      for (const cleanup of pending ?? []) {
        try { cleanup(); } catch (error) { if (!failed) failure = error; failed = true; }
      }
      if (failed) throw failure;
    },
  };
};

/** Also support custom component bases that already provide a lifecycle. */
export const getCleanup = (component: {
  resources?: CleanupScope;
  lifecycle?: { destroy(): void };
}): CleanupScope => {
  if (component.resources) return component.resources;
  const resources = component.resources = createCleanup();
  if (component.lifecycle) {
    const destroy = component.lifecycle.destroy.bind(component.lifecycle);
    component.lifecycle.destroy = () => {
      try { resources.destroy(); } finally { destroy(); }
    };
  }
  return resources;
};
