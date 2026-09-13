import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

// Isolate DOM globals from unrelated component test fixtures.
test("real drawer expressive selection", async () => {
  const child = Bun.spawn([process.execPath, "test", fileURLToPath(new URL("./expressive.fixture.ts", import.meta.url))], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  expect(code, stdout + stderr).toBe(0);
});
