/*import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export default {
  input: 'hyperspace-client/index.js',
  output: {
    dir: 'hyperspace-client-rollup',
    format: 'esm'
  },
  plugins: [
    nodePolyfills(),
    nodeResolve({
      preferBuiltins: false,
      rootDir: 'hyperspace-client'
    }),
    commonjs(),
  ]
};*/

import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';

export default {
  input: 'hyperspace-client/index.js',
  output: {
    dir: 'hyperspace-client-rollup',
    format: 'esm'
  },
  plugins: [
    commonjs({
      // non-CommonJS modules will be ignored, but you can also
      // specifically include/exclude files
      include: [ "./hyperspace-client/index.js", "hyperspace-client/node_modules/**" ], // Default: undefined

      // if true then uses of `global` won't be dealt with by this plugin
      ignoreGlobal: false, // Default: false

      // if false then skip sourceMap generation for CommonJS modules
      sourceMap: false // Default: true
    }),

    nodeResolve({
      jsnext: true,
      main: false
    })
  ]
};
