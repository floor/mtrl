// src/core/dom/form-value.ts


/**
 * Sets the value a hidden field submits, and does nothing when there is no
 * field — the common case, since one exists only for a named component.
 *
 * Only the attribute is written. `type="hidden"` has the "default" value mode,
 * so the `value` property reflects the content attribute with no dirty flag:
 * the attribute is what the form submits, and `form.reset()` cannot leave the
 * field carrying something the component is no longer showing.
 */
export const setFormValue = (
  input: HTMLInputElement | null,
  value: string,
): void => {
  input?.setAttribute("value", value);
};

/**
 * Creates a hidden input that carries a component's value into a surrounding
 * form.
 *
 * Components that render no form control of their own — a slider, a time
 * picker — submit nothing however they are named, because a `name` on their
 * root element is not a form field. This puts a real one inside them, and
 * creates nothing at all without a name, so a component used outside a form
 * is exactly as it was.
 *
 * Callers set `disabled` on the returned input directly: a disabled field
 * submits nothing, which is what a disabled component means.
 */
export const createFormValue = (
  container: HTMLElement,
  name: string | undefined,
  value: string,
  disabled = false,
): HTMLInputElement | null => {
  if (!name) return null;

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.disabled = disabled;
  setFormValue(input, value);
  container.appendChild(input);
  return input;
};
