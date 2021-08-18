import { Project, ScriptTarget } from 'ts-morph'
import GlobalsPolyfills from '@esbuild-plugins/node-globals-polyfill'
import NodeModulesPolyfills from '@esbuild-plugins/node-modules-polyfill'
import { build } from 'esbuild'
import fs from 'fs'
import path from 'path'
import sh from 'shelljs'

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
  outfile: `dist/hyperbee.${hbeePkg.version}.build.js`,
  banner: {js: 'const global = {}\n'}, // for some reason this doesn't get done and we need it
  plugins: [
    GlobalsPolyfills.NodeGlobalsPolyfillPlugin({
      process: true,
      buffer: true
    }),
    NodeModulesPolyfills.NodeModulesPolyfillPlugin()
  ],
})

if (sh.exec('./node_modules/.bin/tsc hyperspace-client/index.js --declaration --allowJs --emitDeclarationOnly --outdir types').code !== 0) {
  throw 'Failed to generate hyperspace-client d.ts'
}
transformDTS('types/index.d.ts', ast => {
  const HyperspaceClientCls = ast.getClass('HyperspaceClient')
  HyperspaceClientCls.getProperty('corestore').setType('(name?: any) => any')
  HyperspaceClientCls.getProperty('replicate').setType('(core?: any, cb?: any) => any')
  HyperspaceClientCls.getMethod('status').getParameter('cb').setHasQuestionToken(true)
  HyperspaceClientCls.getMethod('stop').getParameter('cb').setHasQuestionToken(true)
  HyperspaceClientCls.getMethod('ready').getParameter('cb').setHasQuestionToken(true)
})
sh.mv('types/index.d.ts', `dist/hyperspace-client.${hcPkg.version}.build.d.ts`)
if (sh.exec('./node_modules/.bin/tsc hyperbee/index.js --declaration --allowJs --emitDeclarationOnly --outdir types').code !== 0) {
  throw 'Failed to generate hyperbee d.ts'
}
sh.mv('types/index.d.ts', `dist/hyperbee.${hbeePkg.version}.build.d.ts`)
sh.rm('-rf', 'types')

function transformDTS (path, fn) {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: ScriptTarget.Latest
    },
    manipulationSettings: {
      indentationText: '  ',
      useTrailingCommas: true,
      insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,
    }
  })
  const ast = project.createSourceFile(`/index.d.ts`, fs.readFileSync(path, 'utf8'))

  fn(ast)

  ast.saveSync()
  fs.writeFileSync(path, project.getFileSystem().readFileSync('/index.d.ts'), 'utf8')
}