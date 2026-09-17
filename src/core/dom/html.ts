// src/core/dom/html.ts
//
// The one place markup is written into the DOM. Every component's icon and
// content string goes through setHTML, so a consumer can decide once how
// markup is treated: pass it to a sanitizer, or hand it to a Trusted Types
// policy so the library works under `require-trusted-types-for 'script'`,
// where a plain string assignment to innerHTML throws. With no policy set,
// markup is written as it always was.

/** A value the browser's Trusted Types API accepts for innerHTML. */
export interface TrustedHTMLLike {
  toString(): string;
}

/** Markup a component accepts: a string, or a TrustedHTML from a policy. */
export type HTMLInput = string | TrustedHTMLLike;

export interface HTMLPolicy {
  /**
   * Called with every markup string before it is written. Return the markup
   * to write: a sanitized string, or a TrustedHTML from a Trusted Types
   * policy. Values that are already TrustedHTML are not passed through it.
   */
  sanitize: (html: string) => HTMLInput;
}

let policy: HTMLPolicy | null = null;

/**
 * Sets the policy every component's markup goes through, or clears it with
 * null.
 *
 * @example
 * // DOMPurify
 * configureHTML({ sanitize: (html) => DOMPurify.sanitize(html) });
 *
 * // Trusted Types: a policy the page's CSP allows
 * const trusted = window.trustedTypes.createPolicy('mtrl', { createHTML: (html) => DOMPurify.sanitize(html) });
 * configureHTML({ sanitize: (html) => trusted.createHTML(html) });
 */
export const configureHTML = (next: HTMLPolicy | null): void => {
  policy = next;
};

/** The policy in force, if any. */
export const getHTMLPolicy = (): HTMLPolicy | null => policy;

/**
 * Writes markup into an element, through the policy when one is set.
 * An empty string empties the element without touching innerHTML.
 */
export const setHTML = (element: Element, html: HTMLInput | null | undefined): void => {
  if (html === null || html === undefined || html === "") {
    element.replaceChildren();
    return;
  }
  const markup = typeof html === "string" && policy ? policy.sanitize(html) : html;
  // A TrustedHTML is an object the browser accepts here; the DOM typings
  // only know strings
  element.innerHTML = markup as string;
};
