// src/components/divider/features.ts
import { BaseComponent, ElementComponent } from '../../core/compose';
import { DividerConfig } from './config';
import { DividerComponent } from './types';

type Orientation = 'horizontal' | 'vertical';
type Variant = 'full-width' | 'inset' | 'middle-inset';

const ORIENTATIONS: Orientation[] = ['horizontal', 'vertical'];
const VARIANTS: Variant[] = ['full-width', 'inset', 'middle-inset'];
const DEFAULT_INSET = 16;

/**
 * Renders the divider from its config, which holds the current orientation,
 * variant, thickness and insets. Every setter updates the config and calls this,
 * so no setter can leave the classes, sizes or margins of an earlier state.
 */
const applyLayout = (component: ElementComponent & BaseComponent, config: DividerConfig) => {
  const { element } = component;
  const base = component.getClass('divider');
  const orientation = config.orientation || 'horizontal';
  const variant = config.variant || 'full-width';
  const thickness = config.thickness || 1;
  const horizontal = orientation === 'horizontal';

  ORIENTATIONS.forEach(name => element.classList.toggle(`${base}--${name}`, name === orientation));
  VARIANTS.forEach(name => element.classList.toggle(`${base}--${name}`, name === variant));

  // An <hr> is a horizontal separator unless told otherwise.
  if (horizontal) element.removeAttribute('aria-orientation');
  else element.setAttribute('aria-orientation', 'vertical');

  const style = element.style;
  style.marginLeft = style.marginRight = style.marginTop = style.marginBottom = '';

  const cross = horizontal ? 'height' : 'width';
  const main = horizontal ? 'width' : 'height';
  style[cross] = `${thickness}px`;
  style[main] = '100%';

  if (variant !== 'full-width') {
    const insetStart = config.insetStart !== undefined ? config.insetStart : DEFAULT_INSET;
    const insetEnd = config.insetEnd !== undefined
      ? config.insetEnd
      : (variant === 'middle-inset' ? DEFAULT_INSET : 0);
    style[horizontal ? 'marginLeft' : 'marginTop'] = `${insetStart}px`;
    style[horizontal ? 'marginRight' : 'marginBottom'] = `${insetEnd}px`;
    // 100% plus margins overflows the parent, so let the box shrink to what
    // the insets leave.
    style[main] = 'auto';
  }
};

export const withOrientation = (config: DividerConfig) =>
  <C extends ElementComponent & BaseComponent>(component: C): C & Partial<DividerComponent> => {
    applyLayout(component, config);

    return {
      ...component,

      getOrientation() {
        return config.orientation || 'horizontal';
      },

      setOrientation(newOrientation: Orientation) {
        config.orientation = newOrientation;
        applyLayout(component, config);
        return this as unknown as DividerComponent;
      }
    };
  };

export const withInset = (config: DividerConfig) =>
  <C extends ElementComponent & BaseComponent & Partial<DividerComponent>>(component: C): C & Partial<DividerComponent> => ({
    ...component,

    getVariant() {
      return config.variant || 'full-width';
    },

    setVariant(newVariant: Variant) {
      config.variant = newVariant;
      applyLayout(component, config);
      return this as unknown as DividerComponent;
    },

    setInset(insetStart?: number, insetEnd?: number) {
      if (insetStart !== undefined) config.insetStart = insetStart;
      if (insetEnd !== undefined) config.insetEnd = insetEnd;
      applyLayout(component, config);
      return this as unknown as DividerComponent;
    }
  });

export const withStyle = (config: DividerConfig) =>
  <C extends ElementComponent & BaseComponent & Partial<DividerComponent>>(component: C): C & Partial<DividerComponent> => {
    // Apply custom color if provided
    if (config.color) {
      component.element.style.backgroundColor = config.color;
    }

    return {
      ...component,

      setThickness(newThickness: number) {
        config.thickness = newThickness;
        applyLayout(component, config);
        return this as unknown as DividerComponent;
      },

      setColor(color: string) {
        component.element.style.backgroundColor = color;
        return this as unknown as DividerComponent;
      }
    };
  };
