import { compile, load } from "https://deno.land/x/whistle@0.1.0/mod.ts";
import { encode } from "https://deno.land/std@0.149.0/encoding/base64.ts";
import { Language, minify } from "https://deno.land/x/minifier@v1.1.1/mod.ts";
import { Command } from "https://deno.land/x/cliffy@v0.25.0/command/mod.ts";

const { args } = await new Command()
  .description("compile & generate javascript bindings for whistle modules")
  .arguments("<input-file:string> [output-file:string]")
  .parse(Deno.args);

await load();
const file = await Deno.readTextFile(args[0]);

const bits = compile(file);

const imports = `{
    sys: {
      printString(arg) {
        console.log(readString(arg, memory));
      },
      printInt(arg) {
        console.log(arg);
      },
    },
}`;
const content = `
import { decode } from "https://deno.land/std@0.149.0/encoding/base64.ts";
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
async function load() {
    const mod = await WebAssembly.compile(decode("${encode(bits)}"));
    const instance = await WebAssembly.instantiate(mod, ${imports});
    memory = instance.exports.memory;
    if (instance.exports.main) {
      instance.exports.main();
    }
    return instance.exports;
}
export { load as default};
`;
await Deno.writeTextFile(
  args[1] || args[0].replace(".whi", ".js"),
  minify(Language.JS, content),
);
