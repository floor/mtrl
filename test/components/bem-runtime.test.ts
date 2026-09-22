import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

test("BEM classes address real component anatomy and state", async () => {
  const child = Bun.spawn([process.execPath, "test", fileURLToPath(new URL("./bem-runtime.fixture.ts", import.meta.url))], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
  expect(code, stdout + stderr).toBe(0);
}, 15000);
