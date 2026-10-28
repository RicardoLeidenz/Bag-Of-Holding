import {
    defineConfig
} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        // Forward API calls to the Flask server during development
        // (API_PROXY_TARGET lets a second copy run on other ports, e.g. for the e2e tests)
        proxy: {
            '/api': process.env.API_PROXY_TARGET || 'http://localhost:3001'
        }
    },
    build: {
        outDir: 'dist'
    }
})