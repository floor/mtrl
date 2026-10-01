// test/build/ci-static-step.test.ts
//
// CI's static job runs its four checks side by side and prints each one's output
// afterwards. Run under the shell Actions uses (bash -e -o pipefail), a failing
// check used to end its background shell before its status was written, and the
// step then stopped before printing anything: the log said "exit code 1" and
// nothing else. This runs the step's own text, with `bun run` stubbed.
import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPTS = ["ts:check", "lint", "test:naming", "test:types"];
interface Step { run?: string }
const { YAML } = Bun as unknown as { YAML: { parse(text: string): unknown } };
const workflow = YAML.parse(await Bun.file(".github/workflows/ci.yml").text()) as { jobs: { static: { steps: Step[] } } };
const step = workflow.jobs.static.steps.find(candidate => candidate.run?.includes("for script in"));

/** Runs the step as Actions does; the script named `failing` prints two lines and exits 3. */
const runStep = async (failing: string): Promise<{ code: number; output: string }> => {
  const directory = await mkdtemp(join(tmpdir(), "ci-static-"));
  try {
    await Bun.write(join(directory, "step.sh"), step!.run!);
    await Bun.write(join(directory, "run.sh"), `bun() {
  if [ "$2" = "$FAILING" ]; then echo "$2: its output"; echo "$2: its error" >&2; return 3; fi
  echo "$2: fine"
}
source "${join(directory, "step.sh")}"
`);
    const child = Bun.spawn(["bash", "--noprofile", "--norc", "-e", "-o", "pipefail", join(directory, "run.sh")], {
      env: { ...process.env, FAILING: failing }, stdout: "pipe", stderr: "pipe",
    });
    const [output, errors, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    return { code, output: output + errors };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
};

describe("CI's static step", () => {
  test("runs the four static checks", () => {
    expect(step).toBeDefined();
    expect(step!.run).toContain(`for script in ${SCRIPTS.join(" ")}; do`);
  });

  test("passes, with each check's output, when every check passes", async () => {
    const { code, output } = await runStep("none");
    expect(code).toBe(0);
    for (const script of SCRIPTS) expect(output).toContain(`::group::${script} (exit 0)\n${script}: fine\n::endgroup::`);
    expect(output).not.toContain("::error::");
  });

  for (const failing of SCRIPTS) {
    test(`fails and prints ${failing}'s output and status when it fails`, async () => {
      const { code, output } = await runStep(failing);
      expect(code).toBe(1);
      expect(output).toContain(`::group::${failing} (exit 3)`);
      expect(output).toContain(`${failing}: its output`);
      expect(output).toContain(`${failing}: its error`);
      expect(output).toContain(`::error::${failing} failed`);
      // The other three are still printed, as passing.
      for (const script of SCRIPTS.filter(name => name !== failing)) expect(output).toContain(`::group::${script} (exit 0)`);
      expect(output.match(/::error::/g)).toHaveLength(1);
    });
  }
});
