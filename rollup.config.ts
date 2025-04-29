// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const postConfig = {
  input: 'src/post-index.ts',
  output: {
    esModule: true,
    file: 'dist/post-index.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [typescript(), nodeResolve({ preferBuiltins: true }), commonjs()]
}

const mainConfig = {
  input: 'src/main-index.ts',
  output: {
    esModule: true,
    file: 'dist/main-index.js',
    format: 'es',
    sourcemap: true
  },
  plugins: [typescript(), nodeResolve({ preferBuiltins: true }), commonjs()]
}

export default [postConfig, mainConfig]
