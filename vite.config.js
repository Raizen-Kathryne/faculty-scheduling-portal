import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
//https://vite.dev//config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',      // ? ADD THIS � allows phone to connect
    port: 5173,            // ? ADD THIS � explicit port
    allowedHosts: true,
    //DELETE the entire proxy block
  },
})