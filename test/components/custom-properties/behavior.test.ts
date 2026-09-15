import { expect, test } from 'bun:test';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

for (const prefix of ['mtrl', 'custom']) {
  test(`real components write custom properties with the ${prefix} library prefix`, async () => {
    const directory = mkdtempSync(join(tmpdir(), 'mtrl-component-prefix-'));
    try {
      // Core configuration intentionally takes PREFIX over per-instance overrides.
      // Test the library's one-variable switch without modifying the checkout.
      cpSync('src', join(directory, 'src'), { recursive: true });
      symlinkSync(resolve('node_modules'), join(directory, 'node_modules'));
      const config = join(directory, 'src/core/config.ts');
      writeFileSync(config, readFileSync(config, 'utf8').replace(/export const PREFIX = '[^']+'/, `export const PREFIX = '${prefix}'`));
      const fixture = join(directory, 'test/components/custom-properties/behavior.fixture.ts');
      cpSync(fileURLToPath(new URL('./behavior.fixture.ts', import.meta.url)), fixture, { recursive: true });
      const child = Bun.spawn([process.execPath, 'test', fixture], { stdout: 'pipe', stderr: 'pipe' });
      const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
      expect(code, stdout + stderr).toBe(0);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
}
