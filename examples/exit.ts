import { run } from "../mod.ts";

await run(Deno.readTextFileSync(new URL("./exit.whi", import.meta.url)));

// should not be run
console.log("hi there");
