# Generate Javascript bindings for whistle


## Quickstart

### install 

```
deno install -Afq --unstable -n whistle_bindgen https://deno.land/x/whistle_bindgen/cli.ts
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
import { load, helloWorld} from "./test.js";

await load();

helloWorld();
```
