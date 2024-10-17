import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  build: {
    rollupOptions: {
      input: 'gps.html'
    }
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/three.min.js',
          dest: 'src'
        },
        {
          src: 'src/GLTFLoader.min.js',
          dest: 'src'
        },
        {
          src: 'src/ar-threex-location-only.js',
          dest: 'src'
        }
      ]
    })
  ]
});