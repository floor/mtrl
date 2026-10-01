// spike/ssr/make-table.ts — the per-component table of REPORT.md, from results/.
//
//   bun spike/ssr/make-table.ts > spike/ssr/results/table.md

const r = (f: string) => Bun.file(`${import.meta.dir}/results/${f}`).json();
const bare = await r("factories-bare.json");
const min = await r("factories-min.json");
const shim = await r("factories-shim.json");
const parity = await r("parity.json");
const upgrade = await r("upgrade.json");

const short = (s: string) => s.replace(/view\.getComputedStyle is not a function[^@]*/, "getComputedStyle missing ").replace(/^Failed to create [a-z ]+: /, "").replace(/ is not defined/, " missing");
const rows: string[] = [
  "| # | Element | linkedom bare | Root cause (bare) | Browser APIs reached (shim) | Parity, after upgrade settles | Upgrade: px changed (DST / Phase A) | CLS (DST) |",
  "|---|---|---|---|---|---|---|---|",
];
bare.rows.forEach((b: any, i: number) => {
  const m = min.rows[i];
  const s = shim.rows[i];
  const p = parity.results.find((x: any) => x.element === b.element);
  const u = upgrade.find((x: any) => x.element === b.element);
  const root = b.status === "ok" ? "" : b.root ? short(b.root) : short(`${b.error} @ ${b.at}`);
  const minNote = b.status !== "ok" && m.status !== "ok" ? ` (then ${short(m.root ?? m.error)})` : "";
  const apis = [...new Set(s.hits.map((h: any) => h.api.replace(" (feature test)", "?")))].filter((a) => a !== "setTimeout").join(", ");
  const timers = s.hits.some((h: any) => h.api === "setTimeout") ? " +timer" : "";
  const parityCell =
    p.settled === "differs"
      ? `**differs** (${p.diff.length} lines)`
      : p.settled === "raw"
        ? "identical"
        : `equal after ${p.settled}`;
  rows.push(
    `| ${i + 1} | ${b.element} | ${b.status === "ok" ? "OK" : "**fails**"} | ${root}${minNote} | ${apis || "none"}${timers} | ${parityCell} | ${u.dst.changedPct}% / ${u.phaseA.changedPct}% | ${u.dst.after.cls.toFixed(4)} |`
  );
});
console.log(rows.join("\n"));
const count = (f: (i: number) => boolean) => bare.rows.filter((_: any, i: number) => f(i)).length;
console.log(
  `\nbare OK ${count((i) => bare.rows[i].status === "ok")}/${bare.rows.length}; min OK ${count((i) => min.rows[i].status === "ok")}; shim OK ${count((i) => shim.rows[i].status === "ok")}; ` +
    `parity equal (normalised) ${parity.results.filter((x: any) => x.settled !== "differs").length}; ` +
    `upgrade pixel-identical ${upgrade.filter((x: any) => x.dst.changedPct === 0).length}, CLS 0 ${upgrade.filter((x: any) => x.dst.after.cls === 0).length}`
);
