// Spawned by react-host-warning.test.ts. No DOM shim: this process is the server.
// A child that needs a provider above the host throws in the bridge's separate
// render. The page render still has that provider.
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { Writable } from "node:stream";
import { buttonElement } from "../../src/elements/button";
import { createComponent } from "../../src/react/create";

const mode = process.argv[2];
if (mode !== "development" && mode !== "production") {
  console.error("Usage: react-host-warning.fixture.ts <development|production>");
  process.exit(2);
}
process.env.NODE_ENV = mode;

const warnings: string[] = [];
const warn = console.warn;
console.warn = (...args: unknown[]) => {
  warnings.push(args.map(String).join(" "));
  warn.apply(console, args);
};

const Button = createComponent(buttonElement.spec, () => "m-button", "Button");
const h = React.createElement;
const Required = React.createContext<string | null>(null);
const MISSING = "Required provider is missing";

const Needs = () => {
  const value = React.useContext(Required);
  if (value === null) throw new Error(MISSING);
  return h(React.Fragment, null, value);
};

const host = (id: string): React.ReactElement =>
  h(Required.Provider, { value: `value-${id}` }, h(Button, { id }, h(Needs)));

const snapshotWarnings = (): string[] => warnings.filter((line) => line.includes("child snapshot failed"));

const fail = (message: string): never => {
  console.error(message);
  console.error(JSON.stringify(snapshotWarnings(), null, 2));
  process.exit(1);
};

const expectCount = (label: string, before: number, count: number): string[] => {
  const lines = snapshotWarnings();
  const added = lines.slice(before);
  if (added.length !== count) fail(`${label}: expected ${count} snapshot warning(s), got ${added.length}`);
  return added;
};

type Recorded = Promise<string> & { status?: "pending" | "fulfilled" | "rejected"; value?: string; reason?: unknown };

const readPromise = (promise: Promise<string>): string => {
  const use = (React as { use?: (value: Promise<string>) => string }).use;
  if (typeof use === "function") return use(promise);
  const recorded = promise as Recorded;
  if (recorded.status === "fulfilled") return recorded.value ?? "";
  if (recorded.status === "rejected") throw recorded.reason;
  if (recorded.status !== "pending") {
    recorded.status = "pending";
    promise.then((value) => {
      recorded.status = "fulfilled";
      recorded.value = value;
    }, (reason) => {
      recorded.status = "rejected";
      recorded.reason = reason;
    });
  }
  throw promise;
};

const Late = ({ promise }: { promise: Promise<string> }) => h("i", null, readPromise(promise));

const renderStream = (node: React.ReactNode): Promise<string> => {
  const readable = (ReactDOMServer as unknown as {
    renderToReadableStream?: (node: React.ReactNode, options: { onError: (error: unknown) => void }) => Promise<{ allReady: Promise<void> }>;
  }).renderToReadableStream;
  if (typeof readable === "function") {
    return (async () => {
      const body = await readable(node, { onError() {} });
      await body.allReady;
      return new Response(body as unknown as BodyInit).text();
    })();
  }
  const pipeable = (ReactDOMServer as unknown as {
    renderToPipeableStream: (node: React.ReactNode, options: {
      onError: (error: unknown) => void;
      onShellError: (error: unknown) => void;
      onAllReady: () => void;
    }) => { pipe: (destination: NodeJS.WritableStream) => void };
  }).renderToPipeableStream;
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = pipeable(node, {
      onError() {},
      onShellError(error) { reject(error instanceof Error ? error : new Error(String(error))); },
      onAllReady() {
        stream.pipe(new Writable({
          write(chunk, _encoding, callback) { chunks.push(Buffer.from(chunk)); callback(); },
          final(callback) { resolve(Buffer.concat(chunks).toString()); callback(); },
        }));
      },
    });
  });
};

const named = (line: string, id: string): void => {
  if (!line.includes(`[mtrl] <m-button id="${id}">`)) fail(`warning does not name <m-button id="${id}">: ${line}`);
  if (!line.includes(MISSING)) fail(`warning does not include the error message: ${line}`);
  if (!line.includes("child snapshot failed, often because it needs ancestor context; this response has no shadow root for it")) {
    fail(`warning does not match the host-snapshot sentence: ${line}`);
  }
};

try {
  await import("../../scripts/fixtures/ssr-css");
  await import("../../src/ssr/react");

  const first = ReactDOMServer.renderToString(host("context-host"));
  const firstWarnings = expectCount("one host", 0, mode === "development" ? 1 : 0);
  if (mode === "development") named(firstWarnings[0] ?? "", "context-host");
  if (first.includes("shadowrootmode")) fail(`context host rendered a shadow root: ${first.slice(0, 500)}`);
  if (!first.includes("value-context-host")) fail(`context page did not render: ${first.slice(0, 500)}`);

  const pairBefore = snapshotWarnings().length;
  const pair = ReactDOMServer.renderToString(h(React.Fragment, null, host("one"), host("two")));
  const pairWarnings = expectCount("two hosts", pairBefore, mode === "development" ? 2 : 0);
  // expectCount slices from `before`, which must be the count before this render.
  if (pair.includes("shadowrootmode")) fail("a paired host rendered a shadow root");
  if (!pair.includes("value-one") || !pair.includes("value-two")) fail(`paired page did not render: ${pair.slice(0, 500)}`);
  if (mode === "development") {
    named(pairWarnings[0] ?? "", "one");
    named(pairWarnings[1] ?? "", "two");
  }

  const againBefore = snapshotWarnings().length;
  const again = ReactDOMServer.renderToString(host("context-host"));
  const againWarnings = expectCount("second request", againBefore, mode === "development" ? 1 : 0);
  if (mode === "development") named(againWarnings[0] ?? "", "context-host");
  if (again.includes("shadowrootmode")) fail("second request rendered a shadow root");
  if (!again.includes("value-context-host")) fail("second request did not render");

  const suspendBefore = snapshotWarnings().length;
  const promise = new Promise<string>((resolve) => { setTimeout(() => resolve("suspended-ok"), 15); });
  const suspended = await renderStream(h(React.Suspense, { fallback: h("em", null, "pending") },
    h(Button, { id: "suspend" }, h(Late, { promise }))));
  expectCount("suspension", suspendBefore, 0);
  if (!suspended.includes("suspended-ok")) fail(`suspending child did not finish: ${suspended.slice(0, 500)}`);
  if (!suspended.includes("shadowrootmode")) fail("suspending child rendered no shadow root");

  const explodedBefore = snapshotWarnings().length;
  const Boom = (): never => { throw new Error("child exploded"); };
  let threw = false;
  try {
    ReactDOMServer.renderToString(h(Button, { id: "boom" }, h(Boom)));
  } catch (error) {
    threw = true;
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("child exploded")) fail(`page threw a different error: ${message}`);
  }
  if (!threw) fail("a child that throws in the page render did not fail the page");
  const exploded = expectCount("real error", explodedBefore, mode === "development" ? 1 : 0);
  if (mode === "development") {
    const line = exploded[0] ?? "";
    if (!line.includes(`[mtrl] <m-button id="boom">`)) fail(`real-error warning does not name the host: ${line}`);
    if (!line.includes("child exploded")) fail(`real-error warning does not include the error message: ${line}`);
  }

  const lines = snapshotWarnings();
  console.log(`${mode}: context=${firstWarnings.length} two=${pairWarnings.length} second=${againWarnings.length} suspend=0 exploded=${exploded.length} threw=1`);
  for (const line of lines) console.log(`warning: ${line}`);
} finally {
  console.warn = warn;
}
