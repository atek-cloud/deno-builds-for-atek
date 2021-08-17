import GlobalsPolyfills from '@esbuild-plugins/node-globals-polyfill'
import NodeModulesPolyfills from '@esbuild-plugins/node-modules-polyfill'
import { build } from 'esbuild'
import fs from 'fs'
import path from 'path'

const hcPkg = JSON.parse(fs.readFileSync(path.join('hyperspace-client', 'package.json'), 'utf8'))
const hbeePkg = JSON.parse(fs.readFileSync(path.join('hyperbee', 'package.json'), 'utf8'))

build({
  format: 'esm',
  entryPoints: ['hyperspace-client/index.js'],
  bundle: true,
  platform: 'node',
  outfile: `dist/hyperspace-client.${hcPkg.version}.build.js`,
  banner: {js: 'const global = {}\n'}, // for some reason this doesn't get done and we need it
  plugins: [
    GlobalsPolyfills.NodeGlobalsPolyfillPlugin({
      process: true,
      buffer: true
    }),
    NodeModulesPolyfills.NodeModulesPolyfillPlugin()
  ],
})
build({
  format: 'esm',
  entryPoints: ['hyperbee/index.js'],
  bundle: true,
  platform: 'node',
  outfile: `dist/hyperbee.${hcPkg.version}.build.js`,
  banner: {js: 'const global = {}\n'}, // for some reason this doesn't get done and we need it
  plugins: [
    GlobalsPolyfills.NodeGlobalsPolyfillPlugin({
      process: true,
      buffer: true
    }),
    NodeModulesPolyfills.NodeModulesPolyfillPlugin()
  ],
})