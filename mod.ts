// deno-lint-ignore-file no-explicit-any
import { compile, load } from "./lib.ts";
import Context from "https://deno.land/std@0.167.0/wasi/snapshot_preview1.ts";

export const readString = (
  ptr: any,
  mem: any = undefined,
) => {
  if (mem === undefined) return;
  const view = new Uint8Array(mem.buffer);
  let end = ptr;
  while (view[end]) ++end;
  return (new TextDecoder()).decode(new Uint8Array(view.subarray(ptr, end)));
};

const context = new Context({
  args: Deno.args,
  env: Deno.env.toObject(),
});

let memory: any;

export async function run(code: string) {
    await load();
    const mod = await WebAssembly.compile(compile(code));
    const wasm = await WebAssembly.instantiate(mod, {
      io: {
        println(arg: number) {
          console.log(readString(arg, memory));
        },
        printInt(arg: number) {
          console.log(arg);
        },
      },
      wasi_unstable: context.exports,
    });
    context.start(wasm);
    return (wasm.exports as any)
}

export async function instantiate(file: Uint8Array) {
  const mod = await WebAssembly.compile(file);
  const wasm = await WebAssembly.instantiate(mod, {
    io: {
      println(arg: number) {
        console.log(readString(arg, memory));
      },
      printInt(arg: number) {
        console.log(arg);
      },
    },
    wasi_unstable: context.exports,
  });
  context.start(wasm);
  return (wasm.exports as any);
}