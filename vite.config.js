import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 允许所有网络接口访问
    port: 5173,      // 使用默认端口
    strictPort: false, // 如果端口被占用，自动尝试下一个可用端口
    open: true       // 自动打开浏览器
  }
})
