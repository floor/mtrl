import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';

// Isolate DOM globals and test both real constructors without component mocks.
test('real FAB and extended FAB behavior', async () => {
  const child = Bun.spawn([
    process.execPath, 'test', fileURLToPath(new URL('./behavior.fixture.ts', import.meta.url)),
  ], { stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  expect(code, stdout + stderr).toBe(0);
});
