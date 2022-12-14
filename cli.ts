import { compile, load, parseExports } from "./lib.ts";
import { TerminalSpinner } from "https://deno.land/x/spinners@v1.1.2/mod.ts";
import { encode } from "https://deno.land/std@0.149.0/encoding/base64.ts";
import { Language, minify } from "https://deno.land/x/minifier@v1.1.1/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.25.0/command/mod.ts";

const { args } = await new Command()
  .description("compile & generate javascript bindings for whistle modules")
  .arguments("<input-file:string> [output-file:string]")
  .parse(Deno.args);

await load();

const generateFunction = (ident: string, params: string[]) =>
  `export function ${ident}(${
    params.map((_e: string, i: number) => `$${i + 1}`).join(" ,")
  }) {if(!loaded){throw new Error("module not loaded");}return whistle_wasm.exports.${ident}(${
    params.map((_e: string, i: number) => `$${i + 1}`).join(" ,")
  });}`;

const generateExports = (code: string): string =>
  parseExports(code).filter((e) => e.export).filter((e) => e.ident !== "main")
    .map((e) => generateFunction(e.ident, e.params)).join("\n");
const time = Date.now();
const terminalSpinner = new TerminalSpinner(
  `compiling ${args[0]} & generating bindings...`,
);

terminalSpinner.start();
const file = await Deno.readTextFile(args[0]);

const imports = `{
  io: {
    println(arg) {
      console.log(readString(arg, memory));
    },
    printInt(arg) {
      console.log(arg);
    },
  },
  wasi_unstable: context.exports,
}`;

const exports = generateExports(file);
const bits = compile(file);

const content = `
import { decode } from "https://deno.land/std@0.149.0/encoding/base64.ts";
import Context from "https://deno.land/std@0.167.0/wasi/snapshot_preview1.ts";

const context = new Context({
  args: Deno.args,
  env: Deno.env.toObject(),
});

const readString = (
    ptr,
    memory = undefined,
  ) => {
    if (memory === undefined) return;
    const view = new Uint8Array(memory.buffer);
    let end = ptr;
    while (view[end]) ++end;
    return (new TextDecoder()).decode(new Uint8Array(view.subarray(ptr, end)));
  };  
let memory;
let whistle_wasm;
let loaded = false;
export async function load() {
  if(!loaded){
    const mod = await WebAssembly.compile(decode("${encode(bits)}"));
    whistle_wasm = await WebAssembly.instantiate(mod, ${imports});
    try {
      context.start(whistle_wasm);
    } catch(e) {}
    loaded = true;
    memory = whistle_wasm.exports.memory;
  }
}
${exports}
`;
await Deno.writeTextFile(
  args[1] || args[0].replace(".whi", ".js"),
  minify(Language.JS, content),
);

terminalSpinner.succeed(
  `Generated ${args[1] || args[0].replace(".whi", ".js")}, took ${
    Date.now() - time
  } milliseconds!`,
);
