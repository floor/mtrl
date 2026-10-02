// A child that needs context from above the host: the page renders, the host has
// no declarative shadow root, and development warns once per host per response.
import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

const fixture = fileURLToPath(new URL("./react-host-warning.fixture.ts", import.meta.url));

const run = async (mode: "development" | "production"): Promise<string> => {
  const child = Bun.spawn([process.execPath, fixture, mode], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  expect(code, stdout + stderr).toBe(0);
  return stdout;
};

test("missing context: one development warning per host per response, none in production", async () => {
  const development = await run("development");
  const production = await run("production");
  expect(development).toContain("development: context=1 two=2 second=1 suspend=0 exploded=1 threw=1");
  expect(development).toContain('[mtrl] <m-button id="context-host"> child snapshot failed, often because it needs ancestor context; this response has no shadow root for it: Required provider is missing');
  expect(development).toContain('[mtrl] <m-button id="boom"> child snapshot failed, often because it needs ancestor context; this response has no shadow root for it: child exploded');
  expect(production).toContain("production: context=0 two=0 second=0 suspend=0 exploded=0 threw=1");
  expect(production).not.toContain("child snapshot failed");
}, 60000);
