import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

test("real core resource lifecycle", async () => {
  const child = Bun.spawn([process.execPath, "test", fileURLToPath(new URL("./lifecycle.fixture.ts", import.meta.url))], { stdout: "pipe", stderr: "pipe" });
  const [out, err, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  expect(code, out + err).toBe(0);
});
