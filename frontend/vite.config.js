import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()], excalidraw: {
    assetPath: "/"
  },
  server: {
		allowedHosts: ["policies-artwork-king-arising.trycloudflare.com"],
	},
})
