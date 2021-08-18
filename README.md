# Deno Builds for Atek

This repo generates Deno builds for some modules used in Atek (initially Hyperspace Client and Hyperbee). It also may contain some helper files or polyfills.

To build, run:

```
npm install
git clone https://github.com/hypercore-protocol/hyperspace-client
git clone https://github.com/hypercore-protocol/hyperbee
npm run build
```

## Notes on the builds

### Hyperspace Client and Hyperbee

These modules were built for nodejs, so there are some quirks that we have to work around.

- We have to bundle them into individual JS files. We use `esbuild`.
- We have to polyfill many nodejs APIs. We use `@esbuild-plugins/node-globals-polyfill` and `@esbuild-plugins/node-modules-polyfill`.
- We need a node-socket-like interface for the WebSocket which implements the nodejs Duplex stream. This is in `/lib/ws-stream.ts`.
- We need to use the same `Buffer` class across all modules, so we import Deno's Buffer polyfill in the banners of the bundles rather than using the `node-globals-polyfill` version.
- The deno `Buffer` polyfill is missing `compare()` so we patch that in.