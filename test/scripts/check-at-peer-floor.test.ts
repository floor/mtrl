// test/scripts/check-at-peer-floor.test.ts
//
// CI runs the Solid and Vue SSR checks, and each adapter's declaration check, a
// second time on the lowest version of the peer that package.json allows
// (scripts/check-at-peer-floor.ts). The version comes from the range, so a range
// it cannot read must stop the run, not pick a version.
import { describe, expect, test } from "bun:test";
import { floorOf, versionsFor } from "../../scripts/check-at-peer-floor";

describe("floorOf", () => {
  test("is the lowest version a >= range allows", () => {
    expect(floorOf(">=1.8")).toBe("1.8.0");
    expect(floorOf(">=3.3")).toBe("3.3.0");
    expect(floorOf(">=18")).toBe("18.0.0");
    expect(floorOf(">= 5.2.1")).toBe("5.2.1");
  });

  test("refuses a range with no single floor", () => {
    for (const range of ["^3.5", "~1.8", "1.8", ">=1.8 <2", "*", ""]) expect(() => floorOf(range)).toThrow(TypeError);
  });

  test("reads the floor of every peer the floor scripts name", async () => {
    const { scripts, peerDependencies } = await Bun.file("package.json").json() as { scripts: Record<string, string>; peerDependencies: Record<string, string> };
    const floors = Object.entries(scripts).filter(([name]) => name.endsWith(":floor"));
    expect(floors.map(([name]) => name).sort()).toEqual([
      "react-types:floor", "solid-ssr:floor", "solid-types:floor", "svelte-types:floor", "vue-ssr:floor", "vue-types:floor",
    ]);
    for (const [, command] of floors) {
      const peer = /check-at-peer-floor\.ts (\S+)/.exec(command)![1];
      expect(floorOf(peerDependencies[peer])).toMatch(/^\d+\.\d+\.\d+$/);
    }
    expect(floorOf(peerDependencies["solid-js"])).toBe("1.8.0");
    expect(floorOf(peerDependencies.vue)).toBe("3.4.20");
    expect(floorOf(peerDependencies.react)).toBe("18.0.0");
    expect(floorOf(peerDependencies.svelte)).toBe("5.0.0");
  });

  test("the React types floor installs react at its range floor and @types/react at 18.2.71", async () => {
    const { scripts, peerDependencies } = await Bun.file("package.json").json() as { scripts: Record<string, string>; peerDependencies: Record<string, string> };
    const parts = scripts["react-types:floor"].split(" ");
    const tokens = parts.slice(parts.indexOf("scripts/check-at-peer-floor.ts") + 1, parts.indexOf("--"));
    const plan = versionsFor(tokens, peerDependencies.react);
    expect(plan.map(({ name, version }) => `${name}@${version}`)).toEqual(["react@18.0.0", "@types/react@18.2.71"]);
    expect(plan[1]?.reason).toContain("scheduler/tracing");
    const vue = scripts["vue-types:floor"].split(" ");
    const vueTokens = vue.slice(vue.indexOf("scripts/check-at-peer-floor.ts") + 1, vue.indexOf("--"));
    expect(versionsFor(vueTokens, peerDependencies.vue).map(({ name, version }) => `${name}@${version}`)).toEqual([
      "vue@3.4.20", "@vue/server-renderer@3.4.20",
    ]);
  });

  test("an unknown override name is an error", () => {
    expect(() => versionsFor(["react", "@types/nope@override"], ">=18")).toThrow(TypeError);
  });
});
