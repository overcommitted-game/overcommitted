import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
    // Until the first test lands in T2.
    passWithNoTests: true,
  },
  build: {
    // Phaser alone is ~1.4 MB minified (~360 kB gzip); warn only if something else grows that big.
    chunkSizeWarningLimit: 1500,
    rolldownOptions: {
      output: {
        // Phaser is big and rarely changes: its own chunk stays cached between deploys.
        codeSplitting: { groups: [{ name: 'phaser', test: /node_modules[\\/]phaser/ }] },
      },
    },
  },
});
