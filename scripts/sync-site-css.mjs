#!/usr/bin/env node
import { copyFile, stat } from 'node:fs/promises'
import path from 'node:path'

const source = path.resolve('../../local/templates/info_hit_amp/css/page-blog-new.css')
const target = path.resolve('src/styles/page-blog-new.snapshot.css')

try {
  await stat(source)
} catch {
  console.error('Cannot find monorepo source CSS: ../../local/templates/info_hit_amp/css/page-blog-new.css')
  console.error('This command is intended for the InfoHit monorepo checkout.')
  process.exit(1)
}

await copyFile(source, target)
console.log(`Synced ${path.relative(process.cwd(), target)} from ${path.relative(process.cwd(), source)}`)
