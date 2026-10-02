// test/scripts/release-notes.test.ts
//
// The GitHub Release's notes come from CHANGELOG.md (release.yml): each
// version's section, wherever it sits, and a loud failure when there is none.
import { describe, expect, test } from "bun:test";
import { changelogSection, releaseNotes } from "../../scripts/release-notes";

const CHANGELOG = `# Changelog

Intro.

## [Unreleased]

### Added

- Coming.

## [1.0.0-next.1] - 2026-10-02

The first pre-release.

## [0.10.5] - 2026-10-02

Text field accessibility.

### Added

- The asterisk.

## [0.10.4] - 2026-10-01

### Fixed

- The range band.
`;

describe("changelogSection", () => {
  test("the first section after Unreleased, a pre-release", () => {
    expect(changelogSection(CHANGELOG, "1.0.0-next.1")).toBe("The first pre-release.");
  });

  test("a middle section, its heading left out and its subsections kept", () => {
    expect(changelogSection(CHANGELOG, "0.10.5")).toBe("Text field accessibility.\n\n### Added\n\n- The asterisk.");
  });

  test("the last section, to the end of the file", () => {
    expect(changelogSection(CHANGELOG, "0.10.4")).toBe("### Fixed\n\n- The range band.");
  });

  test("a version with no section fails loudly", () => {
    expect(() => changelogSection(CHANGELOG, "0.10.6")).toThrow("CHANGELOG.md has no section for 0.10.6");
  });

  test("an empty section fails too, and a version is not matched by a prefix", () => {
    expect(() => changelogSection("## [1.0.0]\n\n## [0.9.0]\n\n- x\n", "1.0.0")).toThrow("is empty");
    expect(() => changelogSection(CHANGELOG, "0.10")).toThrow("no section");
  });

  test("a section that still parks an earlier release's entries fails: they are not this release's notes", () => {
    const parked = "## [1.0.0] - 2026-10-09\n\n### Added\n\n- New.\n\n### Also in 0.10.5\n\n- Shipped before.\n\n## [0.10.4]\n\n- x\n";
    expect(() => changelogSection(parked, "1.0.0")).toThrow('still has "### Also in 0.10.5"');
    expect(() => releaseNotes(parked, "1.0.0")).toThrow("replace that block");
    // Only a heading counts: a sentence that mentions the block does not
    expect(changelogSection("## [1.0.0]\n\nSee ### Also in 0.10.5 below.\n", "1.0.0")).toBe("See ### Also in 0.10.5 below.");
    expect(changelogSection(parked, "0.10.4")).toBe("- x");
  });

  const section = (line: string): string => `## [1.0.0]\n\n### Added\n\n- New.\n\n${line}\n\n- Shipped before.\n`;
  for (const heading of [
    "### Also in 0.10.5", "#### Also in 0.10.5", "## Also in 0.10.5", "###  Also in 0.10.5", "### also in 0.10.5",
    "### Also In 0.10.5", " ### Also in 0.10.5", "### **Also in 0.10.5**", "**Also in 0.10.5**", "__Also in 0.10.5__",
  ]) {
    test(`the parked block is refused however its heading is written: ${JSON.stringify(heading)}`, () => {
      expect(() => changelogSection(section(heading), "1.0.0")).toThrow(`still has "${heading.trim()}"`);
    });
  }

  for (const prose of ["Also in this release, the docs moved.", "- Also in 0.10.5: nothing.", "**Also in** the menu, focus returns.", "### Alsoin 0.10.5", "##### Also in 0.10.5"]) {
    test(`a line that is not that heading passes: ${JSON.stringify(prose)}`, () => {
      expect(changelogSection(section(prose), "1.0.0")).toContain(prose);
    });
  }
});

test("releaseNotes ends the section with the npm, docs and history footer", () => {
  expect(releaseNotes(CHANGELOG, "0.10.4")).toBe(
    "### Fixed\n\n- The range band.\n\n---\n\n" +
      "npm: [`mtrl@0.10.4`](https://www.npmjs.com/package/mtrl/v/0.10.4) · Docs: [md3.io](https://md3.io) · " +
      "Full history: [CHANGELOG.md](https://github.com/floor/mtrl/blob/main/CHANGELOG.md)\n",
  );
});

test("the real CHANGELOG has a section for the package's version", async () => {
  const pkg = await Bun.file(new URL("../../package.json", import.meta.url)).json();
  const changelog = await Bun.file(new URL("../../CHANGELOG.md", import.meta.url)).text();
  expect(changelogSection(changelog, pkg.version).length).toBeGreaterThan(0);
});
