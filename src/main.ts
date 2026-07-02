import snapshotHtml from './snapshot/blog-page.html?raw'
import './styles/app.scss'

type ArticleMap = Record<string, string>

const modules = import.meta.glob('../articles/**/*.html', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as ArticleMap

const markerPattern = /#(ANCHOR_LIST|BANNER|REGISTRATION_[^#]+|PARTNER_COURSE_ID_[^#]+|COURSE_[^#]+|COURSES_N|SECTION_COURSES_[^#]+|IMG\d+|PHOTO\d+|MINI_IMG\d+|PERSON\d+|GALLERY|VIDEO\d+)#/g

function normalizeArticlePath(path: string): string {
  return path.replace('../articles/', '')
}

function getArticles(): ArticleMap {
  return Object.fromEntries(
    Object.entries(modules)
      .map(([path, html]) => [normalizeArticlePath(path), html])
      .sort(([a], [b]) => a.localeCompare(b, 'ru')),
  )
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderMarkers(html: string): string {
  return html.replace(markerPattern, marker => `<div class="live-marker">${escapeHtml(marker)}</div>`)
}

function getCurrentArticleName(articles: ArticleMap): string {
  const params = new URLSearchParams(window.location.search)
  const requested = params.get('article') || ''

  if (requested && articles[requested]) {
    return requested
  }

  return ''
}

function setCurrentArticle(name: string): void {
  const url = new URL(window.location.href)
  url.searchParams.set('article', name)
  window.history.pushState({}, '', url)
  renderApp()
}

function renderArticleList(articles: ArticleMap, currentArticle: string): string {
  const items = Object.keys(articles)
    .map(name => {
      const activeClass = name === currentArticle ? ' article-list__item--active' : ''
      return `
        <button class="article-list__item${activeClass}" type="button" data-article="${escapeHtml(name)}">
          <span>${escapeHtml(name)}</span>
        </button>
      `
    })
    .join('')

  return items || '<div class="empty-list">Нет HTML-файлов в articles/</div>'
}

function removeRuntimeScripts(document: Document): void {
  document.querySelectorAll('script, noscript').forEach(node => node.remove())
  document.querySelectorAll<HTMLLinkElement>('link').forEach(link => {
    const rel = (link.getAttribute('rel') || '').toLowerCase()
    const as = (link.getAttribute('as') || '').toLowerCase()
    const href = link.getAttribute('href') || ''

    if (rel.includes('modulepreload') || as === 'script' || /\.m?js(?:\?|$)/i.test(href)) {
      link.remove()
    }
  })
}

function ensureProductionBase(document: Document): void {
  document.querySelector('base')?.remove()
  const base = document.createElement('base')
  base.href = `${window.location.origin}/`
  document.head.prepend(base)
}

function injectLiveStyles(document: Document): void {
  const style = document.createElement('style')
  style.textContent = `
    .live-marker {
      margin: 22px 0;
      padding: 18px;
      color: #475569;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 14px;
      text-align: center;
      background: repeating-linear-gradient(-45deg, #f8fafc, #f8fafc 10px, #e2e8f0 10px, #e2e8f0 20px);
      border: 1px dashed #94a3b8;
      border-radius: 12px;
    }
    .blog-detail__content .live-detail-html table,
    .blog-detail-content .live-detail-html table { width: 100%; border-collapse: collapse; }
  `
  document.head.append(style)
}

function buildArticleNodes(document: Document, articleHtml: string): Node[] {
  const template = document.createElement('template')
  template.innerHTML = renderMarkers(articleHtml)

  return Array.from(template.content.childNodes)
}

function isContentNode(node: Node): boolean {
  if (node.nodeType === Node.ELEMENT_NODE) return true
  return (node.textContent || '').trim() !== ''
}

function extractLeadingTitle(nodes: Node[]): string | null {
  const firstContentIndex = nodes.findIndex(isContentNode)
  if (firstContentIndex === -1) return null

  const firstContentNode = nodes[firstContentIndex]
  if (firstContentNode.nodeType !== Node.ELEMENT_NODE) return null

  const element = firstContentNode as Element
  const tagName = element.tagName.toLowerCase()
  if (tagName !== 'h1' && tagName !== 'h2') return null

  const title = (element.textContent || '').trim()
  nodes.splice(firstContentIndex, 1)

  while (firstContentIndex > 0 && nodes[firstContentIndex - 1]?.nodeType === Node.TEXT_NODE && !(nodes[firstContentIndex - 1].textContent || '').trim()) {
    nodes.splice(firstContentIndex - 1, 1)
  }

  return title || null
}

function splitIntroNode(nodes: Node[]): [Node[], Node[]] {
  const firstParagraphIndex = nodes.findIndex(node => {
    return node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName.toLowerCase() === 'p'
  })

  if (firstParagraphIndex !== -1) {
    return [nodes.slice(0, firstParagraphIndex + 1), nodes.slice(firstParagraphIndex + 1)]
  }

  const firstContentIndex = nodes.findIndex(isContentNode)

  if (firstContentIndex === -1) {
    return [[], nodes]
  }

  return [nodes.slice(0, firstContentIndex + 1), nodes.slice(firstContentIndex + 1)]
}

function replaceArticleContent(document: Document, articleName: string, articleHtml: string): void {
  const articleNodes = buildArticleNodes(document, articleHtml)
  const articleTitle = extractLeadingTitle(articleNodes) || 'Черновик статьи'
  const [introNodes, restNodes] = splitIntroNode(articleNodes)

  document.title = `Blog Live — ${articleTitle}`

  const title = document.querySelector('.blog-detail__hero-title, .blog-detail-cover-title')
  if (title) {
    title.textContent = articleTitle
  }

  const subtitle = document.querySelector('.blog-detail__hero-subtitle, .blog-detail-cover-subtitle')
  if (subtitle) {
    subtitle.textContent = articleName
  }

  const modernContent = document.querySelector('.blog-detail__content')
  if (modernContent) {
    const keepSelectors = ['.blog-detail__content-preview', '.blog-detail__content-author']
    const keepNodes = keepSelectors
      .map(selector => modernContent.querySelector(selector))
      .filter((node): node is Element => node !== null)

    modernContent.replaceChildren(...keepNodes, ...articleNodes)
    return
  }

  const legacyArticle = document.querySelector('article.blog-detail-content, #articleText.blog-detail-content, .blog-detail-content')
  if (legacyArticle) {
    const author = legacyArticle.querySelector('.blog-detail-author')
    legacyArticle.replaceChildren(...introNodes, ...(author ? [author] : []), ...restNodes)
  }
}

function buildPreviewDocument(articleName: string, articleHtml: string): string {
  const parser = new DOMParser()
  const document = parser.parseFromString(snapshotHtml, 'text/html')

  ensureProductionBase(document)
  removeRuntimeScripts(document)
  replaceArticleContent(document, articleName, articleHtml)
  injectLiveStyles(document)

  return `<!doctype html>\n${document.documentElement.outerHTML}`
}

function renderApp(): void {
  const root = document.querySelector<HTMLDivElement>('#app')
  if (!root) return

  const articles = getArticles()
  const currentArticle = getCurrentArticleName(articles)
  const articleHtml = currentArticle ? articles[currentArticle] : ''

  document.body.classList.toggle('is-article-preview', currentArticle !== '')

  if (!currentArticle) {
    root.innerHTML = `
      <main class="landing-page">
        <section class="landing-hero">
          <div class="eyebrow">InfoHit Blog Live</div>
          <h1>Выберите статью для preview</h1>
          <p>
            HTML-файлы лежат в <code>articles/</code>. Откройте нужную статью — preview будет на всю ширину экрана,
            внутри полного production snapshot страницы блога.
          </p>
        </section>

        <section class="landing-card">
          <div class="landing-card__header">
            <h2>Статьи</h2>
            <code>pnpm article:new my-article</code>
          </div>
          <div class="article-list article-list--landing">
            ${renderArticleList(articles, currentArticle)}
          </div>
        </section>

        <section class="landing-card landing-card--muted">
          <h2>Snapshot</h2>
          <p>Обновить HTML production-страницы:</p>
          <code>pnpm snapshot:pull &lt;blog-url&gt;</code>
        </section>
      </main>
    `
  } else {
    root.innerHTML = `
      <div class="article-preview-page">
        <header class="article-topbar">
          <button class="topbar-back" type="button" data-home>← Все статьи</button>
          <div class="topbar-current">
            <div class="toolbar-label">Текущий файл</div>
            <strong>${escapeHtml(`articles/${currentArticle}`)}</strong>
          </div>
          <div class="topbar-hint">Preview на полной ширине production-страницы</div>
        </header>

        <iframe class="snapshot-frame snapshot-frame--article" title="Blog article preview"></iframe>
      </div>
    `

    const frame = root.querySelector<HTMLIFrameElement>('.snapshot-frame')
    if (frame) {
      frame.srcdoc = buildPreviewDocument(currentArticle, articleHtml)
    }
  }

  root.querySelectorAll<HTMLButtonElement>('[data-home]').forEach(button => {
    button.addEventListener('click', () => {
      const url = new URL(window.location.href)
      url.searchParams.delete('article')
      window.history.pushState({}, '', url)
      renderApp()
    })
  })

  root.querySelectorAll<HTMLButtonElement>('[data-article]').forEach(button => {
    button.addEventListener('click', () => {
      const nextArticle = button.dataset.article
      if (nextArticle) {
        setCurrentArticle(nextArticle)
      }
    })
  })
}

window.addEventListener('popstate', renderApp)
renderApp()

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    window.location.reload()
  })
}
