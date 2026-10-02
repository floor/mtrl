// src/ssr/react.ts
/**
 * Enable declarative shadow DOM for mtrl/react in this server process.
 * The identity HTML policy is not a sanitizer; configure a synchronous sanitizer for untrusted markup.
 * The server-rendered shadow root is built in a separate render, without the context of providers above the component.
 * The page's own render (the light DOM) sees the provided value. Until upgrade, a child reading context with a default shows that default in the painted shadow root; a child requiring its context leaves this component without a declarative shadow root while the page still renders. In development, a warning names the element.
 * The Vue and Solid bridges see the provided value in both the shadow root and light DOM. Svelte has this same context limit and logs a development-only warning naming the element when required context leaves it without a shadow root.
 * Pass the resolved string as a prop or attribute, or accept client-rendered text until the upgrade. A fix is planned for 1.1 (FLO-517).
 * @module ssr/react
 */
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "./index";

const bridge = (globalThis as unknown as Record<symbol, {
  shadow: (tag: string, markup: string, prefix: string) => string;
  react?: (tag: string, props: Record<string, unknown>, children: React.ReactNode, prefix: string) => string | undefined;
}>)[Symbol.for("mtrl.ssr")];

/**
 * Waits before each retry of a suspending child. The first retry is the next
 * task, so a child that resolves in a few milliseconds is snapshotted at once.
 * The wait then doubles, and further retries keep the last step. A slow child
 * is rendered a few times a second instead of hundreds.
 */
const RETRY_DELAYS_MS = [0, 2, 4, 8, 16, 32, 64, 128, 250];

/**
 * Suspensions past this are left to the page. Forty attempts is about eight
 * seconds at the delays above. The host is then rendered with no shadow root,
 * and the page keeps streaming for as long as it would without the bridge.
 */
const MAX_SUSPENDS = 40;

let serializingChildren = false;

interface Attempt { count: number; nodes: object[]; gaveUp: boolean }

/** One counter per host. The child element is stable across the host's retries; a ref is not. */
const attempts = new WeakMap<object, Attempt>();

/**
 * renderToStaticMarkup reports a synchronous suspend as a plain Error thrown
 * from one place in React. The thenable the child threw does not escape, and
 * the Error has no code or digest. The message depends on the build, so it is
 * not the signal: the header is skipped and the first call frame is compared
 * with a frame sampled from this process's own React. A child's error is
 * thrown from the child, including one whose text copies React's message.
 * A frame is a V8 line starting with `at `, or a JavaScriptCore or SpiderMonkey
 * `name@file:line:col` line. Anything else is not a frame, so the error is not
 * a suspension.
 */
const firstFrame = (error: unknown): string | undefined => {
  if (!(error instanceof Error) || typeof error.stack !== "string") return undefined;
  const header = `${error.name}: ${error.message}`;
  const rest = error.stack.startsWith(header) ? error.stack.slice(header.length) : error.stack;
  return rest.split("\n").map((line) => line.trim()).find((line) => line.startsWith("at ") || /@[^@]*:\d+:\d+/.test(line));
};

/** `null` until the first suspend samples this process's React. An empty sample stays unset. */
let sampledFrame: string | undefined | null = null;

const suspendFrame = (): string | undefined => {
  if (sampledFrame !== null) return sampledFrame;
  const pending = new Promise<never>(() => {});
  const Probe = (): never => { throw pending; };
  const errorLog = console.error;
  const warnLog = console.warn;
  console.error = () => {};
  console.warn = () => {};
  try {
    renderToStaticMarkup(React.createElement(Probe));
    sampledFrame = undefined;
  } catch (error) {
    sampledFrame = firstFrame(error);
  } finally {
    console.error = errorLog;
    console.warn = warnLog;
  }
  // Once per process: the sample is cached, and a second host does not sample again.
  if (sampledFrame === undefined && isDevelopment()) {
    console.warn("[mtrl] Suspending children of mtrl components will render without a server shadow root because no stack frame is available. Error.stackTraceLimit is 0, or Error.prepareStackTrace is custom.");
  }
  return sampledFrame;
};

const isSynchronousSuspend = (error: unknown): boolean => {
  const frame = firstFrame(error);
  return frame !== undefined && frame === sampledFrame;
};

/** Same guard as core/utils/warn.ts: tsc leaves NODE_ENV in place, and a browser without process must not throw. */
const isDevelopment = (): boolean => {
  try {
    return typeof process !== "undefined" && process.env != null && process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
};

const elementLabel = (tag: string, props: Record<string, unknown>): string => {
  const id = typeof props.id === "string" && props.id ? ` id=${JSON.stringify(props.id)}` : "";
  return `<${tag}${id}>`;
};

/** Elements the attempt counter can hang from. Slot wrappers are recreated on every host render, so the counter hangs from the child inside them. */
const childNodes = (children: React.ReactNode): object[] => {
  const nodes: object[] = [];
  const visit = (node: React.ReactNode): void => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (node === null || typeof node !== "object") return;
    if (React.isValidElement(node) && node.type === "span") {
      const props = node.props as { slot?: unknown; children?: React.ReactNode };
      if (props.slot != null) {
        visit(props.children);
        return;
      }
    }
    nodes.push(node);
  };
  const top = React.isValidElement(children) && children.type === React.Fragment
    ? (children.props as { children?: React.ReactNode }).children
    : children;
  visit(top);
  return nodes;
};

const nextAttempt = (children: React.ReactNode): number => {
  const nodes = childNodes(children);
  if (nodes.length === 0) return MAX_SUSPENDS + 1;
  let state: Attempt | undefined;
  for (const node of nodes) {
    state = attempts.get(node);
    if (state) break;
  }
  if (!state) state = { count: 0, nodes, gaveUp: false };
  state.count += 1;
  state.nodes = nodes;
  for (const node of nodes) attempts.set(node, state);
  return state.count;
};

const suspendedGaveUp = (children: React.ReactNode): boolean => {
  for (const node of childNodes(children)) {
    if (attempts.get(node)?.gaveUp) return true;
  }
  return false;
};

/** Keeps the counter so a later render of the same child does not warn again. */
const markGaveUp = (children: React.ReactNode): boolean => {
  let state: Attempt | undefined;
  for (const node of childNodes(children)) {
    state = attempts.get(node);
    if (state) break;
  }
  if (!state || state.gaveUp) return false;
  state.gaveUp = true;
  return true;
};

const clearAttempt = (children: React.ReactNode): void => {
  const nodes = childNodes(children);
  let state: Attempt | undefined;
  for (const node of nodes) {
    state = attempts.get(node);
    if (state) break;
  }
  if (!state) return;
  for (const node of state.nodes) attempts.delete(node);
  for (const node of nodes) attempts.delete(node);
};

const retryDelay = (attempt: number): number =>
  RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1] ?? 250;

bridge.react = (tag, props, children, prefix) => {
  // Nested hosts emit their own roots when React renders the outer tree.
  // A template from this pass would declare a shadow root twice.
  if (serializingChildren) return undefined;
  // The cap already let this child go. A later pass must not open another wait or warn again.
  if (suspendedGaveUp(children)) return undefined;
  // Sample outside a render. Doing it from the catch would nest renderToStaticMarkup.
  suspendFrame();
  let markup: string;
  serializingChildren = true;
  try {
    // No Suspense wrapper here. renderToStaticMarkup renders an error and a
    // suspension as the same fallback, so a wrapper cannot tell them apart.
    // A suspension is thrown from React's static renderer; any other throw is
    // the child's error. A boundary already inside the children still renders
    // its own fallback, and this pass does not throw.
    markup = renderToStaticMarkup(React.createElement(tag, props, children));
  } catch (error) {
    if (!isSynchronousSuspend(error)) {
      // Returning lets the host finish. The page then renders this child and
      // reports its error, as it does without the bridge. Development names the
      // host and the error; nothing is remembered past this call.
      if (isDevelopment()) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[mtrl] ${elementLabel(tag, props)} child snapshot failed, often because it needs ancestor context; this response has no shadow root for it: ${message}`);
      }
      clearAttempt(children);
      return undefined;
    }
    const attempt = nextAttempt(children);
    if (attempt > MAX_SUSPENDS) {
      // No template, and the page render reaches the child. A slow response is not a failed request.
      if (markGaveUp(children) && isDevelopment()) {
        console.warn(`[mtrl] ${elementLabel(tag, props)} still had a suspending child after ${MAX_SUSPENDS} attempts, so this response has no shadow root for it.`);
      }
      return undefined;
    }
    const delay = retryDelay(attempt);
    throw new Promise<void>((resolve) => { setTimeout(resolve, delay); });
  } finally { serializingChildren = false; }
  clearAttempt(children);
  // Let React serialize host props (style objects, tabIndex, boolean/data/aria
  // attributes). The server bridge parses them in its own DOM realm.
  // An opted-out host has no shadow content and must not get an empty template.
  return bridge.shadow(tag, markup, prefix) || undefined;
};
