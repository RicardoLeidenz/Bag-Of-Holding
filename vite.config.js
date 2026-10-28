import {
    defineConfig
} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        // Forward API calls to the Flask server during development
        proxy: {
            '/api': 'http://localhost:3001'
        }
    },
    build: {
        outDir: 'dist'
    }
})