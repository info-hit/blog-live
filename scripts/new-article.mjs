#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const rawName = process.argv[2]

if (!rawName) {
  console.error('Usage: pnpm article:new <name-or-folder/name>')
  process.exit(1)
}

const normalizedName = rawName
  .replace(/\\/g, '/')
  .replace(/^\/+/, '')
  .replace(/\.html$/i, '')

if (normalizedName.includes('..')) {
  console.error('Article path must stay inside articles/')
  process.exit(1)
}

const articlePath = path.resolve('articles', `${normalizedName}.html`)
const articleTitle = normalizedName
  .split('/')
  .at(-1)
  ?.replace(/[-_]+/g, ' ')
  .replace(/\b\p{L}/gu, letter => letter.toLocaleUpperCase('ru-RU')) || 'Новая статья'

const template = `<h2>${articleTitle}</h2>

<p>
  Начните верстку статьи здесь.
</p>

<p>
  Сохраняйте файл — live preview обновится автоматически.
</p>
`

await mkdir(path.dirname(articlePath), { recursive: true })
await writeFile(articlePath, template, { encoding: 'utf8', flag: 'wx' }).catch(error => {
  if (error && error.code === 'EEXIST') {
    console.error(`File already exists: ${path.relative(process.cwd(), articlePath)}`)
    process.exit(1)
  }
  throw error
})

console.log(`Created ${path.relative(process.cwd(), articlePath)}`)
