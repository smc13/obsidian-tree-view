import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/main.ts'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  target: 'es2020',
  external: ['obsidian'],
})