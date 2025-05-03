import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plguins: [react()],
    css: {
        postcss: './postcss.config.js',
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
            '/auth': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        rollupOptions: {
            external: [ 'sqlite3', 'fs', 'path', 'url', 'node:url', 'fileURLToPath' ],
        },
    }
})