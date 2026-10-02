#!/usr/bin/env bun
/**
 * A release's notes, from CHANGELOG.md: the version's section without its
 * heading, and the footer the GitHub Releases carry (the release workflow).
 *
 *   bun scripts/release-notes.ts 0.10.5 > notes.md
 *
 * A version with no section, or an empty one, fails: a release without notes
 * is a CHANGELOG that was not updated, which is worth stopping for. So does a
 * section that still holds an `### Also in <version>` block: those entries
 * shipped in an earlier release and are parked there until that release's own
 * section joins the file, so they must not go out as this release's notes.
 * The block is recognised by its heading, however it is written: two to four
 * `#`, any case and spacing, with or without emphasis, or a line that is only
 * a bold "Also in …" label. A sentence that starts "Also in" is prose.
 */

/** A line that opens a parked block: an "Also in" heading, or a bold label on a line of its own */
const PARKED = /^\s*#{2,4}\s+[*_]{0,2}also in\b|^\s*(?:\*\*|__)also in\b[^*_]*(?:\*\*|__)\s*$/i;

/** The version's section of the changelog, its `## [x.y.z]` heading left out */
export function changelogSection(changelog: string, version: string): string {
  const lines = changelog.split("\n");
  const heading = `## [${version}]`;
  const start = lines.findIndex((line) => line === heading || line.startsWith(`${heading} `));
  if (start === -1) throw new Error(`CHANGELOG.md has no section for ${version}`);
  const next = lines.findIndex((line, index) => index > start && line.startsWith("## ["));
  const body = lines.slice(start + 1, next === -1 ? undefined : next).join("\n").trim();
  if (!body) throw new Error(`CHANGELOG.md's section for ${version} is empty`);
  const parked = body.split("\n").find((line) => PARKED.test(line));
  if (parked) throw new Error(`CHANGELOG.md's section for ${version} still has "${parked.trim()}": replace that block with the earlier release's own section first`);
  return body;
}

/** The section and the footer: npm, the docs, the full history */
export function releaseNotes(changelog: string, version: string): string {
  const footer = [
    `npm: [\`mtrl@${version}\`](https://www.npmjs.com/package/mtrl/v/${version})`,
    "Docs: [md3.io](https://md3.io)",
    "Full history: [CHANGELOG.md](https://github.com/floor/mtrl/blob/main/CHANGELOG.md)",
  ].join(" · ");
  return `${changelogSection(changelog, version)}\n\n---\n\n${footer}\n`;
}

if (import.meta.main) {
  const version = process.argv[2];
  if (!version) throw new Error("usage: bun scripts/release-notes.ts <version>");
  const changelog = await Bun.file(new URL("../CHANGELOG.md", import.meta.url)).text();
  process.stdout.write(releaseNotes(changelog, version));
}
