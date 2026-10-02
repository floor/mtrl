// test/components/checkbox/document-cache.test.ts
import { expect, test } from "bun:test";
import createCheckbox from "../../../src/components/checkbox";
import { withServerScope } from "../../../src/ssr/server-dom";
import { callbacksFixture } from "../callbacks.fixture";

const mount = callbacksFixture();

test("checkbox builds its check icon in each document", () => {
  const firstSvg = withServerScope(scope => {
    const first = createCheckbox();
    const svg = first.element.querySelector(".mtrl-checkbox__icon svg");
    expect(svg?.ownerDocument).toBe(scope.document);
    first.destroy();
    return svg;
  });

  const second = mount(createCheckbox());
  const secondSvg = second.element.querySelector(".mtrl-checkbox__icon svg");
  expect(secondSvg?.ownerDocument).toBe(document);
  expect(secondSvg).not.toBe(firstSvg);
  expect(secondSvg?.querySelector("path")?.getAttribute("d")).toBe(firstSvg?.querySelector("path")?.getAttribute("d"));
});
