// Spawned by react-stack-frame.test.ts. Sets Error.stackTraceLimit before the
// bridge's first render, then restores it. No DOM shim: this process is the server.
import * as React from "react";
import * as ReactDOMServer from "react-dom/server";
import { Writable } from "node:stream";
import { buttonElement } from "../../src/elements/button";
import { createComponent } from "../../src/react/create";

const mode = process.argv[2];
if (mode !== "development" && mode !== "production") {
  console.error("Usage: react-stack-frame.fixture.ts <development|production>");
  process.exit(2);
}
if (mode === "production") process.env.NODE_ENV = "production";

const previousLimit = Error.stackTraceLimit;
Error.stackTraceLimit = 0;

const warnings: string[] = [];
const warn = console.warn;
console.warn = (...args: unknown[]) => {
  warnings.push(args.map(String).join(" "));
  warn.apply(console, args);
};

const Button = createComponent(buttonElement.spec, () => "m-button", "Button");
const h = React.createElement;

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

const page = (mark: string): React.ReactNode => {
  const first = new Promise<string>((resolve) => { setTimeout(() => resolve(`${mark} one`), 15); });
  const second = new Promise<string>((resolve) => { setTimeout(() => resolve(`${mark} two`), 15); });
  return h(React.Suspense, { fallback: h("em", null, "pending") },
    h(Button, { id: "a" }, h(Late, { promise: first })),
    h(Button, { id: "b" }, h(Late, { promise: second })),
  );
};

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

const fail = (message: string): never => {
  console.error(message);
  process.exit(1);
};

try {
  await import("../../src/ssr/react");
  const first = await renderStream(page("request-1"));
  const second = await renderStream(page("request-2"));
  const html = first + second;
  const frames = warnings.filter((line) => line.includes("no stack frame is available"));
  if (!html.includes("request-1 one") || !html.includes("request-1 two")) fail(`first request did not finish: ${first.slice(0, 400)}`);
  if (!html.includes("request-2 one") || !html.includes("request-2 two")) fail(`second request did not finish: ${second.slice(0, 400)}`);
  if (html.includes("shadowrootmode")) fail("a host rendered a declarative shadow root");
  if (mode === "development" && frames.length !== 1) fail(`expected 1 [mtrl] warning, logged ${frames.length}: ${JSON.stringify(warnings)}`);
  if (mode === "production" && frames.length !== 0) fail(`expected no [mtrl] warning in production, logged ${frames.length}: ${JSON.stringify(warnings)}`);
  console.log(`${mode}: warnings=${frames.length} shadowRoots=0 requests=2 hosts=2`);
} finally {
  Error.stackTraceLimit = previousLimit;
  console.warn = warn;
}
