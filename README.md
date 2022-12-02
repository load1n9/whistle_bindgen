# Generate Javascript bindings for whistle

## Quickstart

### install

```sh
deno install -Afq --unstable -n whistle_bindgen https://raw.githubusercontent.com/load1n9/whistle_bindgen/main/cli.ts
```

test.whi

```rs
builtin @core { proc_exit }

export fn exit(code: i32): none {
    proc_exit(code)
}

export fn main(): none {}
```

### compile

```sh
whistle_bindgen ./test.whi ./test.js
```

### Usage

```typescript
import { load, exit} from "./test.js";

await load();

console.log("should print");
exit();
console.log("shouldn't print");
```
