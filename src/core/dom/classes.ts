// src/core/dom/classes.ts
/**
 * @module core/dom
 * @description DOM manipulation utilities
 */

import { normalizeClasses } from '../utils';

/**
 * Adds multiple classes to an element
 * @param {HTMLElement} element - Target element
 * @param {...(string | string[])} classes - Classes to add
 * @returns {HTMLElement} Modified element
 */
export const addClass = (element: HTMLElement, ...classes: (string | string[])[]): HTMLElement => {
  const normalizedClasses = normalizeClasses(...classes);
  if (normalizedClasses.length) {
    element.classList.add(...normalizedClasses);
  }
  return element;
};

/**
 * Removes multiple classes from an element
 * @param {HTMLElement} element - Target element
 * @param {...(string | string[])} classes - Classes to remove
 * @returns {HTMLElement} Modified element
 */
export const removeClass = (element: HTMLElement, ...classes: (string | string[])[]): HTMLElement => {
  const normalizedClasses = normalizeClasses(...classes);
  if (normalizedClasses.length) {
    element.classList.remove(...normalizedClasses);
  }
  return element;
};

/**
 * Toggles multiple classes on an element
 * @param {HTMLElement} element - Target element
 * @param {...(string | string[])} classes - Classes to toggle
 * @returns {HTMLElement} Modified element
 */
export const toggleClass = (element: HTMLElement, ...classes: (string | string[])[]): HTMLElement => {
  const normalizedClasses = normalizeClasses(...classes);
  normalizedClasses.forEach(cls => {
    element.classList.toggle(cls);
  });
  return element;
};

/**
 * Checks if an element has all specified classes
 * @param {HTMLElement} element - Target element
 * @param {...(string | string[])} classes - Classes to check
 * @returns {boolean} True if element has all specified classes
 */
export const hasClass = (element: HTMLElement, ...classes: (string | string[])[]): boolean => {
  const normalizedClasses = normalizeClasses(...classes);
  return normalizedClasses.every(cls => element.classList.contains(cls));
};