# Generate Javascript bindings for whistle


## Quickstart

### install 

```
deno install -Afq --unstable -n whistle_bindgen https://crux.land/5dBLUg
```
test.whi
```rs
export fn helloWorld(): i32 {
    // prints Hello World to the console 
    printString("Hello World!")
    return 0
}
```

### compile
```
whistle_bindgen ./test.whi ./test.js
```

### Usage

```typescript
import module from "./test.js";

// deno-lint-ignore no-explicit-any
const { helloWorld }: any = await module();

helloWorld();
```
