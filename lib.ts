import * as wasm from "./pkg/whistle_deno.js";

const notLoadedError = new Error(
  "The whistle_deno wasm module needs to be loaded before using",
);
let loaded = false;

export async function load(): Promise<void> {
  if (!loaded) {
    await wasm.default(wasm.source);
    loaded = true;
  }
}

export function lex(source: string): string {
  if (!loaded) {
    throw notLoadedError;
  }

  return wasm.lex(source);
}

export function parseExports(source: string): string {
  if (!loaded) {
    throw notLoadedError;
  }

  return wasm.parse_exports(source);
}

export function compile(source: string): Uint8Array {
  if (!loaded) {
    throw notLoadedError;
  }

  return wasm.compile(source) as Uint8Array;
}