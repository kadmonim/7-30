import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // These two packages ship ESM that Node can't load directly; let Vite bundle them.
    server: { deps: { inline: ['jewish-dates-core', 'jewish-date'] } },
  },
});
