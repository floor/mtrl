// src/index.ts
/**
 * Main mtrl library exports
 * 
 * @packageDocumentation
 */


export * from './components';
export * from './core';

// Direct component imports
// import { createElement, addClass, removeClass, hasClass, toggleClass } from './core/dom';
// import { throttle, debounce, once } from './core/utils';


// Export all "create*" functions
export {
  addClass, removeClass, hasClass, toggleClass,
  throttle, debounce, once,
  createLayout,
  createLayout
};

// import createLayout from './core/layout';
import { createJsxLayout, h, Fragment } from './core/layout/jsx';


export * from './constants';

export const jsx = h;
export const jsxs = h;
export const jsxDEV = h;


