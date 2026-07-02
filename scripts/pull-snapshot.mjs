#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const snapshotUrl = process.argv[2] || 'https://info-hit.ru/blog/gormonalnyy-balans-chto-est-chtoby-snizit-pms-i-oblegchit-menopauzu-4470f74a/'
const target = path.resolve('src/snapshot/blog-page.html')

const response = await fetch(snapshotUrl, {
  headers: {
    'User-Agent': 'InfoHit-BlogLive-Snapshot/1.0',
  },
})

if (!response.ok) {
  console.error(`Failed to download ${snapshotUrl}: HTTP ${response.status}`)
  process.exit(1)
}

const html = await response.text()

await mkdir(path.dirname(target), { recursive: true })
await writeFile(target, html, 'utf8')

console.log(`Downloaded snapshot from ${snapshotUrl}`)
console.log(`Saved ${path.relative(process.cwd(), target)} (${html.length} chars)`)
