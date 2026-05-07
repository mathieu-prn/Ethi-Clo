import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    {
      name: 'save-captured-image',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/scan/save' && req.method === 'POST') {
            try {
              let body = ''
              for await (const chunk of req) {
                body += chunk
              }

              const json = JSON.parse(body)
              const imageDataUrl = json?.imageDataUrl
              if (typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/jpeg;base64,')) {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Invalid imageDataUrl' }))
                return
              }

              const base64 = imageDataUrl.split(',')[1]
              const buffer = Buffer.from(base64, 'base64')
              const outputDir = path.resolve(__dirname, 'public', 'scan')
              fs.mkdirSync(outputDir, { recursive: true })
              const outputPath = path.join(outputDir, 'image.jpg')
              fs.writeFileSync(outputPath, buffer)

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ url: '/scan/image.jpg' }))
            } catch (error) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: String(error) }))
            }
            return
          }
          next()
        })
      },
    },
  ],
  server: {
    host: true, // This allows your phone to connect
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  }
})
