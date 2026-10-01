// spike/ssr/run-all.ts — every measurement of the spike, in order.
//
//   bun install && (cd spike/ssr && bun install) && bun run build
//   bun spike/ssr/run-all.ts
//
// About 4 minutes (Playwright with Chromium, Firefox and WebKit).

const steps: string[][] = [
  ["spike/ssr/run-factories.ts", "bare"],
  ["spike/ssr/run-factories.ts", "min"],
  ["spike/ssr/run-factories.ts", "shim"],
  ["spike/ssr/timers-probe.ts"],
  ["spike/ssr/timers-probe.ts", "detached"],
  ["spike/ssr/detached-check.ts"],
  ["spike/ssr/parity.ts"],
  ["spike/ssr/emit-css.ts"],
  ["spike/ssr/render-pages.ts"],
  ["spike/ssr/upgrade.ts"],
  ["spike/ssr/attach-probe.ts"],
  ["spike/ssr/styles-by-link.ts"],
  ["spike/ssr/link-timeline.ts", "1500"],
  ["spike/ssr/link-timeline.ts", "0"],
  ["spike/ssr/react/run.ts"],
  ["spike/ssr/size.ts"],
  ["spike/ssr/make-table.ts"],
];
const root = `${import.meta.dir}/../..`;
for (const step of steps) {
  console.log(`\n$ bun ${step.join(" ")}`);
  const p = Bun.spawnSync(["bun", ...step], { cwd: root, stdout: "pipe", stderr: "pipe" });
  const out = p.stdout.toString();
  if (step[0].endsWith("make-table.ts")) await Bun.write(`${import.meta.dir}/results/table.md`, out);
  console.log(out.split("\n").slice(-40).join("\n"));
  if (p.exitCode !== 0) {
    console.error(p.stderr.toString().slice(-2000));
    process.exit(p.exitCode ?? 1);
  }
}
