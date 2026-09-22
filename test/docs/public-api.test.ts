import { expect, test } from "bun:test";
import { Application, LogLevel } from "typedoc";
import { fileURLToPath } from "node:url";

test("Tabs documentation exposes supported APIs and omits internal hooks (FLO-239)", async () => {
  // Use the real documentation configuration and converter, so an annotation
  // alone cannot pass while the documentation still advertises the member.
  const app = await Application.bootstrapWithPlugins({
    options: fileURLToPath(new URL("../../typedoc.json", import.meta.url)),
    logLevel: LogLevel.Error,
  });
  const converted = await app.convert();
  if (!converted) throw new Error("TypeDoc did not produce a project");
  const tabs = converted.getChildByName("TabsComponent");
  if (!tabs?.isDeclaration()) throw new Error("TabsComponent is missing from the documentation");
  const members = tabs.children?.map(member => member.name) ?? [];
  for (const name of ["element", "getClass", "addTab", "add", "getTabs", "getActiveTab", "getIndicator", "setActiveTab", "removeTab", "on", "off", "emit", "destroy"]) {
    expect(members).toContain(name);
  }
  expect(members).not.toContain("handleTabClick");
  expect(members).not.toContain("scrollContainer");
}, 30_000);
