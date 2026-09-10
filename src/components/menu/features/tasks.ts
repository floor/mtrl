/** Pending work belongs to the menu feature that scheduled it. */
export const createMenuTasks = () => {
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const frames = new Set<number>();
  let destroyed = false;
  const clear = (timer: ReturnType<typeof setTimeout> | null) => {
    if (timer === null) return;
    clearTimeout(timer);
    timers.delete(timer);
  };
  const cancelAll = () => {
    timers.forEach(clearTimeout);
    timers.clear();
    frames.forEach((frame) => window.cancelAnimationFrame(frame));
    frames.clear();
  };
  return {
    get destroyed() { return destroyed; },
    setTimeout(callback: () => void, delay: number) {
      if (destroyed) return null;
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (!destroyed) callback();
      }, delay);
      timers.add(timer);
      return timer;
    },
    clearTimeout: clear,
    requestAnimationFrame(callback: FrameRequestCallback) {
      if (destroyed) return;
      const frame = window.requestAnimationFrame((time) => {
        frames.delete(frame);
        if (!destroyed) callback(time);
      });
      frames.add(frame);
    },
    cancelAll,
    destroy() {
      destroyed = true;
      cancelAll();
    },
  };
};
