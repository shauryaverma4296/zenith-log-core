import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';

const external = [
  'winston',
  'tsyringe',
  'reflect-metadata',
  'class-transformer',
  'class-validator',
  'fs',
  'path'
];

export default [
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named'
    },
    external,
    plugins: [
      nodeResolve({
        preferBuiltins: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false
      })
    ]
  },
  // ES modules build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    external,
    plugins: [
      nodeResolve({
        preferBuiltins: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false
      })
    ]
  },
  // Type definitions
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'esm'
    },
    external,
    plugins: [dts()]
  }
];