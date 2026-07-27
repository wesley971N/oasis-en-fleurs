// Pré-rendu SEO : après `vite build`, on charge le site dans un navigateur headless,
// on laisse React rendre tout le contenu, puis on réinjecte le HTML complet dans
// dist/index.html. Google (et les réseaux sociaux) voient alors le texte directement,
// au lieu d'une page vide qui dépend du JavaScript.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(__dirname, '..', 'dist')
const PORT = 4318

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
  '.xml': 'application/xml', '.txt': 'text/plain',
}

// Petit serveur statique du dossier dist (avec repli sur index.html)
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  let filePath = path.join(DIST, urlPath)
  try {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST, 'index.html')
    }
  } catch { filePath = path.join(DIST, 'index.html') }
  const ext = path.extname(filePath).toLowerCase()
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
  fs.createReadStream(filePath).pipe(res)
})

await new Promise((r) => server.listen(PORT, r))

let browser
try {
  browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1366, height: 900 })
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle0', timeout: 60000 })

  // Attendre que React ait rendu le contenu
  await page.waitForFunction(
    () => { const r = document.getElementById('root'); return r && r.children.length > 0 },
    { timeout: 30000 },
  )

  // Faire défiler pour déclencher les animations d'apparition (IntersectionObserver)
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0
      const t = setInterval(() => {
        window.scrollTo(0, y)
        y += 400
        if (y > document.body.scrollHeight) {
          clearInterval(t)
          window.scrollTo(0, 0)
          setTimeout(resolve, 500)
        }
      }, 90)
    })
  })
  await new Promise((r) => setTimeout(r, 1200)) // laisser les animations se stabiliser

  const html = await page.content()
  fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8')
  console.log(`✓ Pré-rendu OK — index.html = ${(html.length / 1024).toFixed(0)} Ko de HTML`)
} catch (err) {
  // Non bloquant : si le navigateur headless échoue (ex. environnement CI), on garde
  // l'index.html tel quel et le build continue plutôt que d'échouer.
  console.warn('⚠ Pré-rendu ignoré (build poursuivi) :', err?.message || err)
} finally {
  if (browser) await browser.close()
  server.close()
}
