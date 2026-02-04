import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      '1601112-proxy-5173.dsw-gateway-cn-hangzhou.data.aliyun.com',
      'dsw-gateway-cn-hangzhou.data.aliyun.com'
    ],
  }
})
