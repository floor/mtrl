import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';

// Keep the real component's DOM globals isolated from other test suites.
test('real segmented button behavior and event type', async () => {
  const child = Bun.spawn([
    process.execPath, 'test', fileURLToPath(new URL('./behavior.fixture.ts', import.meta.url)),
  ], { stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  expect(code, stdout + stderr).toBe(0);
}, 15000);
