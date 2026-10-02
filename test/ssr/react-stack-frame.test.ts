// A suspending child with no readable stack frame: the page finishes, the host
// has no declarative shadow root, and development warns once per process.
import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

const fixture = fileURLToPath(new URL("./react-stack-frame.fixture.ts", import.meta.url));

const run = async (mode: "development" | "production"): Promise<string> => {
  const child = Bun.spawn([process.execPath, fixture, mode], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  expect(code, stdout + stderr).toBe(0);
  return stdout;
};

test("no stack frame: one development warning, none in production, and no shadow root", async () => {
  const development = await run("development");
  const production = await run("production");
  expect(development).toContain("development: warnings=1 shadowRoots=0 requests=2 hosts=2");
  expect(production).toContain("production: warnings=0 shadowRoots=0 requests=2 hosts=2");
});
