import { defineConfig, mergeConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { baseConfig } from '../vite.config.base';
import { resolve } from 'path';

export default defineConfig(
  mergeConfig(baseConfig, {
    plugins: [tsconfigPaths()],
    build: {
      minify: false,
      lib: {
        entry: resolve(__dirname, 'ts/game.ts'),
        fileName: 'game',
        formats: ['es']
      },
      outDir: '../dist/game/assets'
    }
  })
);