import { run } from "./mod.ts";

await run(`
builtin @core { proc_exit }
export fn main(): none { 
    // exits
    proc_exit(0)
}`);

// should not be run
console.log("hi there");
