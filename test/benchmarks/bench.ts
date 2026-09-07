import { describe } from "bun:test";

/**
 * Benchmarks measure elapsed time against fixed thresholds, so they fail
 * whenever the machine is busy with something else rather than when the code
 * has got slower. That makes them useless as a gate and actively misleading:
 * a red suite that means "a build was running" teaches people to ignore red.
 *
 * So they are skipped unless asked for:
 *
 *     bun run bench
 *
 * They are still worth having. What they are not is a correctness test, and
 * `bun test` should only fail when something is wrong.
 */
export const benchmark = process.env.MTRL_BENCH === "1" ? describe : describe.skip;
