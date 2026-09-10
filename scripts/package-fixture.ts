import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export async function run(command: string[], cwd = process.cwd()) {
  const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  assert.equal(code, 0, `${command.join(" ")} failed:\n${stdout}\n${stderr}`);
  return stdout;
}

/** Install the npm tarball without dependencies or network access. */
export async function createPackageFixture() {
  const directory = await realpath(await mkdtemp(join(tmpdir(), "mtrl-consumer-")));
  const cleanup = () => rm(directory, { recursive: true, force: true });
  try {
    const [pack] = JSON.parse(await run([
      "npm", "pack", "--ignore-scripts", "--json", "--pack-destination", directory,
      "--cache", join(directory, "npm-cache"),
    ]));
    const installed = join(directory, "node_modules/mtrl");
    await mkdir(installed, { recursive: true });
    await run(["tar", "-xzf", join(directory, pack.filename), "-C", installed, "--strip-components=1"]);
    await writeFile(join(directory, "package.json"), '{"type":"module"}');
    return { directory, installed, pack, cleanup };
  } catch (error) {
    await cleanup();
    throw error;
  }
}
