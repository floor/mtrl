/** A CSS-animated state layer with no document listeners, timers, or animation frames. */
export function mountRailRipple(root: HTMLElement, className: (part: string) => string): () => void {
    const waveClass = className('__ripple');
    const press = (event: Event): void => {
        const target = (event.target as Element).closest<HTMLElement>(`.${className('__item')}, .${className('__toggle')}`);
        if (!target || !root.contains(target) || target.hasAttribute('aria-disabled'))
            return;
        if (event instanceof KeyboardEvent && (event.repeat || !['Enter', ' '].includes(event.key)))
            return;
        if (event.type === 'pointerdown' && (event as PointerEvent).button !== 0)
            return;
        if (root.ownerDocument.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
            return;
        const host = target.querySelector<HTMLElement>(`.${className('__indicator')}`) || target;
        const bounds = host.getBoundingClientRect();
        const wave = document.createElement('span');
        wave.className = waveClass;
        wave.setAttribute('aria-hidden', 'true');
        const size = Math.max(bounds.width, bounds.height) * 2;
        const pointer = event instanceof MouseEvent;
        wave.style.width = wave.style.height = `${size}px`;
        wave.style.left = `${(pointer ? event.clientX - bounds.left : bounds.width / 2) - size / 2}px`;
        wave.style.top = `${(pointer ? event.clientY - bounds.top : bounds.height / 2) - size / 2}px`;
        host.append(wave);
    };
    const finish = (event: AnimationEvent): void => {
        const target = event.target as HTMLElement;
        if (target.classList.contains(waveClass))
            target.remove();
    };
    root.addEventListener('pointerdown', press);
    root.addEventListener('keydown', press);
    root.addEventListener('animationend', finish);
    root.addEventListener('animationcancel', finish);
    return () => {
        root.removeEventListener('pointerdown', press);
        root.removeEventListener('keydown', press);
        root.removeEventListener('animationend', finish);
        root.removeEventListener('animationcancel', finish);
        root.querySelectorAll(`.${waveClass}`).forEach(wave => wave.remove());
    };
}
