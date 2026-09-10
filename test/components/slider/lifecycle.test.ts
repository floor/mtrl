import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

// Theme subscriptions are process-wide. Run real-DOM lifecycle checks in a
// fresh process so unrelated tests' globals and live subscriptions cannot leak in.
test("canvas and slider lifecycle regressions", async () => {
  const child = Bun.spawn([process.execPath, "test", fileURLToPath(new URL("./lifecycle.fixture.ts", import.meta.url))], {
    stdout: "pipe", stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  expect(code, stdout + stderr).toBe(0);
});
