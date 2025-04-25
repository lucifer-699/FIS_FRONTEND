import { defineConfig } from 'vite'

export default defineConfig({
 server: {
  host: '192.168.5.108',
  port: 5174,
  allowedHosts: [
    'fis.yetiairlines.com',
    'localhost',            
    '127.0.0.1'              
  ],
 }
})
