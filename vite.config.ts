import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import glsl from 'vite-plugin-glsl'

export default defineConfig(({ command }) => ({
  // GitHub Pages project sites are hosted under /<repo-name>/.
  base: command === 'build' ? '/gaby_present/' : '/',
  plugins: [react(), tailwindcss(), glsl()],
}))
