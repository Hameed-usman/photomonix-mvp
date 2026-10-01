import express from 'express'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import app from './app.mjs'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectDirectory = path.resolve(currentDirectory, '..')
const distDirectory = path.join(projectDirectory, 'dist')
const port = Number(process.env.PORT) || 3001

if (existsSync(distDirectory)) {
  app.use(express.static(distDirectory))
  app.get(/.*/, (_request, response) => response.sendFile(path.join(distDirectory, 'index.html')))
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Photomonix Express API listening on port ${port}`)
})
