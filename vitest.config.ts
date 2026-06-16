import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  // Default env is node (pure-logic tests). Component tests opt into jsdom with a
  // `// @vitest-environment jsdom` pragma at the top of the file.
  test: { environment: 'node', include: ['src/**/*.test.{ts,tsx}'] },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
