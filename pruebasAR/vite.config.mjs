import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '', // Set the base path to an empty string
  build: {
    rollupOptions: {
      input: 'gps.html',
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  server: {
    // Serve static files from the 'src' directory
    fs: {
      strict: false
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
        },
        {
          src: 'src/response.json',
          dest: 'src'
        }
      ]
    })
  ]
});