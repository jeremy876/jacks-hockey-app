import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: "Jack's Hockey App",
        short_name: "Jack's Hockey",
        description: "Hockey learning & play app for Jack #12",
        theme_color: '#1657C7',
        background_color: '#EAF3FB',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          { src: '/puck-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/puck-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
