import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';

// Keep the real component's DOM globals isolated from other component fixtures.
test('real icon button behavior', async () => {
  const child = Bun.spawn([
    process.execPath, 'test',
    fileURLToPath(new URL('./behavior.fixture.ts', import.meta.url)),
  ], { stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  expect(code, stdout + stderr).toBe(0);
});
